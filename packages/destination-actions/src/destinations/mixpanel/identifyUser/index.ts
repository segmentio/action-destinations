import { URLSearchParams } from 'url'
import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Set the user ID for a particular device ID or update user properties',
  defaultSubscription: 'type = "identify"',
  fields: {
    user_id: {
      label: 'User ID',
      type: 'string',
      allowNull: true,
      description: 'The unique user identifier set by you',
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      label: 'User Properties',
      type: 'object',
      description: 'Properties to set on the user profile',
      default: {
        '@path': '$.traits'
      }
    }
  },

  perform: (request, { payload, settings }) => {
    const data = {
      $token: settings.projectToken,
      $distinct_id: payload.user_id,
      $set: payload.traits
    }

    return request('https://api.mixpanel.com/engage', {
      method: 'post',
      body: new URLSearchParams({ data: JSON.stringify(data) })
    })
  }
}

export default action
