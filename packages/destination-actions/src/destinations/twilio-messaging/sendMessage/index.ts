import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import {
  dynamicSenderType,
  dynamicFromPhoneNumber,
  dynamicMessagingServiceSid,
  dynamicContentSid,
  dynamicContentVariables,
  dynamicContentTemplateType
} from './dynamic-fields'
import { send } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send message',
  description: "Send messages with Twilio's REST API.",
  fields,
  dynamicFields: {
    senderType: async (_, { payload }) => {
      return await dynamicSenderType(payload)
    },
    fromPhoneNumber: async (request, { payload, settings }) => {
      return await dynamicFromPhoneNumber(request, payload, settings)
    },
    messagingServiceSid: async (request, { settings }) => {
      return await dynamicMessagingServiceSid(request, settings)
    },
    contentTemplateType: async (_, { payload }) => {
      return await dynamicContentTemplateType(payload)
    },
    contentSid: async (request, { payload }) => {
      return await dynamicContentSid(request, payload)
    },
    contentVariables: {
      __keys__: async (request, { payload }) => {
        return await dynamicContentVariables(request, payload)
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    return await send(request, payload, settings)
  }
}

export default action
