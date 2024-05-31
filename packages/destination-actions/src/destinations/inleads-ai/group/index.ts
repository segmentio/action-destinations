import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-fields'
import { IntegrationBaseUrl, IntegrationName } from '../contants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group',
  description: `Send group calls to ${IntegrationName}.`,
  defaultSubscription: 'type = "group"',
  fields: {
    account_id: {
      type: 'string',
      required: true,
      description: 'The External ID of the account to send properties for',
      label: 'Account id',
      default: { '@path': '$.groupId' }
    },
    user_id: {
      type: 'string',
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    name: {
      type: 'string',
      required: true,
      description: 'The Account name',
      label: 'Account name',
      default: {
        '@if': {
          exists: { '@path': '$.traits.name' },
          then: { '@path': '$.traits.name' },
          else: { '@path': '$.properties.name' }
        }
      }
    },
    created_at: {
      type: 'string',
      required: false,
      description:
        'The timestamp when the account was created, represented in the ISO-8601 date format. For instance, "2023-09-26T15:30:00Z".',
      label: 'Account created at',
      default: {
        '@if': {
          exists: { '@path': '$.traits.created_at' },
          then: { '@path': '$.traits.created_at' },
          else: { '@path': '$.traits.createdAt' }
        }
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The properties of the account',
      label: 'Account properties',
      default: { '@path': '$.traits' }
    },
    website: {
      type: 'string',
      required: false,
      description: 'The account website',
      label: 'Account website',
      default: { '@path': '$.traits.website' }
    },
    ...commonFields
  },
  perform: (request, data) => {
    return request(`${IntegrationBaseUrl}/events/track`, {
      method: 'post',
      headers: {
        Authorization: `Basic ${data.settings.apiKey}`
      },
      json: { ...data.payload, apiKey: data.settings.apiKey }
    })
  }
}

export default action
