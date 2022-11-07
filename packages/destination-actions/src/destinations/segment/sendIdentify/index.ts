import { ActionDefinition, IntegrationError } from '@segment/actions-core'
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

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Identify',
  description: '',
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
  perform: (request, { payload, settings }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw new IntegrationError('Either Anonymous ID or User ID must be defined.', 'Misconfigured required field', 400)
    }

    const identifyPayload = {
      userId: payload?.user_id,
      annymousId: payload?.anonymous_id,
      timestampe: payload?.timestamp,
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
      throw new IntegrationError(
        'A valid endpoint must be selected. Please check your Segment settings.',
        'Misconfigured endpoint',
        400
      )
    }
    const selectedSegmentEndpoint = SEGMENT_ENDPOINTS[settings.endpoint]

    return request(`${selectedSegmentEndpoint}/identify`, {
      method: 'POST',
      json: identifyPayload
    })
  }
}

export default action
