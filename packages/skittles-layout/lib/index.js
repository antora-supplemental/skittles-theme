'use strict'

/**
 * @antora-supplemental/skittles-layout - Antora extension (LAYOUT overlay).
 *
 * Skittles reuses Valentus Layout unchanged (ui.supplemental_files points at
 * @antora-supplemental/valentus-layout/supplemental-ui) and adds one small
 * chrome stylesheet on top: rainbow strips, the nav/content rainbow divider,
 * rainbow TOC wire lines and thick control borders. Geometry only: every color
 * is a var(--sk-*) token from a paint (Skittles Paint).
 *
 * No logo files: the header logo comes from the layout's placeholder (to move
 * to the shared antora-ui-chassis placeholder package) or the site's header_logo.
 *
 *   antora:
 *     extensions:
 *       - require: '@antora-supplemental/light-dark-mode'
 *       - require: ./packages/skittles-layout/lib/index.js
 *       - require: ./paint/lib/index.js
 */
const fs = require('node:fs')
const path = require('node:path')

const PACKAGE_ID = '@antora-supplemental/skittles-layout'
const ASSET = 'css/skittles-chrome.css'
const SCRIPT = 'js/skittles-toc-wires.js'
const LINK = `<link rel="stylesheet" href="{{{uiRootPath}}}/${ASSET}">\n<script defer src="{{{uiRootPath}}}/${SCRIPT}"></script>`
const AFTER = /<link rel="stylesheet" href="\{\{\{uiRootPath\}\}\}\/css\/site-themed-svg\.css">/

const bodyOf = (f) => (Buffer.isBuffer(f.contents) ? f.contents.toString('utf8') : String(f.contents || ''))

/** Insert the chrome link after the last layout stylesheet (else append). */
function insertLink (source) {
  if (source.includes(LINK)) return source
  if (AFTER.test(source)) return source.replace(AFTER, (m) => `${m}\n${LINK}`)
  return `${source.replace(/\s*$/, '')}\n${LINK}\n`
}

function addAsset (uiCatalog, outDir, rel) {
  const contents = fs.readFileSync(path.join(__dirname, '..', 'supplemental-ui', rel))
  const existing = uiCatalog.findByType('asset').find((f) => f.path === rel)
  if (existing) existing.contents = contents
  else uiCatalog.addFile({ contents, type: 'asset', path: rel, out: { dirname: `${outDir}/${path.dirname(rel)}`, path: `${outDir}/${rel}`, basename: path.basename(rel) } })
}

function ensureSkittlesLayout (uiCatalog, outDir) {
  addAsset(uiCatalog, outDir, ASSET)
  addAsset(uiCatalog, outDir, SCRIPT)
  const partials = uiCatalog.findByType('partial')
  const head = partials.find((f) => f.stem === 'head-meta') || partials.find((f) => f.stem === 'head-styles')
  if (!head) return false
  head.contents = Buffer.from(insertLink(bodyOf(head)))
  return true
}

function register ({ config }) {
  config = config || {}
  const logger = this.getLogger(PACKAGE_ID)
  this.on('uiLoaded', ({ playbook, uiCatalog }) => {
    if (config.enabled === false) return
    if (ensureSkittlesLayout(uiCatalog, playbook.ui?.outputDir || '_')) logger.info(`skittles-layout: ${ASSET} linked`)
    else logger.warn('skittles-layout: no head partial; nothing linked')
  })
}

module.exports = register
module.exports.register = register
module.exports.ensureSkittlesLayout = ensureSkittlesLayout
module.exports.insertLink = insertLink
module.exports.ASSET = ASSET
module.exports.SCRIPT = SCRIPT
