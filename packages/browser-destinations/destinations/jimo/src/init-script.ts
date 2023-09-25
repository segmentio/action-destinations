import { Settings } from './generated-types'
/* eslint-disable */
// @ts-nocheck
export function initScript(settings: Settings) {
  if (window.jimo) {
    return
  }

  window.jimo = []
  window['JIMO_PROJECT_ID'] = settings.projectId
  window['JIMO_MANUAL_INIT'] = settings.initOnLoad === false
}
