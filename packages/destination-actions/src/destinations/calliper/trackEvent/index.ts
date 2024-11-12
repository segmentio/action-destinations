import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { eventProperties } from './eventProperties'
import dayjs from '../../../lib/dayjs'
import { API_URL } from '../utils/constants'

const formatEvent = (payload: Payload) => {
  const datetime = payload.time
  const time = datetime && dayjs.utc(datetime).isValid() ? dayjs.utc(datetime).valueOf() : Date.now()
  return {
    event: payload.event,
    time: time,
    anonymous_id: payload.anonymous_id,
    user_id: payload.user_id,
    group_id: payload.group_id,
    event_unique_id: payload.event_unique_id,
    app_version: payload.app_version,
    os_name: payload.os_name,
    device_id: payload.device_id,
    platform: payload.platform,
    device_manufacturer: payload.device_manufacturer,
    device_model: payload.device_model,
    carrier: payload.carrier,
    cellular: payload.cellular,
    country: payload.country,
    region: payload.region,
    city: payload.city,
    language: payload.language,
    library_name: `Segment: ${payload.library_name}`,
    library_version: payload.library_version,
    ip: payload.ip,
    url: payload.url,
    path: payload.path,
    page_title: payload.page_title,
    user_agent: payload.user_agent,
    properties: payload.event_properties
  }
}

const processData = async (request: RequestClient, settings: Settings, payload: Payload[]) => {
  const events = payload.map(formatEvent)

  return request(`${API_URL}/event/batch`, {
    method: 'post',
    json: {
      company_id: settings.companyId,
      key: settings.segmentKey,
      events
    }
  })
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send your product event to Calliper.',
  defaultSubscription: 'type = "track"',
  fields: eventProperties,

  performBatch: async (request, { settings, payload }) => {
    return processData(request, settings, payload)
  },

  perform: async (request, { settings, payload }) => {
    return processData(request, settings, [payload])
  }
}

export default action
