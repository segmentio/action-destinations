import type { ActionDefinition } from '@segment/actions-core'
import { BASE_API_URL } from '../constants/api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group',
  description: 'Updates or adds properties to a company. Company is created if it does not exist.',
  defaultSubscription: 'type = "group"',
  fields: {
    groupId: {
      label: 'Group ID',
      type: 'string',
      required: true,
      description: 'The unique identifier of the group.',
      default: {
        '@path': '$.groupId'
      }
    },
    traits: {
      label: 'Group Properties',
      type: 'object',
      description: 'Properties to set on the group profile',
      default: {
        '@path': '$.traits'
      }
    },
    type: {
      label: 'Type',
      type: 'string',
      required: true,
      description: 'The type of the event',
      default: {
        '@path': '$.type'
      }
    }
  },
  perform: (request, { payload }) => {
    const { groupId, type, traits } = payload

    const body = JSON.stringify({ groupId, traits, type })
    return request(`${BASE_API_URL}/group`, {
      method: 'post',
      body
    })
  }
}

export default action
