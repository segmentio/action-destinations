import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AllFields } from './fields'
import type { FBClient } from '../types'
import { send } from './utils'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'Send Event',
  description: 'Send a Standard or Custom Event to Facebook Conversions API.',
  platform: 'web',
  fields: AllFields,
  perform: (client, { payload, settings }) => {
    send(client, payload, settings)
  }
}

export default action