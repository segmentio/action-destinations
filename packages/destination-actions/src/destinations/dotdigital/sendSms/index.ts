import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DDSmsApi } from '../api'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send SMS',
  description: 'Sends a marketing SMS to a contact.',
  defaultSubscription: 'type = "track" and event = "Send SMS"',
  fields: {
    to: {
      label: 'To',
      description: 'The mobile number of the contact in E.164 format (e.g. 14155552671).',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      },
      required: true
    },
    message: {
      label: 'Message',
      description: 'The message to send in the SMS.',
      type: 'text',
      required: true
    },
  },
  perform: async (request, { settings, payload }) => {
    const smsApi = new DDSmsApi(settings, request)
    return await smsApi.sendSms(payload.to, payload.message)
  }
}

export default action
