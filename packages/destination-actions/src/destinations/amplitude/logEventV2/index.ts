import { ActionDefinition} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { autocaptureFields } from '../autocapture-fields'
import { send } from '../events-functions'
import { products, use_batch_endpoint, userAgent, userAgentParsing, includeRawUserAgent, min_id_length, userAgentData } from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Log Event V2',
  description: 'Send an event to Amplitude',
  defaultSubscription: 'type = "track"',
  fields: {
    products,
    ...autocaptureFields,
    setOnce: {
      label: 'Set Once',
      description: "The following fields will only be set as user properties if they do not already have a value. If 'Autocapture Attribution' is enabled, UTM and attribution values in this field will be ignored.",
      type: 'object',
      additionalProperties: true,
      properties: {
        initial_referrer: {
          label: 'Initial Referrer',
          type: 'string',
          description: 'The referrer of the web request.'
        },
        initial_utm_source: {
          label: 'Initial UTM Source',
          type: 'string'
        },
        initial_utm_medium: {
          label: 'Initial UTM Medium',
          type: 'string'
        },
        initial_utm_campaign: {
          label: 'Initial UTM Campaign',
          type: 'string'
        },
        initial_utm_term: {
          label: 'Initial UTM Term',
          type: 'string'
        },
        initial_utm_content: {
          label: 'Initial UTM Content',
          type: 'string'
        }
      },
      default: {
        initial_referrer: { '@path': '$.context.page.referrer' },
        initial_utm_source: { '@path': '$.context.campaign.source' },
        initial_utm_medium: { '@path': '$.context.campaign.medium' },
        initial_utm_campaign: { '@path': '$.context.campaign.name' },
        initial_utm_term: { '@path': '$.context.campaign.term' },
        initial_utm_content: { '@path': '$.context.campaign.content' }
      }
    },
    setAlways: {
      label: 'Set Always',
      description: "The following fields will be set as user properties for every event. If 'Autocapture Attribution' is enabled, UTM and attribution values in this field will be ignored.",
      type: 'object',
      additionalProperties: true,
      properties: {
        referrer: {
          label: 'Referrer',
          type: 'string'
        },
        utm_source: {
          label: 'UTM Source',
          type: 'string'
        },
        utm_medium: {
          label: 'UTM Medium',
          type: 'string'
        },
        utm_campaign: {
          label: 'UTM Campaign',
          type: 'string'
        },
        utm_term: {
          label: 'UTM Term',
          type: 'string'
        },
        utm_content: {
          label: 'UTM Content',
          type: 'string'
        }
      },
      default: {
        referrer: { '@path': '$.context.page.referrer' },
        utm_source: { '@path': '$.context.campaign.source' },
        utm_medium: { '@path': '$.context.campaign.medium' },
        utm_campaign: { '@path': '$.context.campaign.name' },
        utm_term: { '@path': '$.context.campaign.term' },
        utm_content: { '@path': '$.context.campaign.content' }
      }
    },
    add: {
      label: 'Add',
      description:
        "Increment a user property by a number with add. If the user property doesn't have a value set yet, it's initialized to 0.",
      type: 'object',
      additionalProperties: true,
      defaultObjectUI: 'keyvalue'
    },
    use_batch_endpoint,
    userAgent,
    userAgentParsing,
    includeRawUserAgent,
    min_id_length,
    userAgentData
  },
  perform: (request, { payload, settings }) => {
    return send(request, payload, settings, false)
  }
}

export default action
