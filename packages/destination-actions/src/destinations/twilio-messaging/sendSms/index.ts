import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SEND_SMS_URL } from './constants'
import { SMS_PAYLOAD } from './types'
import { validate } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send SMS',
  description: "Send an SMS using Twilio's REST API.",
  fields: {
    to: {
      label: 'To',
      description: 'The number to send the SMS to. Must be in E.164 format. e.g. +14155552671.',
      type: 'string',
      required: true
    },
    chooseSender: {
      label: 'Choose Sender',
      description: 'Choose the sender of the SMS.',
      type: 'string',
      required: true,
      choices: [
        { label: 'From', value: 'from' },
        { label: 'Messaging Service SID', value: 'messagingServiceSid' }
      ],
      default: 'from'
    },
    from: {
      label: 'From',
      description: 'The Twilio Phone Number, Short Code, or Messaging Service to send SMS from.',
      type: 'string',
      dynamic: true,
      required: false
    },
    messagingServiceSid: {
      label: 'Messaging Service SID',
      description: 'The SID of the messaging service to use.',
      type: 'string',
      dynamic: true,
      required: false
    },
    chooseTemplateType: {
      label: 'Choose Template Type',
      description: 'Choose the type of template to use. Inline allows for the message to be defined in the Body field. Pre-defined template uses a template that is already defined in Twilio.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Pre-defined template', value: 'templateSID' },
        { label: 'Inline', value: 'inline' }
      ],
      default: 'inline'
    },
    templateSID: {
      label: 'Pre-defined Template SID',
      description: 'The SID of the pre-defined template to use. The tempalte must already exist in Twilio. Variables can be referenced with {{variable}}.',
      type: 'string',
      dynamic: true,
      required: false
    },
    contentVariables: {
      label: 'Content Variables',
      description: 'Variables to be used in the template.',
      type: 'object',
      dynamic: true,
      required: false,
      defaultObjectUI: 'keyvalue',
      additionalProperties: true 
    },
    body: {
      label: 'Inline Template',
      description: 'The message to send. Template Variables values can be referenced using {{variable}} format. e.g. Hello {{first_name}}!.',
      type: 'text',
      required: true
    },
    inlineVariables: {
      label: 'Inline Variables',
      description: 'Variables to be used in the template.',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue',
      additionalProperties: true 
    },
    validity_period: {
      label: 'Validity Period',
      description: 'The number of seconds between 1-36000 that the message is valid for. Default is 36000. If the message is not delivered within this time, it will not be delivered.',
      type: 'number',
      required: false,
      minimum: 1,
      maximum: 36000
    },
    send_at: {
      label: 'Send At',
      description: 'The time that Twilio will send the message. Must be in ISO 8601 format.',
      type: 'string',
      format: 'date-time',
      required: false
    }
  },
  perform: async (request, {payload, settings}) => {
    validate(payload)

    const url = SEND_SMS_URL.replace('{accountSID}', settings.accountSID)
    const { to, chooseSender, messagingServiceSid, from, chooseTemplateType, templateSID, contentVariables, body, inlineVariables, send_at, validity_period } = payload
        
    const smsBody = {
      To: to,
      ...(send_at ? { SendAt: send_at } : {}),
      ...(validity_period ? { ValidityPeriod: validity_period } : {}),
      ...(chooseSender === 'from' ? { From: from } : {}),
      ...(chooseSender === 'messagingService' ? { MessagingServiceSid: messagingServiceSid } : {}),
      ...(chooseTemplateType === 'templateSID' ? { ContentSid: templateSID, ContentVariables: contentVariables } : {}),
      ...(chooseTemplateType === 'inline' && body ? { Body: encodeURIComponent(body.replace(/{(.*?)}/g, (_, key) => String(inlineVariables?.[key] ?? '')))} : "")
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
