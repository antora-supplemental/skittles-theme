// Real-browser regression test: the article must start near the top of the viewport
// (no blank gap above the content) at phone, tablet and desktop widths, light and dark,
// right after load and 2 s later (late script injection or scroll jumps).
// Usage: serve build/site, then  BASE=http://localhost:8093 CHROME=/usr/bin/google-chrome node test/layout/content-top.mjs
import { chromium } from 'playwright-core'

const BASE = process.env.BASE || 'http://localhost:8093'
const PAGES = ['/skittles-theme/0.1/guide/index.html', '/skittles-theme/0.1/guide/installation.html', '/skittles-theme/0.1/color-schemes.html', '/demo-pages/index.html']
// Phones are emulated with touch, a mobile UA and DPR 3; the scheme is persisted in localStorage.
const SIZES = [[320, 740], [360, 740], [390, 844], [768, 1024], [900, 800], [1023, 800], [1024, 768], [1280, 800], [1366, 768], [1920, 1080], [1920, 1200]]
const MAX_TOP = 300 // px from the document top to the article; header + mast are ~200

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome' })
let failures = 0
for (const scheme of ['light', 'dark']) {
  for (const [width, height] of SIZES) {
    const mobile = width < 1024
    const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width, height }, deviceScaleFactor: mobile ? 3 : 1, isMobile: mobile, hasTouch: mobile, userAgent: mobile ? 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' : undefined })
    await ctx.addInitScript((s) => { try { localStorage.setItem('valentus-theme', s) } catch {} }, scheme)
    const page = await ctx.newPage()
    for (const p of PAGES) {
      await page.goto(BASE + p, { waitUntil: 'load' })
      await page.evaluate(() => window.scrollTo(0, 0))
      const probe = () => page.evaluate(() => {
        const a = document.querySelector('article.doc') || document.querySelector('main')
        return { top: Math.round(a.getBoundingClientRect().top + window.scrollY), scrollY: Math.round(window.scrollY), overflow: document.documentElement.scrollWidth - window.innerWidth }
      })
      const first = await probe()
      await page.waitForTimeout(2000)
      const later = await probe()
      const bad = first.top > MAX_TOP || later.top > MAX_TOP || first.scrollY !== 0 || later.scrollY !== 0 || later.overflow > 0
      if (bad) failures++
      console.log(`${bad ? 'FAIL' : 'ok  '} ${scheme.padEnd(5)} ${String(width).padStart(4)}x${height} ${p} top=${first.top}/${later.top} scrollY=${first.scrollY}/${later.scrollY} overflowX=${later.overflow}`)
    }
    await ctx.close()
  }
}
await browser.close()
console.log(`${failures} failing page/size runs`)
process.exit(failures ? 1 : 0)
