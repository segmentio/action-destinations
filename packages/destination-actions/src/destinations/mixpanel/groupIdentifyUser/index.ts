import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group Identify User',
  description: 'Updates or adds properties to a group profile. The profile is created if it does not exist.',
  defaultSubscription: 'type = "group"',
  fields: {
    group_id: {
      label: 'Group ID',
      type: 'string',
      description: 'The unique group identifier set by you',
      default: {
        '@path': '$.groupId'
      }
    },
    group_key: {
      label: 'Group Key',
      type: 'string',
      description: 'The group key',
      default: {
        '@if': {
          exists: { '@path': '$.context.name' },
          then: { '@path': '$.context.name' },
          else: { '@path': '$.groupId' }
        }
      }
    },
    traits: {
      label: 'Group Properties',
      type: 'object',
      description: 'Properties to set on the group profile',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (request, { payload, settings }) => {
    const data = {
      $token: settings.projectToken,
      $distinct_id: payload.group_id,
      $group_key: payload.group_key,
      $group_id: payload.group_id,
      $set: payload.traits
    }

    return request('https://api.mixpanel.com/groups', {
      method: 'post',
      body: new URLSearchParams({ data: JSON.stringify(data) })
    })
  }
}

export default action
