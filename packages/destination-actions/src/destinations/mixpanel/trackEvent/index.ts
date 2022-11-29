import { ActionDefinition, RequestClient, omit } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MixpanelEvent } from '../mixpanel-types'
import { getApiServerUrl, getBrowser, getBrowserVersion, cheapGuid } from '../utils'
import dayjs from '../../../lib/dayjs'
import { eventProperties } from '../mixpanel-properties'

const mixpanelReservedProperties = ['time', 'id', '$anon_id', 'distinct_id', '$group_id', '$insert_id', '$user_id']

const getEventFromPayload = (payload: Payload, settings: Settings): MixpanelEvent => {
  const datetime = payload.time
  const time = datetime && dayjs.utc(datetime).isValid() ? dayjs.utc(datetime).valueOf() : Date.now()

  const utm = payload.utm_properties || {}
  let browser, browserVersion
  if (payload.userAgent) {
    browser = getBrowser(payload.userAgent, payload.device_manufacturer)
    browserVersion = getBrowserVersion(payload.userAgent, payload.device_manufacturer)
  }

  const event: MixpanelEvent = {
    event: payload.event,
    properties: {
      time: time,
      ip: payload.ip,
      id: payload.distinct_id,
      $anon_id: payload.anonymous_id,
      distinct_id: payload.distinct_id,
      $app_build_number: payload.app_build,
      $app_version_string: payload.app_version,
      $app_namespace: payload.app_namespace,
      $app_name: payload.app_name,
      $browser: browser,
      $browser_version: browserVersion,
      $bluetooth_enabled: payload.bluetooth,
      $cellular_enabled: payload.cellular,
      $carrier: payload.carrier,
      $current_url: payload.url,
      $device: payload.device_name,
      $device_id: payload.device_id,
      $device_type: payload.device_type,
      $device_name: payload.device_name,
      $group_id: payload.group_id,
      $identified_id: payload.user_id,
      $insert_id: payload.insert_id || cheapGuid(),
      $ios_ifa: payload.idfa,
      $lib_version: payload.library_version,
      $locale: payload.language,
      $manufacturer: payload.device_manufacturer,
      $model: payload.device_model,
      $os: payload.os_name,
      $os_version: payload.os_version,
      $referrer: payload.referrer,
      $screen_height: payload.screen_height,
      $screen_width: payload.screen_width,
      $screen_density: payload.screen_density,
      $source: 'segment',
      $user_id: payload.user_id,
      $wifi_enabled: payload.wifi,
      mp_country_code: payload.country,
      mp_lib: payload.library_name && `Segment: ${ payload.library_name }`,
      segment_source_name: settings.sourceName,
      utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content,
      utm_medium: utm.utm_medium,
      utm_source: utm.utm_source,
      utm_term: utm.utm_term,
      // Ignore Mixpanel reserved properties
      ...omit(payload.event_properties, mixpanelReservedProperties)
    }
  }
  return event
}

const processData = async (request: RequestClient, settings: Settings, payload: Payload[]) => {
  const events = payload.map((value) => getEventFromPayload(value, settings))
  return request(`${ getApiServerUrl(settings.apiRegion) }/import?strict=1`, {
    method: 'post',
    json: events,
    headers: {
      authorization: `Basic ${ Buffer.from(`${ settings.apiSecret }:`).toString('base64') }`
    }
  })
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description:
    'Send an event to Mixpanel. [Learn more about Events in Mixpanel](https://help.mixpanel.com/hc/en-us/articles/360041995352-Mixpanel-Concepts-Events?source=segment-actions)',
  defaultSubscription: 'type = "track"',
  fields: {
    event: {
      label: 'Event Name',
      type: 'string',
      description: 'The name of the action being performed.',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      type: 'string',
      description: 'A distinct ID randomly generated prior to calling identify.',
      default: {
        '@path': '$.anonymousId'
      }
    },
    user_id: {
      label: 'User ID',
      type: 'string',
      description: 'The distinct ID after calling identify.',
      default: {
        '@path': '$.userId'
      }
    },
    ...eventProperties
  },

  performBatch: async (request, { settings, payload }) => {
    return processData(request, settings, payload)
  },

  perform: async (request, { settings, payload }) => {
    return processData(request, settings, [payload])
  }
}

export default action
