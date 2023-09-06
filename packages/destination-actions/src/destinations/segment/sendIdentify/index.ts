import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  anonymous_id,
  application,
  campaign_parameters,
  device,
  group_id,
  ip_address,
  network,
  operating_system,
  page,
  timestamp,
  timezone,
  user_agent,
  user_id,
  screen,
  locale,
  location,
  traits
} from '../segment-properties'
import { SEGMENT_ENDPOINTS } from '../properties'
import { MissingUserOrAnonymousIdThrowableError, InvalidEndpointSelectedThrowableError } from '../errors'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Identify',
  description:
    'Send an identify call to Segment’s tracking API. This is used to tie your users to their actions and record traits about them.',
  defaultSubscription: 'type = "identify"',
  fields: {
    user_id,
    anonymous_id,
    timestamp,
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
    traits
  },
  perform: (request, { payload, settings, features, statsContext }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }

    const identifyPayload = {
      userId: payload?.user_id,
      anonymousId: payload?.anonymous_id,
      timestamp: payload?.timestamp,
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
      traits: {
        ...payload?.traits
      }
    }

    // Throw an error if endpoint is not defined or invalid
    if (!settings.endpoint || !(settings.endpoint in SEGMENT_ENDPOINTS)) {
      throw InvalidEndpointSelectedThrowableError
    }

    // Return transformed payload without sending it to TAPI endpoint
    if (features && features['actions-segment-tapi-internal-enabled']) {
      statsContext?.statsClient.incr('tapi_internal', 1, [...statsContext.tags, 'action:sendIdentify'])
      const payload = { ...identifyPayload, type: 'identify' }
      return { batch: [payload] }
    }

    const selectedSegmentEndpoint = SEGMENT_ENDPOINTS[settings.endpoint].url

    return request(`${selectedSegmentEndpoint}/identify`, {
      method: 'POST',
      json: identifyPayload
    })
  }
}

export default action
