import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { getApiServerUrl } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Alias',
  description:
    'Create an alias to a distinct id. This action is primarily supported for the sake of customers using the legacy identity management in their Mixpanel project. For new customers or those who have [migrated](https://help.mixpanel.com/hc/en-us/articles/360039133851-Moving-to-Identity-Merge?source=segment-actions) to the [new identity management](https://help.mixpanel.com/hc/en-us/articles/360041039771-Getting-Started-with-Identity-Management?source=segment-actions) in Mixpanel should use `identify`.',
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

    return request(`${getApiServerUrl(settings.apiRegion)}/track`, {
      method: 'post',
      body: new URLSearchParams({ data: JSON.stringify(data) })
    })
  }
}

export default action
