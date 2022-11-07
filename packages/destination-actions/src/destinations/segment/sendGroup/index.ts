import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  user_id,
  anonymous_id,
  group_id,
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
  traits
} from '../segment-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Group',
  description: '',
  defaultSubscription: 'type = "group"',
  fields: {
    user_id: user_id,
    anonymous_id: anonymous_id,
    group_id: group_id,
    timestamp: timestamp,
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
    traits: traits
  },
  perform: (request, { payload }) => {
    console.log(request, payload)
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
