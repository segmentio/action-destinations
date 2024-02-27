/* eslint-disable */
// @ts-nocheck
export function initScript() {
  if (window.Ripe) {
    return
  }

  window.Ripe = []
  ;['group', 'identify', 'init', 'page', 'track'].forEach(function (method) {
    window.Ripe[method] = function () {
      let args = Array.from(arguments)
      args.unshift(method)
      window.Ripe.push(args)
      return window.Ripe
    }
  })
}
