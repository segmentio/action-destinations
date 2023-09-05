import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  user_id,
  anonymous_id,
  timestamp,
  event_name,
  application,
  campaign_parameters,
  device,
  ip_address,
  locale,
  location,
  network,
  operating_system,
  page,
  screen,
  user_agent,
  timezone,
  group_id,
  properties
} from '../segment-properties'
import { SEGMENT_ENDPOINTS } from '../properties'
import { MissingUserOrAnonymousIdThrowableError, InvalidEndpointSelectedThrowableError } from '../errors'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Track',
  description: 'Send a track call to Segment’s tracking API. This is used to record actions your users perform.',
  defaultSubscription: 'type = "track"',
  fields: {
    user_id,
    anonymous_id,
    timestamp,
    event_name,
    application,
    campaign_parameters,
    device,
    ip_address,
    locale,
    location,
    network,
    operating_system,
    page,
    screen,
    user_agent,
    timezone,
    group_id,
    properties
  },
  perform: (request, { payload, settings, features }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }

    const trackPayload: Object = {
      userId: payload?.user_id,
      anonymousId: payload?.anonymous_id,
      timestamp: payload?.timestamp,
      event: payload?.event_name,
      context: {
        app: payload?.application,
        campaign: payload?.campaign_parameters,
        device: payload?.device,
        ip: payload?.ip_address,
        locale: payload?.locale,
        location: payload?.location,
        network: payload?.network,
        os: payload?.operating_system,
        page: payload?.page,
        screen: payload?.screen,
        userAgent: payload?.user_agent,
        timezone: payload?.timezone,
        groupId: payload?.group_id
      },
      properties: {
        ...payload?.properties
      }
    }

    // Throw an error if endpoint is not defined or invalid
    if (!settings.endpoint || !(settings.endpoint in SEGMENT_ENDPOINTS)) {
      throw InvalidEndpointSelectedThrowableError
    }

    if (features && features['actions-segment-tapi-internal']) {
      const payload = { ...trackPayload, type: 'track' }
      return { batch: [payload] }
    }

    const selectedSegmentEndpoint = SEGMENT_ENDPOINTS[settings.endpoint].url
    return request(`${selectedSegmentEndpoint}/track`, {
      method: 'POST',
      json: trackPayload
    })
  }
}

export default action
