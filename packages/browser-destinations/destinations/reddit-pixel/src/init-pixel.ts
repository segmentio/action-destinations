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

  rdt.init = (pixel_id, ldu) => {
    if (!this.init_already_called) {
      rdt('init', pixel_id, ldu)
    }
    this.init_already_called = true
  }

  rdt.track = (eventName, eventMetadata) => {
    rdt('track', eventName, eventMetadata)
  }

  rdt.init_already_called = false
}
