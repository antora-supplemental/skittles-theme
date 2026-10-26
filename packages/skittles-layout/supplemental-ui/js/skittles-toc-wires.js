/* Skittles TOC wires: one continuous rainbow for the whole tree.
   Every rail and stub paints the same gradient, sized to the full .toc-menu
   height (--sk-toc-h) and shifted by its own offset (--sk-wire-y), so each
   segment shows the slice of rainbow at its vertical position. Decorative. */
;(function () {
  'use strict'
  function px (v) { var n = parseFloat(v); return isNaN(n) ? 0 : n }
  function sync () {
    var menus = document.querySelectorAll('.toc .toc-menu')
    for (var i = 0; i < menus.length; i++) {
      var menu = menus[i]
      var box = menu.getBoundingClientRect()
      menu.style.setProperty('--sk-toc-h', menu.scrollHeight + 'px')
      var els = menu.querySelectorAll('ul, li')
      for (var j = 0; j < els.length; j++) {
        var el = els[j]
        var y = el.getBoundingClientRect().top - box.top + menu.scrollTop + px(getComputedStyle(el, '::before').top)
        el.style.setProperty('--sk-wire-y', Math.round(y) + 'px')
      }
    }
  }
  var queued = false
  function schedule () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; sync() }) }
  function start () {
    schedule()
    var toc = document.querySelector('aside.toc')
    if (toc && window.MutationObserver) new MutationObserver(schedule).observe(toc, { childList: true, subtree: true })
    if (toc && window.ResizeObserver) new ResizeObserver(schedule).observe(toc)
    window.addEventListener('resize', schedule)
    window.addEventListener('load', schedule)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
})()
