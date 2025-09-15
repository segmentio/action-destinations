/* eslint-disable */
// @ts-nocheck

import { getPageParams } from './utils'

export function initScript(settings) {
  window.pageParams = {}
  window.targetGlobalSettings = {
    cookieDomain: settings.cookie_domain,
    enabled: true
  }

  // DO NOT RENAME. This function is required by Adobe Target.
  // Learn More: https://experienceleague.adobe.com/docs/target/using/implement-target/client-side/at-js-implementation/functions-overview/targetpageparams.html?lang=en
  window.targetPageParams = function () {
    return getPageParams()
  }
}
