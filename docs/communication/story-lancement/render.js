const { chromium } = require(process.env.PW);
const path = require('path');
(async () => {
  const dir = process.argv[2], mode = process.argv[3];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(dir, 'story.html')); await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  const fps = 30;
  const times = mode === 'preview' ? [0.9, 2.6, 4.6, 5.9, 8.4, 9.2, 11.4, 13.6, 16.8] : Array.from({ length: Math.round(18 * fps) }, (_, i) => i / fps);
  let n = 0;
  for (const t of times) {
    await p.evaluate((t) => window.setTime(t), t);
    await p.screenshot({ path: path.join(dir, mode === 'preview' ? `prev-${t}.png` : `frames/f${String(n).padStart(4, '0')}.png`) });
    n++;
  }
  console.log('frames', n, 'errors', errs);
  await b.close();
})();
