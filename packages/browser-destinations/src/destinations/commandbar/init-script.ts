/* eslint-disable */
// @ts-nocheck

export function initScript(orgId) {
  var o = orgId,
    n = ['Object.assign', 'Symbol', 'Symbol.for'].join('%2C'),
    a = window
  function t(o, n) {
    void 0 === n && (n = !1),
      'complete' !== document.readyState &&
        window.addEventListener('load', t.bind(null, o, n), { capture: !1, once: !0 })
    var a = document.createElement('script')
    ;(a.type = 'text/javascript'), (a.async = n), (a.src = o), document.head.appendChild(a)
  }
  function r() {
    var n
    if (void 0 === a.CommandBar) {
      delete a.__CommandBarBootstrap__
      var r = Symbol.for('CommandBar::configuration'),
        e = Symbol.for('CommandBar::orgConfig'),
        c = Symbol.for('CommandBar::disposed'),
        i = Symbol.for('CommandBar::isProxy'),
        m = Symbol.for('CommandBar::queue'),
        l = Symbol.for('CommandBar::unwrap'),
        d = [],
        s = localStorage.getItem('commandbar.lc'),
        u = s && s.includes('local') ? 'http://localhost:8000' : 'https://api.commandbar.com',
        f = Object.assign(
          (((n = {})[r] = { uuid: o }),
          (n[e] = {}),
          (n[c] = !1),
          (n[i] = !0),
          (n[m] = new Array()),
          (n[l] = function () {
            return f
          }),
          n),
          a.CommandBar
        ),
        p = ['addCommand', 'boot'],
        y = f
      Object.assign(f, {
        shareCallbacks: function () {
          return {}
        },
        shareContext: function () {
          return {}
        }
      }),
        (a.CommandBar = new Proxy(f, {
          get: function (o, n) {
            if (
              n === 'then' ||
              n === 'toJSON' ||
              n === '$$typeof' ||
              n === '@@__IMMUTABLE_RECORD__@@' ||
              n === 'hasAttribute' ||
              n === 'asymmetricMatch'
            ) {
              return Reflect.get(...arguments)
            }
            return n in y
              ? f[n]
              : p.includes(n)
              ? function () {
                  var o = Array.prototype.slice.call(arguments)
                  return new Promise(function (a, t) {
                    o.unshift(n, a, t), f[m].push(o)
                  })
                }
              : function () {
                  var o = Array.prototype.slice.call(arguments)
                  o.unshift(n), f[m].push(o)
                }
          }
        })),
        null !== s && d.push('lc='.concat(s)),
        d.push('version=2'),
        t(''.concat(u, '/latest/').concat(o, '?').concat(d.join('&')), !0)
    }
  }
  void 0 === Object.assign || 'undefined' == typeof Symbol || void 0 === Symbol.for
    ? ((a.__CommandBarBootstrap__ = r),
      t('https://polyfill.io/v3/polyfill.min.js?version=3.101.0&callback=__CommandBarBootstrap__&features=' + n))
    : r()
}
