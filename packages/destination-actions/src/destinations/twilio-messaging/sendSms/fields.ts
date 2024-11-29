import { InputField } from '@segment/actions-core'
import { MESSAGE_TYPE, SENDER_TYPE } from './constants'

export const fields: Record<string, InputField> = {
    toPhoneNumber: {
      label: 'To phone number',
      description: 'The number to send the SMS to (E.164 format).',
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
        { label: SENDER_TYPE.PHONE_NUMBER, value: SENDER_TYPE.PHONE_NUMBER },
        { label: SENDER_TYPE.MESSAGING_SERVICE, value: SENDER_TYPE.MESSAGING_SERVICE }
      ],
      default: SENDER_TYPE.PHONE_NUMBER
    },
    fromPhoneNumber: {
      label: 'From phone number',
      description: 'The Twilio phone number (E.164 format) or short code for sending SMS/MMS. If not in the dropdown, enter it directly and ensure the number supports SMS/MMS.',
      type: 'string',
      dynamic: true,
      required: false,
      default: undefined,
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'senderType',
            operator: 'is',
            value: SENDER_TYPE.PHONE_NUMBER
          }
        ]
      }
    },
    messagingServiceSid: {
      label: 'Messaging Service SID',
      description: 'The SID of the messaging service to use. If not in the dropdown, enter it directly.',
      type: 'string',
      dynamic: true,
      required: false,
      default: undefined,
      allowNull: false,
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'senderType',
            operator: 'is',
            value: SENDER_TYPE.MESSAGING_SERVICE
          }
        ]
      }
    },
    messageType: {
      label: 'Message Type',
      description: 'Select the Twilio message type to use.',
      type: 'string',
      required: true,
      choices: Object.values(MESSAGE_TYPE).map((template) => ({ label: template.value, value: template.value })),
      default: MESSAGE_TYPE.INLINE.value
    },
    templateSid: {
      label: 'Template SID',
      description: "The SID of the Content Template to use.",
      type: 'string',
      dynamic: true,
      required: false,
      allowNull: false,
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'messageType',
            operator: 'is_not',
            value: MESSAGE_TYPE.INLINE.value
          }
        ]
      }
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
      },
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'messageType',
            operator: 'is',
            value: Object.values(MESSAGE_TYPE).filter((t) => t.has_media).map((template) => ({ label: template.value, value: template.value })),
          }
        ]
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
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'messageType',
            operator: 'is_not',
            value: MESSAGE_TYPE.INLINE.value
          }
        ]
      }
    },
    inlineBody: {
      label: 'Inline Template',
      description: 'Define the message to be sent inline. Template Variables values can be referenced using {{variable}} format. e.g. Hello {{first_name}}!.',
      type: 'text',
      format: 'text',
      required: false,
      default: undefined,
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'messageType',
            operator: 'is',
            value: MESSAGE_TYPE.INLINE.value
          }
        ]
      }
    },
    inlineMediaUrls: {
      label: 'Inline Media URLs',
      description: 'The URLs of the media to include with the message. The URLs should be publicly accessible. Accepts a single URL or array of URLs.',
      type: 'string',
      multiple: true,
      required: false,
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'messageType',
            operator: 'is',
            value: MESSAGE_TYPE.INLINE.value
          }
        ]
      }
    },
    inlineVariables: {
      label: 'Inline Variables',
      description: 'Variables to be used in the template.',
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue',
      additionalProperties: true,
      default: undefined,
      depends_on: {
        match: 'all',
        conditions: [
          {
            fieldKey: 'messageType',
            operator: 'is',
            value: MESSAGE_TYPE.INLINE.value
          }
        ]
      }
    },
    validityPeriod: {
      label: 'Validity Period',
      description: 'The number of seconds between 1-14400 that the message is valid for. Default is 14400. If the message is not delivered within this time, it will not be delivered.',
      type: 'number',
      required: false,
      minimum: 1,
      maximum: 14400,
      default: 14400
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