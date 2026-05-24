import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
