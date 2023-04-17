import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-definitions'
import { eventRequestParams, resolveRequestPayload } from '../request-params'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group',
  description: 'Send company attributes to Usermaven.',
  fields: {
    company_id: {
      type: 'string',
      required: true,
      description: 'The company id, to uniquely identify the company',
      label: 'Company id',
      default: { '@path': '$.groupId' }
    },
    company_name: {
      type: 'string',
      required: true,
      description: 'The company name',
      label: 'Company name',
      default: { '@path': '$.traits.company_name' }
    },
    company_created_at: {
      type: 'string',
      required: true,
      description: 'The timestamp when the company was created',
      label: 'Company created at',
      default: { '@path': '$.traits.company_created_at' }
    },
    company_custom_attributes: {
      type: 'object',
      required: false,
      description: 'The company custom attributes',
      label: 'Company custom attributes'
    },
    user_email: {
      type: 'string',
      required: false,
      description: 'The user email address',
      label: 'Email address',
      default: {
        '@if': {
          exists: { '@path': '$.traits.user_email' },
          then: { '@path': '$.traits.user_email' },
          else: { '@path': '$.properties.user_email' }
        }
      }
    },
    user_created_at: {
      type: 'string',
      required: true,
      description: 'The timestamp when the user was created',
      label: 'User created at',
      default: {
        '@if': {
          exists: { '@path': '$.traits.user_created_at' },
          then: { '@path': '$.traits.user_created_at' },
          else: { '@path': '$.properties.user_created_at' }
        }
      }
    },
    ...commonFields
  },
  perform: (request, { payload, settings }) => {
    // Resolve request params so that we can use the validated payload to send to Usermaven
    const resolvedPayload = resolveRequestPayload(settings, payload)

    // Get request params
    const { url, options } = eventRequestParams(settings, resolvedPayload, 'group')

    return request(url, options)
  }
}

export default action
