import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import { dynamicFromPhoneNumber, dynamicMessagingServiceSid, dynamicContentSid, dynamicMediaUrls, dynamicContentVariables } from './dynamic-fields'
import { send } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send message',
  description: "Send messages using Twilio's REST API.",
  fields,
  dynamicFields: {
    fromPhoneNumber: async (request, {settings}) => {
      return await dynamicFromPhoneNumber(request, settings)
    },
    messagingServiceSid: async (request, {settings}) => {
      return await dynamicMessagingServiceSid(request, settings)
    },
    contentSid: async (request, {payload}) => {
      return await dynamicContentSid(request, payload)
    },
    mediaUrls: {
      url: async (request, {payload}) => {
        return await dynamicMediaUrls(request, payload)
      }
    },
    contentVariables: {
      __keys__: async (request, { payload }) => {
        return await dynamicContentVariables(request, payload)
      }
    }
  },
  perform: async (request, {payload, settings}) => {    
    return await send(request, payload, settings)
  }
}

export default action