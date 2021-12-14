import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getEndpointByRegion } from '../regional-endpoints'
import { commonFields } from "../common-fields";

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group Identify User',
  description: 'Updates or adds properties to an account. The account is created if it does not exist.',
  defaultSubscription: 'type = "group"',
  fields: {
    groupId: {
      label: 'Account ID',
      type: 'string',
      description: 'The unique identifier of the account.',
      required: true,
      default: {
        '@path': '$.groupId'
      }
    },
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
