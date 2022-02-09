import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getEndpointByRegion } from '../regional-endpoints'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group Identify User',
  description: 'Updates or adds properties to an account. The account is created if it does not exist.',
  defaultSubscription: 'type = "group"',
  fields: {},
  perform: (request, { payload, settings }) => {

    return request(getEndpointByRegion('track', settings.dataCenter), {
      method: 'post',
      json: payload
    })
  }
}

export default action
