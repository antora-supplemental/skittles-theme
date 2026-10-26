// Post-build: give every _/css and _/js (and search-index.js) URL in the built HTML a per-build
// ?v=<hash> query. GitHub Pages serves CSS/JS with a 4 h max-age and unversioned names, so phones
// kept old stylesheets for hours after a fix. Usage: node scripts/cache-bust.mjs [build/site]
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const root = process.argv[2] || 'build/site'
const files = []
const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : files.push(p) } }
walk(root)
const h = createHash('sha256')
for (const f of files.filter((f) => /[\\/]_[\\/]/.test(f) || f.endsWith('search-index.js')).sort()) h.update(f).update(readFileSync(f))
const v = h.digest('hex').slice(0, 10)
const re = /((?:href|src)="[^"?#]*(?:\/_\/(?:css|js)\/[^"?#]+|search-index\.js))"/g
let n = 0
for (const f of files.filter((f) => f.endsWith('.html'))) {
  const t = readFileSync(f, 'utf8')
  const u = t.replace(re, (m, a) => { n++; return a + '?v=' + v + '"' })
  if (u !== t) writeFileSync(f, u)
}
console.log('cache-bust v=' + v + ': ' + n + ' asset URLs')
