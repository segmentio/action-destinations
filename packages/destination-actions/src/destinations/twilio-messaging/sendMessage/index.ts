import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import { ALL_CONTENT_TYPES } from './constants'
import {
  dynamicFromPhoneNumber,
  dynamicMessagingServiceSid,
  dynamicContentSid,
  dynamicMediaUrls,
  dynamicContentVariables,
  dynamicContentTemplateType
} from './dynamic-fields'
import { send } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send message',
  description: "Send messages with Twilio's REST API.",
  fields,
  dynamicFields: {
    fromPhoneNumber: async (request, { settings }) => {
      return await dynamicFromPhoneNumber(request, settings)
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
    mediaUrls: {
      url: async (request, { payload }) => {
        return await dynamicMediaUrls(request, payload)
      }
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
