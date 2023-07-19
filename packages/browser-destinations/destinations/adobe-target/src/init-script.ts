/* eslint-disable */
// @ts-nocheck

import { getPageParams } from './utils'

export function initScript(_settings) {
  window.pageParams = {}

  if (!window.targetGlobalSettings) {
    console.log('Warning! window.targetGlobalSettings should be set before loading your Segment library.')
  }

  // DO NOT RENAME. This function is required by Adobe Target.
  // Learn More: https://experienceleague.adobe.com/docs/target/using/implement-target/client-side/at-js-implementation/functions-overview/targetpageparams.html?lang=en
  window.targetPageParams = function () {
    return getPageParams()
  }
}
