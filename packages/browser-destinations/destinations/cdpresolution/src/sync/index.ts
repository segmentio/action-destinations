// Module: Sync event code
// Version: 1.0
// Changes:
// - Initial Version (A.Sikri)
import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { CDPResolution } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, CDPResolution, Payload> = {
  title: 'Sync Anonymous ID',
  description: 'Sync Anonymous ID to CDP Resolution.',
  defaultSubscription: 'type = "page" or type = "track" or type = "identify"',
  platform: 'web',
  fields: {
    anonymousId: {
      label: 'Anonymous Id',
      description: 'The anonymous id of the user',
      type: 'string',
      required: true,
      default: {
        '@path': '$.anonymousId'
      }
    }
  },
  perform: (cdpResolution, { settings, payload }) => {
    cdpResolution.sync(settings.endpoint, settings.clientIdentifier, payload.anonymousId)
  }
}

export default action
