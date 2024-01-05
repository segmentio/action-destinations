import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Send identify events to Schematic',
  fields: {
    company_keys: {
      label: 'Company key name',
      description: 'Key-value pairs associated with a company (e.g. organization_id: 123456)',
      type: 'object',
      required: false,
      properties: {
        groupId: {
          label: 'groupId',
          description: 'Segment groupId',
          type: 'string',
          required: false
        },
        organization_id: {
          label: 'Organization ID',
          description: 'Organization ID',
          type: 'string',
          required: false
        }
      },
      default: {
        groupId: {
          '@if': {
            exists: { '@path': '$.groupId' },
            then: { '@path': '$.groupId' },
            else: { '@path': '$.context.groupId' }
          }
        },
        organization_id: { '@path': '$.properties.organization_id' }
      }
    },
    company_name: {
      label: 'Company name',
      description: 'Name of company',
      type: 'string',
      required: false
    },
    company_traits: {
      label: 'Company traits',
      description: 'Properties associated with company',
      type: 'object',
      required: false
    },
    user_keys: {
      label: 'User keys',
      description: 'Key-value pairs associated with a user (e.g. email: example@example.com)',
      type: 'object',
      required: true,
      properties: {
        userId: {
          label: 'userId',
          description: 'Segment userId',
          type: 'string',
          required: false
        },
        email: {
          label: 'email',
          description: 'Email address',
          type: 'string',
          required: false
        }
      },
      default: {
        userId: {
          '@if': {
            exists: { '@path': '$.userId' },
            then: { '@path': '$.userId' },
            else: { '@path': '$.context.userId' }
          }
        },
        email: {
          '@if': {
            exists: { '@path': '$.email' },
            then: { '@path': '$.email' },
            else: { '@path': '$.properties.email' }
          }
        }
      }
    },
    user_name: {
      label: 'User name',
      description: 'Name of user',
      type: 'string',
      required: false
    },
    user_traits: {
      label: 'User traits',
      description: 'Properties associated with user',
      type: 'object',
      required: false
    }
  },

  perform: (request, { settings, payload }) => {
    return request('https://api.schematichq.com/events', {
      method: 'post',
      headers: { 'X-Schematic-Api-Key': `${settings.apiKey}` },
      responseType: 'json',
      json: {
        body: {
          company: {
            keys: payload.company_keys,
            name: payload.company_name,
            traits: payload.company_traits
          },
          keys: payload.user_keys,
          name: payload.user_name,
          traits: payload.user_traits
        },
        event_type: 'identify'
      }
    })
  }
}

export default action
