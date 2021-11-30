import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group',
  description: 'Assign Cordial contact to a list',
  defaultSubscription: 'type = "group"',
  fields: {
    user_id: {
      label: 'Segment ID',
      description: 'Segment User ID',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description: 'Segment Anonymous ID',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    group_id: {
      label: 'Group ID',
      description: 'Segment Group ID',
      type: 'string',
      required: true,
      default: {
        '@path': '$.groupId'
      }
    },
    traits: {
      label: 'Segment traits',
      description: 'Segment contact attributes',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    },
  },
  perform: (request, { settings, payload }) => {
    const groupEndpoint = `${settings.endpoint}/group`
    return request(groupEndpoint, {
      method: 'post',
      json: payload
    })
  }
}

export default action
