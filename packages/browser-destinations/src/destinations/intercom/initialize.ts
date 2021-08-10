/* eslint-disable @typescript-eslint/ban-ts-comment */
import { loadScript } from '../../runtime/load-script'
import { resolveWhen } from '../../runtime/resolve-when'
import { Settings } from './generated-types'
import { InitializeOptions } from '../../lib/browser-destinations'

async function load(appId: string) {
  const ic = window.Intercom
  if (typeof ic === 'function') {
    // @ts-ignore
    ic('reattach_activator')
    ic('update', window.intercomSettings)
  } else {
    await loadScript(`https://widget.intercom.io/widget/${appId}`)
  }
}

export async function initialize(options: InitializeOptions<Settings>): Promise<Intercom_.IntercomStatic> {
  const app_id = options.settings.app_id

  window.intercomSettings = { app_id }
  await load(app_id)
  await resolveWhen(() => window.document.querySelector('#intercom-frame') !== null)

  // @ts-ignore intercom does some weird stuff with their global variables
  return (...args) => window.Intercom.bind(window.Intercom)(...args)
}
