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

export interface AmplitudeEvent extends Omit<Payload, 'products' | 'trackRevenuePerProduct' | 'time' | 'session_id'> {
  library?: string
  time?: number
  session_id?: number
  options?: {
    min_id_length: number
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Log Event',
  description: 'Send an event to Amplitude.',
  defaultSubscription: 'type = "track"',
  fields: eventSchema,
  perform: (request, { payload, settings }) => {
    const {
      time,
      session_id,
      userAgent,
      userAgentParsing,
      utm_properties,
      referrer,
      min_id_length,
      library,
      ...rest
    } = payload
    const properties = rest as AmplitudeEvent
    let options

    if (properties.platform) {
      properties.platform = properties.platform.replace(/ios/i, 'iOS').replace(/android/i, 'Android')
    }

    if (library === 'analytics.js') {
      properties.platform = 'Web'
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

    const events: AmplitudeEvent[] = [
      {
        // Conditionally parse user agent using amplitude's library
        ...(userAgentParsing && parseUserAgentProperties(userAgent)),
        // Make sure any top-level properties take precedence over user-agent properties
        ...removeUndefined(properties),
        library: 'segment'
      }
    ]

    const endpoint = payload.use_batch_endpoint
      ? 'https://api2.amplitude.com/batch'
      : 'https://api2.amplitude.com/2/httpapi'

    return request(endpoint, {
      method: 'post',
      json: {
        api_key: settings.apiKey,
        events,
        options
      }
    })
  }
}

export default action
