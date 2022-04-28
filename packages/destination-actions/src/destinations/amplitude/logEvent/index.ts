import { omit, removeUndefined } from '@segment/actions-core'
import dayjs from '../../../lib/dayjs'
import { eventSchema } from '../event-schema'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { convertUTMProperties } from '../utm'
import { convertReferrerProperty } from '../referrer'
import { mergeUserProperties } from '../merge-user-properties'
import { parseUserAgentProperties } from '../user-agent'
import { getEndpointByRegion } from '../regional-endpoints'
import { InputField } from '@segment/actions-core'

const revenueKeys = ['revenue', 'price', 'productId', 'quantity', 'revenueType']

export interface AmplitudeEvent extends Omit<Payload, 'products' | 'trackRevenuePerProduct' | 'time' | 'session_id'> {
  library?: string
  time?: number
  session_id?: number
  options?: {
    min_id_length: number
  }
}

function getEvents(payload: Payload, properties: AmplitudeEvent): AmplitudeEvent[] {
  const events: AmplitudeEvent[] = [
    {
      // Conditionally parse user agent using amplitude's library
      ...(payload.userAgentParsing && parseUserAgentProperties(payload.userAgent)),
      // Make sure any top-level properties take precedence over user-agent properties
      ...removeUndefined(properties),
      library: 'segment'
    }
  ]

  return events
}

export function doPerform(request: Function, payload: Payload, settings: Settings, eventFunction: Function) {
  const { time, session_id, userAgent, userAgentParsing, utm_properties, referrer, min_id_length, library, ...rest } =
    omit(payload, revenueKeys)
  const properties = rest as AmplitudeEvent
  let options

  if (properties.platform) {
    properties.platform = properties.platform.replace(/ios/i, 'iOS').replace(/android/i, 'Android')
  }

  if (library) {
    if (library === 'analytics.js') properties.platform = 'Web'
  }

  if (time && dayjs.utc(time).isValid()) {
    properties.time = dayjs.utc(time).valueOf()
  }

  if (session_id && dayjs.utc(session_id).isValid()) {
    properties.session_id = dayjs.utc(session_id).valueOf()
  }

  if (Object.keys(payload.utm_properties ?? {}).length || payload.referrer) {
    properties.user_properties = mergeUserProperties(
      convertUTMProperties({ utm_properties }),
      convertReferrerProperty({ referrer }),
      omit(properties.user_properties ?? {}, ['utm_properties', 'referrer'])
    )
  }

  if (min_id_length && min_id_length > 0) {
    options = { min_id_length }
  }

  const events: AmplitudeEvent[] = eventFunction(payload, properties)

  const endpoint = getEndpointByRegion(payload.use_batch_endpoint ? 'batch' : 'httpapi', settings.endpoint)

  return request(endpoint, {
    method: 'post',
    json: {
      api_key: settings.apiKey,
      events,
      options
    }
  })
}

export const fields: Record<string, InputField> = {
  ...eventSchema,
  use_batch_endpoint: {
    label: 'Use Batch Endpoint',
    description:
      "If true, events are sent to Amplitude's `batch` endpoint rather than their `httpapi` events endpoint. Enabling this setting may help reduce 429s – or throttling errors – from Amplitude. More information about Amplitude's throttling is available in [their docs](https://developers.amplitude.com/docs/batch-event-upload-api#429s-in-depth).",
    type: 'boolean',
    default: false
  },
  userAgent: {
    label: 'User Agent',
    type: 'string',
    description: 'The user agent of the device sending the event.',
    default: {
      '@path': '$.context.userAgent'
    }
  },
  userAgentParsing: {
    label: 'User Agent Parsing',
    type: 'boolean',
    description:
      'Enabling this setting will set the Device manufacturer, Device Model and OS Name properties based on the user agent string provided in the userAgent field',
    default: true
  },
  utm_properties: {
    label: 'UTM Properties',
    type: 'object',
    description: 'UTM Tracking Properties',
    properties: {
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
      utm_source: { '@path': '$.context.campaign.source' },
      utm_medium: { '@path': '$.context.campaign.medium' },
      utm_campaign: { '@path': '$.context.campaign.name' },
      utm_term: { '@path': '$.context.campaign.term' },
      utm_content: { '@path': '$.context.campaign.content' }
    }
  },
  referrer: {
    label: 'Referrer',
    type: 'string',
    description:
      'The referrer of the web request. Sent to Amplitude as both last touch “referrer” and first touch “initial_referrer”',
    default: {
      '@path': '$.context.page.referrer'
    }
  },
  min_id_length: {
    label: 'Minimum ID Length',
    description:
      'Amplitude has a default minimum id lenght of 5 characters for user_id and device_id fields. This field allows the minimum to be overridden to allow shorter id lengths.',
    allowNull: true,
    type: 'integer'
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Log Event',
  description: 'Send an event to Amplitude.',
  defaultSubscription: 'type = "track" and event != "Order Completed"',
  fields,
  perform: (request, { payload, settings }) => doPerform(request, payload, settings, getEvents)
}

export default action
