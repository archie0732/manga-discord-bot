import { fetch_cookie_and_header } from './website_fetch';

const test_fetch_nhentai = async () => {
  // 1. 取得完整的資料
  const result = await fetch_cookie_and_header('https://nhentai.net');

  if (!result || !result.cookies || result.cookies.length === 0) {
    return '[nhentai fetch] 找不到 Cookies';
  }

  // 2. 格式化所有 Cookies
  const cookieString = result.cookies
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  // 3. 發送請求
  const response = await fetch('https://nhentai.net', {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Cookie': cookieString,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': 'https://nhentai.net/',
    },
  });

  if (!response.ok) {
    return `[nhentai fetch] 狀態碼錯誤: ${response.status}`;
  }

  const text = await response.text();
  return text;
};

test_fetch_nhentai().then(console.log).catch(console.error);
