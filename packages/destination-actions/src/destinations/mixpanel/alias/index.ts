import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Alias',
  description: 'Create an alias to a distinct id',
  fields: {
    alias: {
      label: 'Alias',
      type: 'string',
      allowNull: true,
      description: 'New alias to merged with the previous id. Each alias can only map to one previous id',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    previous_id: {
      label: 'Previous ID',
      type: 'string',
      description: 'An id to be merged with the alias',
      default: {
        '@path': '$.previousId'
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    const data = {
      event: '$create_alias',
      properties: {
        distinct_id: payload.previous_id,
        alias: payload.alias,
        token: settings.projectToken
      }
    }

    return request('https://api.mixpanel.com/track#identity-create-alias', {
      method: 'post',
      body: new URLSearchParams({ data: JSON.stringify(data) })
    })
  }
}

export default action
