/* eslint-disable */
// @ts-nocheck
export function initScript() {
  if (window.ko) {
    return
  }

  window.ko = []
  ;['identify', 'track', 'removeListeners', 'open', 'on', 'off', 'qualify', 'ready'].forEach(function (method) {
    ko[method] = function () {
      let args = Array.from(arguments)
      args.unshift(method)
      ko.push(args)
      return ko
    }
  })
}
