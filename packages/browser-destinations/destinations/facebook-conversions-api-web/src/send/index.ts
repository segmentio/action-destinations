import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AllFields } from './fields'
import type { FBClient, FBClientParamBuilder } from '../types'
import { send } from './functions'

const action: BrowserActionDefinition<
  Settings,
  { fbq: FBClient; clientParamBuilder: FBClientParamBuilder | undefined },
  Payload
> = {
  title: 'Send Event',
  description: 'Send a Standard or Custom Event to Facebook Conversions API.',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: AllFields,
  perform: (client, { payload, settings, analytics }) => {
    return send(client.fbq, client.clientParamBuilder, payload, settings, analytics)
  }
}

export default action
