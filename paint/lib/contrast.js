'use strict'
/* sRGB / HSL helpers and WCAG 2.x contrast, used by scripts/build-schemes.mjs and the tests. */

function hslToHex (h, s, l) {
  s /= 100; l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

function luminance (hex) {
  const n = hex.replace('#', '')
  const rgb = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
  const lin = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

function contrast (a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

/**
 * Most vivid HSL color of hue h / saturation s that reaches `min` contrast
 * against every background: walks lightness from `start` toward black
 * (dir -1, light schemes) or white (dir +1, dark schemes).
 */
function solve (h, s, start, dir, bgs, min) {
  for (let l = start; l >= 0 && l <= 100; l += dir * 0.5) {
    const hex = hslToHex(h, s, l)
    if (bgs.every((bg) => contrast(hex, bg) >= min)) return hex
  }
  throw new Error(`no color for hue ${h} reaches ${min}:1`)
}

module.exports = { hslToHex, luminance, contrast, solve }
