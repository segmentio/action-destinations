import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
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
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Screen',
  description: 'Send a screen call to Segment’s tracking API. This is used to track mobile app screen views.',
  defaultSubscription: 'type = "screen"',
  fields: {
    user_id: user_id,
    anonymous_id: anonymous_id,
    timestamp: timestamp,
    screen_name: screen_name,
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
  perform: (request, { payload }) => {
    //will need the setting to decide to send to EU or US endpoint
    //perform: (request, { payload, settings})
    if (!payload.anonymous_id && !payload.user_id) {
      throw new IntegrationError(
        `Either anonymous id or user id must be defined. `,
        'Misconfigured required field',
        400
      )
    }

    const screenPayload: Object = {
      userId: payload?.user_id,
      annymousId: payload?.anonymous_id,
      timestampe: payload?.timestamp,
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
        ...payload.properties,
        name: payload?.screen_name
      }
    }

    return request('https://api.segment.build/v1/screen', {
      method: 'post',
      json: screenPayload
    })
  }
}

export default action
