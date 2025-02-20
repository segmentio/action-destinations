/* eslint-disable */
// @ts-nocheck

export function initializePixel(settings) {
  !(function (w, d) {
    if (!w.rdt) {
      var p = (w.rdt = function () {
        p.sendEvent ? p.sendEvent.apply(p, arguments) : p.callQueue.push(arguments)
      })
      p.callQueue = []
      var t = d.createElement('script')
      t.src = 'https://www.redditstatic.com/ads/pixel.js'
      t.async = true
      var s = d.getElementsByTagName('script')[0]
      s.parentNode.insertBefore(t, s)
    }
  })(window, document)

  rdt('init', settings.pixel_id)
  rdt('track', 'PageVisit')
}
