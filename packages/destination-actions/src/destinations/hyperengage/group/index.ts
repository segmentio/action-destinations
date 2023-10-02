import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validateInput } from '../validateInput'
import { commonFields } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group',
  description: 'Send group calls to Hyperengage.',
  defaultSubscription: 'type = "group"',
  fields: {
    account_id: {
      type: 'string',
      required: true,
      description: 'The External ID of the account to send properties for',
      label: 'Account id',
      default: {
        '@if': {
          exists: { '@path': '$.context.group_id' },
          then: { '@path': '$.context.group_id' },
          else: { '@path': '$.context.groupId' }
        }
      }
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
      default: { '@path': '$.traits.created_at' }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The properties of the account',
      label: 'Account properties',
      default: { '@path': '$.traits' }
    },
    plan: {
      type: 'string',
      required: false,
      description: 'Subscription plan the account is associated with',
      label: 'Account subscription plan',
      default: { '@path': '$.traits.plan' }
    },
    industry: {
      type: 'string',
      required: false,
      description: 'The account industry',
      label: 'Account industry',
      default: { '@path': '$.traits.industry' }
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
    return request(`https://events.hyperengage.io/api/v1/s2s/event?token=${data.settings.apiKey}`, {
      method: 'post',
      json: validateInput(data.settings, data.payload, 'account_identify')
    })
  }
}

export default action
