import { load } from 'cheerio';
import { BaseScraper } from '../model';

export class ManhuaguiManga extends BaseScraper {
  protected base_url: string = 'https://tw.manhuagui.com/comic';

  async scraper(): Promise<void> {
    this.url = `${this.base_url}/${this.id}/`;

    const response = await fetch(this.url);

    if (!response.ok) {
      this.handleError(`fetch ${this.url} error, status code: ${response.status}`);
    }

    const $ = load(await response.text());

    this.title = $('h1').text() ?? '';

    $('ul.detail-list.cf').find('li').eq(1).find('span').eq(1).find('a').each((_, element) => {
      this.author.push($(element).text() ?? '');
    });
    $('ul.detail-list.cf').find('li').eq(1).find('span').eq(0).find('a').each((i, element) => {
      this.tags.push($(element).text() ?? '');
    });

    this.status = $('li.status').find('span').find('span').eq(0).text() ?? '';
    this.latest_chapter = $('li.status').find('span').find('a').text() ?? '';
    this.latest_chapter_url = `${this.url}/${$('li.status').find('span').find('a').attr('href')?.split('/')[3]?.split('.')[0]}`;
    this.latest_update_date = $('li.status').find('span').find('span').eq(1).text() ?? '';

    this.thum = 'https:' + $('p.hcover').find('img').attr('src');

    this.detail = $('div#intro-cut').text() ?? '';

    this.rank = Number($('div.rank.pa').find('strong').text());
  }
}
