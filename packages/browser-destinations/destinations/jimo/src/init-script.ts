import { Settings } from './generated-types'
/* eslint-disable */
// @ts-nocheck
export function initScript(settings: Settings) {
  const manualInit = settings.manualInit ?? false

  if (window.jimo) {
    return
  }

  window.jimo = []
  window.segmentJimo = {
    initialized: !manualInit,
    client: function () {
      return window.jimo
    }
  }
  window['JIMO_MANUAL_INIT'] = manualInit
  window['JIMO_PROJECT_ID'] = settings.projectId
}
