// Screenshots of every scheme plus chrome close-ups. Serve build/site first.
// BASE=http://localhost:8093 OUT=/workspace node scripts/screenshots.mjs
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const BASE = process.env.BASE || 'http://localhost:8093'
const OUT = process.env.OUT || 'build/screenshots'
const schemes = JSON.parse(readFileSync(new URL('../paint/schemes.generated.json', import.meta.url), 'utf8'))
// Published screenshots: no scrollbar and no reserved scrollbar-gutter, so content fills the full width.
const NO_SCROLLBAR_CSS = 'html,body{scrollbar-width:none!important;scrollbar-gutter:auto!important}::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}'
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--hide-scrollbars'] })
async function open (s, path, vp = { width: 1400, height: Number(process.env.HEIGHT) || 900 }) {
  const ctx = await browser.newContext({ colorScheme: s.base, viewport: vp, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.goto(`${BASE}${path}?scheme=${s.id}`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => !document.documentElement.classList.contains('valentus-fouc-pending'))
  await page.addStyleTag({ content: NO_SCROLLBAR_CSS })
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  return { ctx, page }
}
for (const s of schemes) {
  const { ctx, page } = await open(s, '/skittles-theme/0.1/guide/index.html')
  await page.screenshot({ path: `${OUT}/skittles-scheme-${s.id}.png` })
  await ctx.close()
}
const by = Object.fromEntries(schemes.map((s) => [s.id, s]))
const shots = [
  ['grapelight', '/demo-pages/typography.html', 'aside.toc', 'skittles-closeup-toc-wires'],
  ['strawberrydark', '/demo-pages/typography.html', 'aside.toc', 'skittles-closeup-toc-wires-dark'],
]
for (const [id, path, sel, name] of shots) {
  const { ctx, page } = await open(by[id], path)
  const el = await page.$(sel)
  const bb = el && (await el.boundingBox())
  if (bb) await page.screenshot({ path: `${OUT}/${name}.png`, clip: { x: bb.x, y: bb.y, width: bb.width, height: Math.min(bb.height, 520) } })
  await ctx.close()
}
{
  const { ctx, page } = await open(by.orangelight, '/demo-pages/tables.html')
  const nav = await (await page.$('.nav-container')).boundingBox()
  await page.screenshot({ path: `${OUT}/skittles-closeup-nav-divider.png`, clip: { x: Math.max(0, nav.x + nav.width - 220), y: nav.y, width: 440, height: 420 } })
  await page.screenshot({ path: `${OUT}/skittles-closeup-strip-top.png`, clip: { x: 0, y: 0, width: 1400, height: 90 } })
  await page.screenshot({ path: `${OUT}/skittles-closeup-strip-bottom.png`, clip: { x: 0, y: 900 - 90, width: 1400, height: 90 } })
  await ctx.close()
}
for (const id of ['light', 'orangedark', 'lemonlight', 'greendark', 'grapesoda']) {
  const { ctx, page } = await open(by[id], '/skittles-theme/0.1/guide/index.html')
  const bb = await (await page.$('.valentus-header-logo-item')).boundingBox()
  await page.screenshot({ path: `${OUT}/skittles-logo-${id}.png`, clip: { x: Math.max(0, bb.x - 16), y: Math.max(0, bb.y - 16), width: bb.width + 220, height: bb.height + 32 } })
  await ctx.close()
}
await browser.close()
