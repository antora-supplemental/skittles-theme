#!/usr/bin/env node
// Assemble an unpacked Skittles UI bundle (release.yml zips it):
//   build-bundle.mjs <unpacked-default-ui-dir> <out-dir> [--no-paint]
// = Antora Default UI + Valentus Layout supplemental-ui (dependency) + Skittles Layout
//   overlay (css/skittles-chrome.css linked after the layout CSS) [+ baked Skittles Paint].
// Adds no logo files: the header shows the layout placeholder unless the site sets header_logo.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { execFileSync } from 'node:child_process'

const [base, out] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
if (!base || !out) { console.error('usage: build-bundle.mjs <default-ui-dir> <out-dir> [--no-paint]'); process.exit(2) }
const require = createRequire(import.meta.url)
const layoutDir = join(dirname(require.resolve('@antora-supplemental/valentus-layout/package.json')), 'supplemental-ui')
const overlay = require('../packages/skittles-layout/lib/index.js')
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
cpSync(base, out, { recursive: true })
cpSync(layoutDir, out, { recursive: true })
const css = join(out, overlay.ASSET)
cpSync(new URL('../packages/skittles-layout/supplemental-ui/' + overlay.ASSET, import.meta.url), css)
const head = join(out, 'partials', 'head-meta.hbs')
writeFileSync(head, overlay.insertLink(readFileSync(head, 'utf8')))
console.log(`skittles-layout overlay applied to ${out}`)
if (!process.argv.includes('--no-paint')) execFileSync(process.execPath, [new URL('./bake-paint.mjs', import.meta.url).pathname, out], { stdio: 'inherit' })
if (!existsSync(join(out, 'partials', 'header-content.hbs'))) { console.error('layout partials missing'); process.exit(1) }
