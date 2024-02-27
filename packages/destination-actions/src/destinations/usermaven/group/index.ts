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
    user_id: {
      type: 'string',
      required: true,
      description: 'The user id, to uniquely identify the user',
      label: 'User id',
      default: { '@path': '$.userId' }
    },
    company_name: {
      type: 'string',
      required: false,
      description: 'The company name',
      label: 'Company name',
      default: { '@path': '$.traits.name' }
    },
    company_created_at: {
      type: 'string',
      required: false,
      description: 'The timestamp when the company was created',
      label: 'Company created at',
      default: { '@path': '$.traits.created_at' }
    },
    company_custom_attributes: {
      type: 'object',
      required: false,
      description: 'The company custom attributes',
      label: 'Company custom attributes',
      default: { '@path': '$.traits' }
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
