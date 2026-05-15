import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export const fetch_cookie_and_header = async (url: string): Promise<NhentaiHeader> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
    ],
  });

  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

  let navigationHeader: Record<string, string> = {};

  page.on('request', (req) => {
    if (req.isNavigationRequest() && req.url() === url) {
      navigationHeader = req.headers();
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.mouse.move(100, 100);

    await new Promise((r) => setTimeout(r, 5000));

    const cookies = await page.cookies() as NhentaiCookie[];

    await browser.close();

    return {
      cookies,
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    };
  }
  catch (error) {
    console.error('抓取失敗:', error);
    await browser.close();
    throw error;
  }
};

export interface NhentaiCookie {
  name: string; // 'cf_clearance'
  value: string;
  domain: string; // .nhentai.net
  path: string;
  expires: number;
  size: number;
  httpOnly: boolean;
  secure: boolean;
  session: boolean;
  sameSite: string;
  priority: string;
  sourceScheme: string;
  partitionKey: string;
  sameParty: boolean;
}

export interface NhentaiHeader {
  cookies: NhentaiCookie[];
  user_agent: string;
}

fetch_cookie_and_header('https://nhentai.net').then(console.log).catch(console.error);
