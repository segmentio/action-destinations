import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validateInput } from '../validateInput'
import { commonFields } from '../commonFields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group',
  description: 'Indentify accounts for Hyperengage',
  defaultSubscription: 'type = "group"',
  fields: {
    account_id: {
      type: 'string',
      required: true,
      description: 'External identifier for the Account',
      label: 'Company id',
      default: { '@path': '$.groupId' }
    },
    name: {
      type: 'string',
      required: true,
      description: 'The company name',
      label: 'Company name',
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
      description: 'The timestamp when the company was created',
      label: 'Company created at',
      default: { '@path': '$.traits.created_at' }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The company custom attributes',
      label: 'Company custom attributes',
      default: { '@path': '$.traits' }
    },
    plan: {
      type: 'string',
      required: false,
      description: 'The company plan',
      label: 'Company plan',
      default: { '@path': '$.traits.plan' }
    },
    industry: {
      type: 'string',
      required: false,
      description: 'The company industry',
      label: 'Company industry',
      default: { '@path': '$.traits.industry' }
    },
    trial_start: {
      type: 'string',
      required: false,
      description: 'The company trial start date',
      label: 'Company trial start date',
      default: { '@path': '$.traits.trial_start' }
    },
    trial_end: {
      type: 'string',
      required: false,
      description: 'The company trial end date',
      label: 'Company trial end date',
      default: { '@path': '$.traits.trial_end' }
    },
    website: {
      type: 'string',
      required: false,
      description: 'The company website',
      label: 'Company website',
      default: { '@path': '$.traits.website' }
    },
    ...commonFields
  },
  perform: (request, data) => {
    return request(`https://t.jitsu.com/api/v1/s2s/event?token=${data.settings.apiKey}`, {
      method: 'post',
      json: validateInput(data.settings, data.payload, 'account_identify')
    })
  }
}

export default action
