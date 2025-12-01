import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { autocaptureFields } from '../autocapture-fields'
import { send } from '../events-functions'
import { 
  products, 
  utm_properties, 
  referrer, 
  use_batch_endpoint, 
  userAgent, 
  userAgentParsing, 
  includeRawUserAgent, 
  min_id_length, 
  userAgentData 
} from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Log Purchase',
  description: 'Send an event to Amplitude.',
  defaultSubscription: 'type = "track"',
  fields: {
    trackRevenuePerProduct: {
      label: 'Track Revenue Per Product',
      description:
        'When enabled, track revenue with each product within the event. When disabled, track total revenue once for the event.',
      type: 'boolean',
      default: false
    },
    products,
    ...autocaptureFields,
    utm_properties,
    referrer,
    use_batch_endpoint,
    userAgent,
    userAgentParsing,
    includeRawUserAgent,
    min_id_length,
    userAgentData
  },
  perform: (request, { payload, settings }) => {
    return send(request, payload, settings, true)
  }
}

export default action





