/* eslint-disable */
// @ts-nocheck
export function initScript() {
  if (window.saq) return

  // Slightly modified version of standard SA Pixel, as the script has already
  // been loaded.
  const sdk = (window.saq = function () {
    sdk.callMethod ? sdk.callMethod.apply(sdk, arguments) : sdk.queue.push(arguments)
  })

  if (!window._saq) window._saq = sdk
  sdk.push = sdk
  sdk.loaded = true
  sdk.version = '1.0'
  sdk.queue = []
}
