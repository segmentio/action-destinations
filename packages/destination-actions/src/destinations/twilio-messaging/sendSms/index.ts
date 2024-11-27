import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SEND_SMS_URL, TOKEN_REGEX } from './constants'
import { SMS_PAYLOAD } from './types'
import { validate, parseFieldValue } from './utils'
import { fields } from './fields'
import { dynamicPhoneNumber, dynamicMessagingServiceSid, dynamictemplateSid, dynamicContentVariables } from './dynamic-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send SMS or MMS',
  description: "Send an SMS or MMS using Twilio's REST API.",
  fields,
  dynamicFields: {
    phoneNumber: async (request, {settings}) => {
      return await dynamicPhoneNumber(request, settings)
    },
    messagingServiceSid: async (request, {settings}) => {
    
      return await dynamicMessagingServiceSid(request, settings)
    },
    templateSid: async (request, {payload}) => {
      return await dynamictemplateSid(request, payload)
    },
    contentVariables: {
      __keys__: async (request, { payload }) => {
        return await dynamicContentVariables(request, payload)
      }
    }
  },
  perform: async (request, {payload, settings}) => {
    const url = SEND_SMS_URL.replace('{accountSID}', settings.accountSID)
    const { 
      to, 
      senderType, 
      phoneNumber, 
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
      To: to,
      ...(sendAt ? { SendAt: sendAt } : {}),
      ...(validityPeriod ? { ValidityPeriod: validityPeriod } : {}),
      ...(senderType === 'phone-number' ? { From: phoneNumber } : {}),
      ...(senderType === 'messaging-service' ? { MessagingServiceSid: parseFieldValue(messagingServiceSid) } : {}),
      ...(templateType === 'pre-defined' ? { ContentSid: parseFieldValue(templateSid), ContentVariables: contentVariables } : {}),
      ...(templateType === 'inline' && inlineBody ? { Body: encodeURIComponent(inlineBody.replace(TOKEN_REGEX, (_, key) => String(inlineVariables?.[key] ?? '')))} : ""),
      ...(urls)
    } as SMS_PAYLOAD
 
    const encodedSmsBody = new URLSearchParams()
    
    Object.entries(smsBody).forEach(([key, value]) => {
        encodedSmsBody.append(key, String(value))
    })
console.log(encodedSmsBody.toString())
    return await request(url, {
      method: 'post',
      body: encodedSmsBody.toString()
    })
  }
}

export default action