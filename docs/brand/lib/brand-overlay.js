'use strict'

/**
 * Skittles demo/docs brand overlay (NOT part of the shipped bundle).
 *
 * The Skittles bundle carries no logo files: consumers get the shared placeholder
 * from @antora-supplemental/brand-placeholder (baked into the bundle; Valentus
 * Layout 4.2 calls its brand-logo partial). This overlay replaces that package's
 * brand-placeholder-logo partial on this demo site only; register it after the
 * brand-placeholder extension.
 *
 * This site's own skittle mark replaces the placeholder partial with an inline SVG
 * filled with var(--sk-dominant), so it changes with every scheme. Files under
 * docs/brand/supplemental-ui replace same-path UI files (assets and partials).
 */
const fs = require('node:fs')
const path = require('node:path')

const DIR = path.join(__dirname, '..', 'supplemental-ui')
const PLACEHOLDER_STEMS = ['brand-placeholder-logo']

function walk (dir, base = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const rel = base ? `${base}/${e.name}` : e.name
    return e.isDirectory() ? walk(path.join(dir, e.name), rel) : [rel]
  })
}

module.exports.PLACEHOLDER_STEMS = PLACEHOLDER_STEMS
module.exports.register = function () {
  this.once('uiLoaded', ({ playbook, uiCatalog }) => {
    const outDir = (playbook.ui && playbook.ui.outputDir) || '_'
    for (const rel of walk(DIR)) {
      const contents = fs.readFileSync(path.join(DIR, rel))
      if (rel.startsWith('partials/')) {
        const stem = path.posix.basename(rel, '.hbs')
        const stems = stem === 'brand-placeholder-logo' ? PLACEHOLDER_STEMS : [stem]
        for (const s of stems) {
          const p = uiCatalog.findByType('partial').find((f) => f.stem === s)
          if (p) p.contents = contents
          else uiCatalog.addFile({ contents, type: 'partial', path: `partials/${s}.hbs`, stem: s })
        }
        continue
      }
      const existing = uiCatalog.findByType('asset').find((f) => f.path === rel)
      if (existing) { existing.contents = contents; continue }
      const dirname = path.posix.dirname(rel)
      const basename = path.posix.basename(rel)
      const out = `${outDir}/${dirname}`
      uiCatalog.addFile({ contents, type: 'asset', path: rel, out: { dirname: out, path: `${out}/${basename}`, basename } })
    }
  })
}
