/* eslint-disable */
// @ts-nocheck
export function initScript() {
  const ns = window.globalKoalaKey || 'ko'

  if (window[ns]) {
    return
  }

  const ko = (window[ns] = [])
  ;['identify', 'track', 'removeListeners', 'open', 'on', 'off', 'qualify', 'ready'].forEach(function (method) {
    ko[method] = function () {
      let args = Array.from(arguments)
      args.unshift(method)
      ko.push(args)
      return ko
    }
  })
}
