'use strict'
const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')
const layout = require('../packages/skittles-layout/lib/index.js')

const ROOT = path.join(__dirname, '..')
const chrome = fs.readFileSync(path.join(ROOT, 'packages/skittles-layout/supplemental-ui/css/skittles-chrome.css'), 'utf8')

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))

test('layout overlay has no literal colors (paint owns color)', () => {
  const body = chrome.replace(/\/\*[\s\S]*?\*\//g, '')
  assert.doesNotMatch(body, /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i)
})

test('strips, divider and wires are CSS pseudo-elements, reduced motion honored', () => {
  assert.match(chrome, /body::before/)
  assert.match(chrome, /body::after/)
  assert.match(chrome, /\.nav-container::after/)
  assert.match(chrome, /\.toc \.toc-menu ul::before/)
  assert.match(chrome, /prefers-reduced-motion: reduce/)
})

test('the shipped layout overlay carries no logo files', () => {
  for (const f of walk(path.join(ROOT, 'packages/skittles-layout'))) assert.doesNotMatch(path.basename(f), /logo|favicon|\.svg$|\.png$/i, f)
})

test('insertLink goes after the last Valentus layout stylesheet', () => {
  const src = '<link rel="stylesheet" href="{{{uiRootPath}}}/css/site-themed-svg.css">\n<script></script>'
  const out = layout.insertLink(src)
  assert.ok(out.indexOf('skittles-chrome.css') > out.indexOf('site-themed-svg.css'))
  assert.ok(out.indexOf('skittles-chrome.css') < out.indexOf('<script>'))
  assert.strictEqual(layout.insertLink(out), out)
})

test('brand overlay overrides the placeholder partial with the --sk-dominant skittle', () => {
  const mark = fs.readFileSync(path.join(ROOT, 'docs/brand/supplemental-ui/partials/brand-placeholder-logo.hbs'), 'utf8')
  assert.match(mark, /var\(--sk-dominant/)
  assert.match(mark, /var\(--sk-outline/)
  assert.ok(require('../docs/brand/lib/brand-overlay.js').PLACEHOLDER_STEMS.includes('brand-placeholder-logo'))
})

test('overlay never repositions .nav-container (mobile drawer must stay fixed, out of flow)', () => {
  const body = chrome.replace(/\/\*[\s\S]*?\*\//g, '')
  assert.doesNotMatch(body, /\.nav-container\s*(,[^{]*)?\{[^}]*\bposition\s*:/)
})
