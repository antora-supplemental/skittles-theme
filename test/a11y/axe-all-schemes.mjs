// axe-core on 5 pages x every Skittles scheme (WCAG 2.x A/AA incl. color-contrast).
// Usage: serve build/site, then  BASE=http://localhost:8093 CHROME=/usr/bin/google-chrome node test/a11y/axe-all-schemes.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const require = createRequire(import.meta.url)
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const BASE = process.env.BASE || 'http://localhost:8093'
const schemes = JSON.parse(readFileSync(new URL('../../paint/schemes.generated.json', import.meta.url), 'utf8'))
const PAGES = ['/skittles-theme/0.1/guide/index.html', '/demo-pages/admonitions.html', '/demo-pages/code-blocks.html', '/demo-pages/tables.html', '/demo-pages/typography.html']

const GATED = ['color-contrast', 'link-in-text-block', 'non-text-contrast']
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome' })
const results = []
let failures = 0
for (const s of schemes) {
  const ctx = await browser.newContext({ colorScheme: s.base, viewport: { width: 1400, height: 1000 } })
  const page = await ctx.newPage()
  for (const p of PAGES) {
    await page.goto(`${BASE}${p}?scheme=${s.id}`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => !document.documentElement.classList.contains('valentus-fouc-pending'))
    // First visit in a fresh context can resolve before the ?scheme pick is applied: reload once.
    if ((await page.evaluate(() => document.documentElement.dataset.scheme)) !== s.id) await page.reload({ waitUntil: 'networkidle' })
    const state = await page.evaluate(() => ({ scheme: document.documentElement.dataset.scheme || '', dark: document.documentElement.classList.contains('dark-theme') }))
    await page.addScriptTag({ content: AXE })
    const r = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }))
    const v = r.violations.map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.length, sample: x.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n').slice(1, 2).join('')) }))
    // Gate on the paint's job: contrast. Structural findings (Default UI / layout markup) are reported, not gated.
    failures += v.filter((x) => GATED.includes(x.id)).length
    results.push({ scheme: s.id, page: p, state, violations: v })
    console.log(`${s.id.padEnd(15)} ${p.padEnd(36)} data-scheme=${state.scheme || '-'} dark=${state.dark} violations=${v.map((x) => `${x.id}(${x.n})`).join(',') || 0}`)
  }
  await ctx.close()
}
await browser.close()
writeFileSync(new URL('./axe-results.json', import.meta.url), JSON.stringify(results, null, 2) + '\n')
console.log(`${results.length} page runs, ${failures} gated (contrast) violation groups`)
process.exit(failures ? 1 : 0)
