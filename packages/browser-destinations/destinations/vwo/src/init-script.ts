/* eslint-disable */
// @ts-nocheck

// If `account_id` is greater than this threshold, we load the VWO smartcode v3 and if not then the original smartcode v2.1
const GENERIC_TEMPLATE_ACCOUNT_ID_THRESHOLD = 1200000

export function initScript({
  vwoAccountId,
  settingsTolerance = 2000,
  libraryTolerance = 2500,
  useExistingJquery = false,
  isSpa = 1
}) {
  // Generic smart-code template for high account IDs.
  if (Number(vwoAccountId) > GENERIC_TEMPLATE_ACCOUNT_ID_THRESHOLD) {
    window._vwo_code ||
      (function () {
        var account_id = vwoAccountId,
          version = 3.0,
          settings_tolerance = settingsTolerance,
          hide_element = 'body',
          hide_element_style =
            'opacity:0 !important;filter:alpha(opacity=0) !important;background:none !important;transition:none !important'

        /* DO NOT EDIT BELOW THIS LINE */
        var t = window,
          n = document
        if (n.URL.indexOf('__vwo_disable__') > -1 || t._vwo_code) return
        var i = !1,
          o = n.currentScript,
          e = { sT: settings_tolerance, hES: hide_element_style, hE: hide_element }
        try {
          e = Object.assign(JSON.parse(localStorage.getItem('_vwo_' + account_id + '_config')), e)
        } catch (e) {}
        var code = {
          nonce: o && o.nonce,
          settings_tolerance: function () {
            return e.sT
          },
          hide_element: function () {
            return performance.getEntriesByName('first-contentful-paint')[0] ? '' : e.hE
          },
          hide_element_style: function () {
            return '{' + e.hES + '}'
          },
          getVersion: function () {
            return version
          },
          finish: function () {
            var e
            i ||
              ((i = !0), (e = n.getElementById('_vis_opt_path_hides')) && e.parentNode && e.parentNode.removeChild(e))
          },
          finished: function () {
            return i
          },
          addScript: function (e) {
            var t = n.createElement('script')
            ;(t.type = 'text/javascript'),
              (t.src = e),
              o && o.nonce && t.setAttribute('nonce', o.nonce),
              n.getElementsByTagName('head')[0].appendChild(t)
          },
          init: function () {
            t._vwo_settings_timer = setTimeout(function () {
              code.finish()
            }, this.settings_tolerance())
            var e = n.createElement('style')
            e.setAttribute('id', '_vis_opt_path_hides'),
              (e.type = 'text/css'),
              code && code.nonce && e.setAttribute('nonce', code.nonce),
              e.appendChild(n.createTextNode(this.hide_element() + this.hide_element_style())),
              n.head.appendChild(e),
              this.addScript('https://dev.visualwebsiteoptimizer.com/tag/' + account_id + '.js')
          }
        }
        t._vwo_code = code
        code.init()
      })()

    return
  }

  window._vwo_code ||
    (function () {
      var account_id = vwoAccountId,
        version = 2.1,
        settings_tolerance = settingsTolerance,
        hide_element = 'body',
        hide_element_style = 'transition:none;',
        f = false,
        w = window,
        d = document,
        v = d.querySelector('#vwoCode'),
        cK = '_vwo_' + account_id + '_settings',
        cc = {}
      try {
        var c = JSON.parse(localStorage.getItem('_vwo_' + account_id + '_config'))
        cc = c && typeof c === 'object' ? c : {}
      } catch (e) {}
      var stT = cc.stT === 'session' ? w.sessionStorage : w.localStorage
      var code = {
        nonce: v && v.nonce,
        use_existing_jquery: function () {
          return typeof use_existing_jquery !== 'undefined' ? use_existing_jquery : undefined
        },
        library_tolerance: function () {
          return typeof library_tolerance !== 'undefined' ? library_tolerance : undefined
        },
        settings_tolerance: function () {
          return cc.sT || settings_tolerance
        },
        hide_element_style: function () {
          return '{' + (cc.hES || hide_element_style) + '}'
        },
        hide_element: function () {
          if (
            typeof performance.getEntriesByName === 'function' &&
            performance.getEntriesByName('first-contentful-paint')[0]
          ) {
            return ''
          }
          return typeof cc.hE === 'string' ? cc.hE : hide_element
        },
        getVersion: function () {
          return version
        },
        finish: function (e) {
          if (!f) {
            f = true
            var t = d.getElementById('_vis_opt_path_hides')
            if (t) t.parentNode.removeChild(t)
            if (e) new Image().src = 'https://dev.visualwebsiteoptimizer.com/ee.gif?a=' + account_id + e
          }
        },
        finished: function () {
          return f
        },
        addScript: function (e) {
          var t = d.createElement('script')
          t.type = 'text/javascript'
          if (e.src) {
            t.src = e.src
          } else {
            t.text = e.text
          }
          v && t.setAttribute('nonce', v.nonce)
          d.getElementsByTagName('head')[0].appendChild(t)
        },
        load: function (e, t) {
          var n = this.getSettings(),
            i = d.createElement('script'),
            r = this
          t = t || {}
          if (n) {
            i.textContent = n
            d.getElementsByTagName('head')[0].appendChild(i)
            if (!w.VWO || VWO.caE) {
              stT.removeItem(cK)
              r.load(e)
            }
          } else {
            var o = new XMLHttpRequest()
            o.open('GET', e, true)
            o.withCredentials = !t.dSC
            o.responseType = t.responseType || 'text'
            o.onload = function () {
              if (t.onloadCb) {
                return t.onloadCb(o, e)
              }
              if (o.status === 200 || o.status === 304) {
                _vwo_code.addScript({
                  text: o.responseText
                })
              } else {
                _vwo_code.finish('&e=loading_failure:' + e)
              }
            }
            o.onerror = function () {
              if (t.onerrorCb) {
                return t.onerrorCb(e)
              }
              _vwo_code.finish('&e=loading_failure:' + e)
            }
            o.send()
          }
        },
        getSettings: function () {
          try {
            var e = stT.getItem(cK)
            if (!e) {
              return
            }
            e = JSON.parse(e)
            if (Date.now() > e.e) {
              stT.removeItem(cK)
              return
            }
            return e.s
          } catch (e) {
            return
          }
        },
        init: function () {
          if (d.URL.indexOf('__vwo_disable__') > -1) return
          var e = this.settings_tolerance()
          w._vwo_settings_timer = setTimeout(function () {
            _vwo_code.finish()
            stT.removeItem(cK)
          }, e)
          var t
          if (this.hide_element() !== 'body') {
            t = d.createElement('style')
            var n = this.hide_element(),
              i = n ? n + this.hide_element_style() : '',
              r = d.getElementsByTagName('head')[0]
            t.setAttribute('id', '_vis_opt_path_hides')
            v && t.setAttribute('nonce', v.nonce)
            t.setAttribute('type', 'text/css')
            if (t.styleSheet) t.styleSheet.cssText = i
            else t.appendChild(d.createTextNode(i))
            r.appendChild(t)
          } else {
            t = d.getElementsByTagName('head')[0]
            var i = d.createElement('div')
            i.style.cssText =
              'z-index: 2147483647 !important;position: fixed !important;left: 0 !important;top: 0 !important;width: 100% !important;height: 100% !important;background: white !important;display: block !important;'
            i.setAttribute('id', '_vis_opt_path_hides')
            i.classList.add('_vis_hide_layer')
            t.parentNode.insertBefore(i, t.nextSibling)
          }
          var o = window._vis_opt_url || d.URL,
            s =
              'https://dev.visualwebsiteoptimizer.com/j.php?a=' +
              account_id +
              '&u=' +
              encodeURIComponent(o) +
              '&vn=' +
              version
          if (w.location.search.indexOf('_vwo_xhr') !== -1) {
            this.addScript({
              src: s
            })
          } else {
            this.load(s + '&x=true')
          }
        }
      }
      w._vwo_code = code
      code.init()
    })()
}
