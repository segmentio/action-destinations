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

  console.log('Initializing Reddit Pixel...')
  rdt.init = (pixel_id, ldu) => {
    rdt('init', pixel_id, ldu)
  }

  rdt.track = (eventName, eventMetadata) => {
    rdt('track', eventName, eventMetadata)
  }
  // rdt('track', 'PageVisit')
  // remove and let it be it's own track function to fire off since it can also
  //  include advanced matching. Also allows advertisers to choose
  //  if they want to track page visits or something else
}
