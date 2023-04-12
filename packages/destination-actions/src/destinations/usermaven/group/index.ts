import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common-definitions'
import { eventRequestParams, resolveRequestPayload } from '../request-params'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group',
  description: '',
  fields: {
    company: {
      type: 'object',
      required: true,
      description: 'The company object',
      label: 'Company',
      defaultObjectUI: 'keyvalue',
      properties: {
        id: {
          label: 'Company ID',
          type: 'string',
          required: true
        },
        name: {
          label: 'Company Name',
          type: 'string',
          required: true
        },
        created_at: {
          label: 'Company Created At',
          type: 'string',
          required: true
        },
        custom: {
          label: 'Custom Attributes',
          type: 'object',
          required: false
        }
      },
      default: {
        id: { '@path': '$.groupId' },
        name: { '@path': '$.traits.name' },
        created_at: { '@path': '$.traits.company_created_at' }
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
