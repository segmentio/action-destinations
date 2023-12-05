/* eslint-disable */
// @ts-nocheck

export function initScript({ projectApiKey }) {
  //Set your APP_ID
  const apiKey = projectApiKey

  const autoURLTracking = false
  ;(function (w, o, s, t, k, a, r) {
    ;(w._1flow = function (e, d, v) {
      s(function () {
        w._1flow(e, d, !v ? {} : v)
      }, 5)
    }),
      (a = o.getElementsByTagName('head')[0])
    r = o.createElement('script')
    r.async = 1
    r.setAttribute('data-api-key', k)
    r.src = t
    a.appendChild(r)
  })(window, document, setTimeout, 'https://1flow.app/js/1flow.js', apiKey)
}
