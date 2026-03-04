export interface MangaInterface {
  id: string;
  title: string;
  author: string[];
  tags: string[];
  thum: string;
  status: string;
  latest_chapter: string;
  latest_chapter_url: string;
  latest_update_date: string;
  detail: string;
  url: string;
  rank: number;
}

export abstract class BaseScraper implements MangaInterface {
  protected base_url: string = '';
  public id: string;
  public title: string = '';
  public thum: string = '';
  public author: string[] = [];
  public latest_chapter: string = '';
  public tags: string[] = [];
  public status: string = '連載中';
  public latest_chapter_url: string = '';
  public latest_update_date: string = '2026-02-08';
  public detail: string = '';
  public url: string = '';
  public rank = 0;

  constructor(id: string) {
    this.id = id;
  }

  abstract scraper(): Promise<void>;

  protected handleError(message: string) {
    throw new ScraperError(message, this);
  }

  getMangaInformation(): MangaInterface {
    return {
      author: this.author,
      id: this.id,
      title: this.title,
      tags: this.tags,
      url: this.url,
      thum: this.thum,
      detail: this.detail,
      latest_chapter: this.latest_chapter,
      latest_chapter_url: this.latest_chapter_url,
      latest_update_date: this.latest_update_date,
      status: this.status,
      rank: this.rank,
    };
  }
}

export class ScraperError<T> extends Error {
  public scraper: T;

  constructor(message: string, scraper: T) {
    super(message);
    this.name = 'ScraperError';
    this.scraper = scraper;
    Object.setPrototypeOf(this, ScraperError.prepareStackTrace);
  }
}

export abstract class R7SearchAPI {
  abstract search(keyword: string): Promise<void>;
}

export class R7SearchError<T> extends Error {
  public scrap: T;

  constructor(message: string, scrap: T) {
    super(message);
    this.name = 'R7SearchError';
    this.scrap = scrap;
  }
}
