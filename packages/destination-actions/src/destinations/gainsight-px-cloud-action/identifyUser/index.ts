import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getEndpointByRegion } from '../regional-endpoints'
import { commonFields } from "../common-fields";

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Set the user ID for a particular device ID or update user properties',
  defaultSubscription: 'type = "identify"',
  fields: {
    traits: {
      label: 'User Properties',
      type: 'object',
      description: 'Properties to set on the user profile',
      required: true,
      default: {
        '@path': '$.traits'
      }
    },
    ...commonFields
  },
  perform: (request, { payload, settings }) => {

    return request(getEndpointByRegion('track', settings.dataCenter), {
      method: 'post',
      json: payload
    })
  }
}

export default action
