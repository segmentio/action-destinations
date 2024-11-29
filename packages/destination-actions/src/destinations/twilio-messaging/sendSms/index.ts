import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { ACCOUNT_SID_TOKEN, SEND_SMS_URL, MESSAGE_TYPE, SENDER_TYPE } from './constants'
import { SMS_PAYLOAD } from './types'
import { validate, replaceTokens, validateMediaUrls } from './utils'
import { fields } from './fields'
import { dynamicFromPhoneNumber, dynamicMessagingServiceSid, dynamicTemplateSid, dynamicMediaUrls, dynamicContentVariables } from './dynamic-fields'

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
    templateSid: async (request, {payload}) => {
      return await dynamicTemplateSid(request, payload)
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
    const { 
      toPhoneNumber, 
      senderType, 
      fromPhoneNumber, 
      messagingServiceSid, 
      messageType, 
      templateSid, 
      contentVariables, 
      inlineBody, 
      inlineVariables, 
      validityPeriod,
      sendAt,
      mediaUrls,
      inlineMediaUrls,
    } = validate(payload)

    const getSendAt = () => sendAt ? { SendAt: sendAt } : {}

    const getValidityPeriod = () => validityPeriod ? { ValidityPeriod: validityPeriod } : {}

    const getSenderDetails = () => {
      if (senderType === SENDER_TYPE.PHONE_NUMBER) {
        return { From: fromPhoneNumber }
      }
      if (senderType === SENDER_TYPE.MESSAGING_SERVICE) {
        return { MessagingServiceSid: messagingServiceSid }
      }
      return {}
    }

    const getTemplateDetails = () => {
      if (messageType === MESSAGE_TYPE.INLINE.value && inlineBody) {
        return { Body: encodeURIComponent(replaceTokens(inlineBody, inlineVariables)) }
      }
      else {
        return {
          ContentSid: templateSid,
          ...(Object.keys(contentVariables ?? {}).length > 0 && { ContentVariables: JSON.stringify(contentVariables) })
        }
      }
    }

    const getMediaUrl = () => {
      const hasMedia = MESSAGE_TYPE[messageType as keyof typeof MESSAGE_TYPE]?.has_media ?? false           
      if (hasMedia) {
        const urls: string[] = messageType === MESSAGE_TYPE.INLINE.value
          ? inlineMediaUrls
            ?.filter((item) => item.trim() !== '')
            .map((item) => replaceTokens(item.trim(), inlineVariables)) ?? []
          : mediaUrls
            ?.map((item) => item.url.trim()) ?? []

        validateMediaUrls(urls)    
        return { MediaUrl: urls }
      }
      return {}
    }

    const smsBody: SMS_PAYLOAD = (() => ({
      To: toPhoneNumber,
      ...getSendAt(),
      ...getValidityPeriod(),
      ...getSenderDetails(),
      ...getTemplateDetails(),
      ...getMediaUrl()
    }))()

    const encodedSmsBody = new URLSearchParams()
    Object.entries(smsBody).forEach(([key, value]) => {
        if(key === 'MediaUrl' && Array.isArray(value)){
          value.forEach((url) => {
            encodedSmsBody.append(`MediaUrl`, url)
          })
        } else {
          encodedSmsBody.append(key, String(value))
        }
    })

    return await request(SEND_SMS_URL.replace(ACCOUNT_SID_TOKEN, settings.accountSID), {
      method: 'post',
      body: encodedSmsBody.toString()
    })
  }
}

export default action