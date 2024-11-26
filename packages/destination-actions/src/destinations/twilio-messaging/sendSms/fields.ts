import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
    to: {
      label: 'To',
      description: 'The number to send the SMS to. Must be in E.164 format. e.g. +14155552671.',
      type: 'string',
      required: true,
      default: undefined 
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
      description: 'The Twilio phone number (E.164) or short code for sending SMS/MMS. If not in the dropdown, enter it directly and ensure it supports SMS/MMS.',
      type: 'string',
      dynamic: true,
      required: false,
      default: undefined 
    },
    messagingServiceSid: {
      label: 'Messaging Service SID',
      description: 'The SID of the messaging service to use. If not in the dropdown, enter it directly.',
      type: 'string',
      dynamic: true,
      required: false,
      default: undefined 
    },
    chooseTemplateType: {
      label: 'Choose Template Type',
      description: 'Choose the type of template to use. Inline allows for the message to be defined in the Body field. Pre-defined template uses a template that is already defined in Twilio.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Pre-defined', value: 'templateSID' },
        { label: 'Inline', value: 'inline' },
        { label: 'Media only', value: 'mediaOnly' }
      ],
      default: 'inline'
    },
    templateSid: {
      label: 'Pre-defined Template SID',
      description: 'The SID of the pre-defined template to use. The template must already exist in Twilio. If not in the dropdown, enter it directly.',
      type: 'string',
      dynamic: true,
      required: false,
      default: undefined 
    },
    contentVariables: {
      label: 'Content Variables',
      description: 'Variables to be used in the template.',
      type: 'object',
      dynamic: true,
      required: false,
      defaultObjectUI: 'keyvalue',
      additionalProperties: true,
      default: undefined 
    },
    body: {
      label: 'Inline Template',
      description: 'The message to send. Template Variables values can be referenced using {{variable}} format. e.g. Hello {{first_name}}!.',
      type: 'text',
      required: true,
      default: undefined 
    },
    inlineVariables: {
      label: 'Inline Variables',
      description: 'Variables to be used in the template.',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue',
      additionalProperties: true,
      default: undefined 
    },
    media_url: {
      label: 'Media URL',
      description: 'The URL of the media to include with the message. Must be a valid media URL. Accepts a single URL or an array of URLs.',
      type: 'string',
      multiple: true,
      required: false,
      default: undefined
    },
    validity_period: {
      label: 'Validity Period',
      description: 'The number of seconds between 1-36000 that the message is valid for. Default is 36000. If the message is not delivered within this time, it will not be delivered.',
      type: 'number',
      required: false,
      minimum: 1,
      maximum: 36000,
      default: 36000
    },
    send_at: {
      label: 'Send At',
      description: 'The time that Twilio will send the message. Must be in ISO 8601 format.',
      type: 'string',
      format: 'date-time',
      required: false,
      default: undefined
    }
}