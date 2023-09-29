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
  properties,
  screen_name,
  timestamp,
  timezone,
  user_agent,
  user_id,
  screen,
  locale,
  location
} from '../segment-properties'
import { MissingUserOrAnonymousIdThrowableError } from '../errors'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Screen',
  description: 'Send a screen call to Segment’s tracking API. This is used to track mobile app screen views.',
  defaultSubscription: 'type = "screen"',
  fields: {
    user_id,
    anonymous_id,
    timestamp,
    screen_name,
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
  perform: (_request, { payload }) => {
    if (!payload.anonymous_id && !payload.user_id) {
      throw MissingUserOrAnonymousIdThrowableError
    }

    const screenPayload: Object = {
      userId: payload?.user_id,
      anonymousId: payload?.anonymous_id,
      timestamp: payload?.timestamp,
      name: payload?.screen_name,
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
        groupId: payload?.group_id
      },
      properties: {
        name: payload?.screen_name,
        ...payload?.properties
      }
    }

    // Return transformed payload without sending it to TAPI endpoint
    return { batch: [{ ...screenPayload, type: 'screen' }] }
  }
}

export default action
