/* eslint-disable */
// @ts-nocheck

export function initScript({ wingifyAccountId, settingsTolerance = 2000 }) {
  const preconnect = document.createElement('link')
  preconnect.rel = 'preconnect'
  preconnect.href = 'https://edge.wingify.net'
  document.head.appendChild(preconnect)

  window._wingify_code ||
    (function () {
      var account_id = wingifyAccountId,
        version = 3.0,
        settings_tolerance = settingsTolerance,
        hide_element = 'body',
        hide_element_style =
          'opacity:0 !important;filter:alpha(opacity=0) !important;background:none !important;transition:none !important'
      /* DO NOT EDIT BELOW THIS LINE */
      var t = window,
        n = document
      if (-1 < n.URL.indexOf('__wingify_disable__') || t._wingify_code) return
      var i = !1,
        o = n.currentScript,
        e = { sT: settings_tolerance, hES: hide_element_style, hE: hide_element }
      try {
        var c = JSON.parse(localStorage.getItem('_wingify_' + account_id + '_config'))
        e = Object.assign(c && typeof c === 'object' ? c : {}, e)
      } catch (e) {}
      var code = {
        nonce: o && o.nonce,
        settings_tolerance: function () {
          return e.sT
        },
        hide_element: function () {
          if (
            typeof performance !== 'undefined' &&
            typeof performance.getEntriesByName === 'function' &&
            performance.getEntriesByName('first-contentful-paint')[0]
          ) {
            return ''
          }
          return e.hE
        },
        hide_element_style: function () {
          return '{' + e.hES + '}'
        },
        getVersion: function () {
          return version
        },
        finish: function () {
          var e
          !i && ((i = !0), (e = n.getElementById('_vis_opt_path_hides')) && e.parentNode.removeChild(e))
        },
        finished: function () {
          return i
        },
        addScript: function (e) {
          var t = n.createElement('script')
          t.src = e
          o && o.nonce && t.setAttribute('nonce', o.nonce)
          t.fetchPriority = 'high'
          n.head.appendChild(t)
        },
        init: function () {
          t._wingify_settings_timer = setTimeout(function () {
            code.finish()
          }, this.settings_tolerance())
          var e = n.createElement('style')
          e.id = '_vis_opt_path_hides'
          o && o.nonce && e.setAttribute('nonce', o.nonce)
          e.textContent = this.hide_element() + this.hide_element_style()
          n.head.appendChild(e)
          this.addScript('https://edge.wingify.net/tag/' + account_id + '.js')
        }
      }
      t._wingify_code = code
      code.init()
    })()
}
