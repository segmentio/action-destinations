import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SEND_SMS_URL, TOKEN_REGEX } from './constants'
import { SMS_PAYLOAD } from './types'
import { validate, parseFieldValue } from './utils'
import { fields } from './fields'
import { dynamicFrom, dynamicMessagingServiceSid, dynamictemplateSid, dynamicContentVariables } from './dynamic-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send SMS or MMS',
  description: "Send an SMS or MMS using Twilio's REST API.",
  fields,
  dynamicFields: {
    from: async (request, {settings}) => {
      return await dynamicFrom(request, settings)
    },
    messagingServiceSid: async (request, {settings}) => {
      return await dynamicMessagingServiceSid(request, settings)
    },
    templateSid: async (request) => {
      return await dynamictemplateSid(request)
    },
    contentVariables: {
      __keys__: async (request, { payload }) => {
        return await dynamicContentVariables(request, payload)
      }
    }
  },
  perform: async (request, {payload, settings}) => {

    const url = SEND_SMS_URL.replace('{accountSID}', settings.accountSID)
    const { to, chooseSender, messagingServiceSid, from, chooseTemplateType, templateSid, contentVariables, body, media_url, inlineVariables, send_at, validity_period } = validate(payload)

    const smsBody = {
      To: to,
      ...(send_at ? { SendAt: send_at } : {}),
      ...(validity_period ? { ValidityPeriod: validity_period } : {}),
      ...(chooseSender === 'from' ? { From: from } : {}),
      ...(chooseSender === 'messagingService' ? { MessagingServiceSid: parseFieldValue(messagingServiceSid) } : {}),
      ...(chooseTemplateType === 'templateSID' ? { ContentSid: parseFieldValue(templateSid), ContentVariables: contentVariables } : {}),
      ...(chooseTemplateType === 'inline' && body ? { Body: encodeURIComponent(body.replace(TOKEN_REGEX, (_, key) => String(inlineVariables?.[key] ?? '')))} : ""),
      ...(chooseTemplateType === 'mediaOnly' ? { MediaUrl: media_url } : {})
    } as SMS_PAYLOAD
 
    const encodedSmsBody = new URLSearchParams()
    
    Object.entries(smsBody).forEach(([key, value]) => {
        encodedSmsBody.append(key, String(value))
    })

    return await request(url, {
      method: 'post',
      body: encodedSmsBody.toString()
    })
  }
}

export default action