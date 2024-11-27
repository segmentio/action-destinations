import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SEND_SMS_URL, TOKEN_REGEX, TEMPLATE_TYPE, SENDER_TYPE } from './constants'
import { SMS_PAYLOAD } from './types'
import { validate } from './utils'
import { fields } from './fields'
import { dynamicFromPhoneNumber, dynamicMessagingServiceSid, dynamicTemplateSid, dynamicContentVariables } from './dynamic-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send SMS or MMS',
  description: "Send SMS or MMS messages using Twilio's REST API.",
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
      templateType, 
      templateSid, 
      contentVariables, 
      inlineBody, 
      inlineVariables, 
      validityPeriod,
      sendAt,
      urls
    } = validate(payload)

    const smsBody = {
      To: toPhoneNumber,
      ...(sendAt ? { SendAt: sendAt } : {}),
      ...(validityPeriod ? { ValidityPeriod: validityPeriod } : {}),
      ...(senderType === SENDER_TYPE.PHONE_NUMBER ? { From: fromPhoneNumber } : {}),
      ...(senderType === SENDER_TYPE.MESSAGING_SERVICE ? { MessagingServiceSid: messagingServiceSid } : {}),
      ...(templateType === TEMPLATE_TYPE.PRE_DEFINED ? { ContentSid: templateSid, ...(contentVariables ? { ContentVariables: JSON.stringify(contentVariables) } : {}) } : {}),
      ...(templateType === TEMPLATE_TYPE.INLINE && inlineBody ? { Body: encodeURIComponent(inlineBody.replace(TOKEN_REGEX, (_, key) => String(inlineVariables?.[key] ?? '')))} : ""),
      ...(urls.length > 0 ? { MediaUrl: urls } : [])
    } as SMS_PAYLOAD

    const encodedSmsBody = new URLSearchParams()
    Object.entries(smsBody).forEach(([key, value]) => {
        encodedSmsBody.append(key, String(value))
    })

    return await request(SEND_SMS_URL.replace('{accountSid}', settings.accountSID), {
      method: 'post',
      body: encodedSmsBody.toString()
    })
  }
}

export default action