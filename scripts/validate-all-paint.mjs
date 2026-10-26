#!/usr/bin/env node
// Regenerate check + strict validate-paint + manifest sanity for Skittles Paint.
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const css = readFileSync(new URL('../paint/css/skittles-paint.css', import.meta.url), 'utf8')
const { build } = await import('./build-schemes.mjs')
const before = css
build()
if (readFileSync(new URL('../paint/css/skittles-paint.css', import.meta.url), 'utf8') !== before) {
  console.error('paint/css/skittles-paint.css was stale; regenerated (commit the result)'); process.exitCode = 1
}
const validator = 'node_modules/@antora-supplemental/color-scheme/scripts/validate-paint.mjs'
execFileSync(process.execPath, [validator, 'paint/css/skittles-paint.css', '--strict', '--extra=.valentus-,.skittles-'], { stdio: 'inherit' })
const m = JSON.parse(/\/\*\s*@color-schemes([\s\S]*?)\*\//.exec(before)[1])
const ids = Object.keys(m)
if (ids.length !== 11) throw new Error(`expected 11 schemes, got ${ids.length}`)
for (const id of ids) {
  if (!/^[a-z][a-z0-9]*$/.test(id)) throw new Error(`bad scheme id ${id}`)
  const sel = id === 'light' ? ':root {' : id === 'dark' ? 'html.dark-theme {' : `[data-scheme="${id}"]`
  if (!before.includes(sel)) throw new Error(`scheme ${id}: no token block`)
}
console.log(`ok: ${ids.length} schemes (${ids.join(', ')})`)
