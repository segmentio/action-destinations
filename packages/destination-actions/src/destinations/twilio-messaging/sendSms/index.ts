import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SEND_SMS_URL, TOKEN_REGEX } from './constants'
import { SMS_PAYLOAD } from './types'
import { validate } from './utils'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send SMS or MMS',
  description: "Send an SMS or MMS using Twilio's REST API.",
  fields,
  perform: async (request, {payload, settings}) => {

    const url = SEND_SMS_URL.replace('{accountSID}', settings.accountSID)
    const { to, chooseSender, messagingServiceSid, from, chooseTemplateType, templateSID, contentVariables, body, media_url, inlineVariables, send_at, validity_period } = validate(payload)
        
    const smsBody = {
      To: to,
      ...(send_at ? { SendAt: send_at } : {}),
      ...(validity_period ? { ValidityPeriod: validity_period } : {}),
      ...(chooseSender === 'from' ? { From: from } : {}),
      ...(chooseSender === 'messagingService' ? { MessagingServiceSid: messagingServiceSid } : {}),
      ...(chooseTemplateType === 'templateSID' ? { ContentSid: templateSID, ContentVariables: contentVariables } : {}),
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