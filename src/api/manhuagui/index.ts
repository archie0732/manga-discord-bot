import { load } from 'cheerio';
import { BaseScraper, R7SearchAPI, R7SearchError } from '../model';

export class ManhuaguiManga extends BaseScraper {
  protected base_url: string = 'https://tw.manhuagui.com/comic';

  async scraper(): Promise<void> {
    this.url = `${this.base_url}/${this.id}/`;

    const response = await fetch(this.url);

    if (!response.ok) {
      this.handleError(
        `fetch ${this.url} error, status code: ${response.status}`,
      );
    }

    const $ = load(await response.text());

    this.title = $('h1').text() ?? '';

    $('ul.detail-list.cf')
      .find('li')
      .eq(1)
      .find('span')
      .eq(1)
      .find('a')
      .each((_, element) => {
        this.author.push($(element).text() ?? '');
      });
    $('ul.detail-list.cf')
      .find('li')
      .eq(1)
      .find('span')
      .eq(0)
      .find('a')
      .each((i, element) => {
        this.tags.push($(element).text() ?? '');
      });

    this.status = $('li.status').find('span').find('span').eq(0).text() ?? '';
    this.latest_chapter = $('li.status').find('span').find('a').text() ?? '';
    this.latest_chapter_url = `${this.url}/${$('li.status').find('span').find('a').attr('href')?.split('/')[3]?.split('.')[0]}`;
    this.latest_update_date
      = $('li.status').find('span').find('span').eq(1).text() ?? '';

    this.thum = 'https:' + $('p.hcover').find('img').attr('src');

    this.detail = $('div#intro-cut').text() ?? '';

    this.rank = Number($('div.rank.pa').find('strong').text());
  }
}

export interface ManhuaguiSearchResult {
  title: string;
  thumb: string;
  url: string;
  id: string;
}

export class ManhuaguiSearchAPI extends R7SearchAPI {
  url: string = '';
  public searchResults: ManhuaguiSearchResult[] = [];
  private html: string = '';

  async search(keyword: string): Promise<void> {
    this.url = `https://tw.manhuagui.com/s/${keyword === '' ? '總之' : keyword}.html`;
    const response = await fetch(this.url);

    if (!response.ok) {
      throw new R7SearchError(
        `Failed to fetch data from Manhuagui: ${response.status}`,
        `${this.url}`,
      );
    }
    this.html = await response.text();
    const $ = load(this.html);

    $('.book-result')
      .find('li.cf')
      .each((_, element) => {
        const title = $(element).find('.book-detail').find('a').attr('title') ?? '';
        const url
          = 'https://tw.manhuagui.com'
            + $(element).find('.book-detail').find('a').attr('href');
        const thumb
          = 'https:' + $(element).find('.book-cover').find('img').attr('src');
        const id = url.split('/')[4] ?? '';

        this.searchResults.push({ title, thumb, url, id });
      });
  }

  checkDataResult(): void {
    if (!this.searchResults.length) {
      throw new R7SearchError('No search results found', this.html);
    }

    if (
      this.searchResults.some(
        (r) => r.thumb === undefined || r.thumb === null || r.thumb === '',
      )
    ) {
      throw new R7SearchError(
        'Some search results are missing thumbnails',
        this.html,
      );
    }
  }
}
