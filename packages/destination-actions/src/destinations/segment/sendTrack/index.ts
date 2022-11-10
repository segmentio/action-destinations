import { ActionDefinition, IntegrationError } from '@segment/actions-core'
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

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Track',
  description: 'Send a track call to Segment’s tracking API. This is used to record actions your users perform.',
  defaultSubscription: 'type = "track"',
  fields: {
    user_id: user_id,
    anonymous_id: anonymous_id,
    timestamp: timestamp,
    event_name: event_name,
    application: application,
    campaign_parameters: campaign_parameters,
    device: device,
    ip_address: ip_address,
    locale: locale,
    location: location,
    network: network,
    operating_system: operating_system,
    page: page,
    screen: screen,
    user_agent: user_agent,
    timezone: timezone,
    group_id: group_id,
    properties: properties
  },
  perform: (request, { payload, settings }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw new IntegrationError('Either Anonymous ID or User ID must be defined.', 'Misconfigured required field', 400)
    }

    const trackPayload: Object = {
      type: 'track',
      userId: payload?.user_id,
      annymousId: payload?.anonymous_id,
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
        ...payload.properties
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

    const selectedSegmentEndpoint = SEGMENT_ENDPOINTS[settings.endpoint].url
    return request(`${selectedSegmentEndpoint}/track`, {
      method: 'POST',
      json: trackPayload
    })
  }
}

export default action
