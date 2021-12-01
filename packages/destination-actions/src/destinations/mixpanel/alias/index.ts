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
      description:
        'A new distinct id to be merged with the original distinct id. Each alias can only map to one distinct id.',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    distinct_id: {
      label: 'Distinct ID',
      type: 'string',
      description: 'A distinct id to be merged with the alias.',
      default: {
        '@path': '$.previousId'
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    const data = {
      event: '$create_alias',
      properties: {
        distinct_id: payload.distinct_id,
        alias: payload.alias,
        token: settings.projectToken
      }
    }

    return request('https://api.mixpanel.com/track', {
      method: 'post',
      body: new URLSearchParams({ data: JSON.stringify(data) })
    })
  }
}

export default action
