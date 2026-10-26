'use strict'
const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')
const { contrast } = require('../lib/contrast.js')
const paint = require('../lib/index.js')

const ROOT = path.join(__dirname, '..')
const css = fs.readFileSync(path.join(ROOT, 'css/skittles-paint.css'), 'utf8')
const schemes = require('../schemes.generated.json')
const manifest = JSON.parse(/\/\*\s*@color-schemes([\s\S]*?)\*\//.exec(css)[1])

test('manifest comes first and declares 11 schemes incl. built-in light and dark', () => {
  assert.ok(css.startsWith('/* @color-schemes'))
  assert.strictEqual(Object.keys(manifest).length, 11)
  assert.ok(manifest.light && manifest.dark)
})

test('every scheme is a light or dark slot candidate, except Grape Soda (slot none)', () => {
  for (const [id, e] of Object.entries(manifest)) {
    if (id === 'grapesoda') { assert.deepStrictEqual(e.slots, []); continue }
    if (id === 'light' || id === 'dark') { assert.strictEqual(e.slots, undefined); continue }
    assert.strictEqual(e.slots.length, 1, id)
    assert.ok(['light', 'dark'].includes(e.slots[0]), id)
    assert.ok(id.endsWith(e.slots[0]), `${id} slot matches its name`)
  }
})

test('text 4.5:1 and boundaries 3:1 on every surface of every scheme', () => {
  for (const s of schemes) {
    const t = s.tokens
    for (const bg of [t.canvas, t.elevated, t.panel]) {
      for (const k of ['ink', 'heading', 'inkMuted', 'link', 'linkHover']) assert.ok(contrast(t[k], bg) >= 4.5, `${s.id} ${k} on ${bg}`)
      assert.ok(contrast(t.border, bg) >= 3, `${s.id} border on ${bg}`)
    }
    assert.ok(contrast(t.codeFg, t.codeBg) >= 7, `${s.id} code`)
    assert.ok(contrast(t.inlineCodeFg, t.inlineCodeBg) >= 4.5, `${s.id} inline code`)
  }
})

test('links contrast with the dominant-colored borders (distinct hue, not lightness-only)', () => {
  const hue = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    const mx = Math.max(r, g, b); const d = mx - Math.min(r, g, b)
    if (!d) return 0
    const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
    return (h * 60 + 360) % 360
  }
  for (const s of schemes) {
    const dh = Math.abs(hue(s.tokens.link) - hue(s.tokens.border))
    assert.ok(Math.min(dh, 360 - dh) >= 90, `${s.id}: link hue must sit 90deg+ from the border hue`)
  }
})

test('insertLink uses the paint slot', () => {
  const out = paint.insertLink(`a\n${paint.SLOT}\nb`)
  assert.ok(out.includes(`${paint.SLOT}\n<link rel="stylesheet" href="{{{uiRootPath}}}/css/skittles-paint.css">`))
  assert.strictEqual(paint.insertLink(out), out)
})
