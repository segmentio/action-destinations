import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
    to: {
      label: 'To',
      description: 'The number to send the SMS to. Must be in E.164 format. e.g. +14155552671.',
      type: 'string',
      required: true,
      default: undefined 
    },
    senderType: {
      label: 'Sender Type',
      description: 'Select Sender Type',
      type: 'string',
      required: true,
      choices: [
        { label: 'Phone number', value: 'phone-number' },
        { label: 'Messaging Service', value: 'messaging-service' }
      ],
      default: 'phone-number'
    },
    phoneNumber: {
      label: 'Phone number',
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
      default: undefined,
      allowNull: false,
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
    },
    templateType: {
      label: 'Template Type',
      description: 'Inicate if a pre-defined Content Template should be used, or if the message body should be specified inline.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Pre-defined', value: 'pre-defined' },
        { label: 'Inline', value: 'inline' }
      ],
      default: 'pre-defined'
    },
    templateSid: {
      label: 'Content Template',
      description: "The SID of the pre-defined Twilio SMS or MMS template to use.",
      type: 'string',
      dynamic: true,
      required: false,
      default: undefined,
      allowNull: false,
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
    },
    mediaUrls: {
      label: 'Media URLs',
      description: 'The URLs of the media to include with the message. The URLs should be configured in the Content Template.',
      type: 'object',
      multiple: true,
      required: false,
      properties: {
        url: {
          label: 'URL',
          type: 'string',
          description: 'The URL of the media to include with the message.',
          required: true,
          dynamic: true,
          allowNull: false,
          disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
        }
      }
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
    inlineBody: {
      label: 'Inline Template',
      description: 'The message to send. Template Variables values can be referenced using {{variable}} format. e.g. Hello {{first_name}}!.',
      type: 'text',
      format: 'text',
      required: false,
      default: undefined 
    },
    inlineMediaUrls: {
      label: 'Inline Media URLs',
      description: 'The URLs of the media to include with the message. The URLs should be publicly accessible. Accepts a single URL or array of URLs.',
      type: 'string',
      multiple: true,
      required: false
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
    validityPeriod: {
      label: 'Validity Period',
      description: 'The number of seconds between 1-36000 that the message is valid for. Default is 36000. If the message is not delivered within this time, it will not be delivered.',
      type: 'number',
      required: false,
      minimum: 1,
      maximum: 36000,
      default: 36000
    },
    sendAt: {
      label: 'Send At',
      description: 'The time that Twilio will send the message. Must be in ISO 8601 format.',
      type: 'string',
      format: 'date-time',
      required: false,
      default: undefined
    }
}