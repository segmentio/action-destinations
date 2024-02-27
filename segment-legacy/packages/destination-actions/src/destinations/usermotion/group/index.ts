import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify Company',
  description: 'Create or update a company in UserMotion',
  defaultSubscription: 'type = "group"',
  fields: {
    groupId: {
      type: 'string',
      description: 'A identifier for a known company.',
      label: 'Group ID',
      required: true,
      default: { '@path': '$.groupId' }
    },
    website: {
      type: 'string',
      label: 'Website',
      description: 'The website address of the identified company',
      default: {
        '@if': {
          exists: { '@path': '$.traits.website' },
          then: { '@path': '$.traits.website' },
          else: { '@path': '$.properties.website' }
        }
      }
    },
    traits: {
      type: 'object',
      label: 'Traits',
      description: 'Traits to associate with the company',
      default: { '@path': '$.traits' }
    }
  },
  perform: (request, { payload }) => {
    return request('https://api.usermotion.com/v1/group', {
      method: 'post',
      json: {
        id: payload.groupId,
        properties: {
          ...payload.traits,
          website: payload.website
        }
      }
    })
  }
}

export default action
