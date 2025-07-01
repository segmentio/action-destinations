import { InputField } from '@segment/actions-core'
import { ALL_CONTENT_TYPES, SENDER_TYPE, CHANNELS } from './constants'

export const fields: Record<string, InputField> = {
  channel: {
    label: 'Channel',
    description: 'The channel to send the message on.',
    type: 'string',
    required: true,
    choices: [
      { label: 'SMS', value: CHANNELS.SMS },
      { label: 'MMS', value: CHANNELS.MMS },
      { label: 'WhatsApp', value: CHANNELS.WHATSAPP }
      //{ label: 'RCS', value: CHANNELS.RCS } Will be hidden for private beta
    ]
  },
  senderType: {
    label: 'Sender Type',
    description:
      "The Sender type to use for the message. Depending on the selected 'Channel' this can be a phone number, messaging service, or Messenger sender ID.",
    type: 'string',
    required: true,
    dynamic: true
  },
  contentTemplateType: {
    label: 'Content Template Type',
    description:
      'The Content Template type to use for the message. Selecting "Inline" will allow you to define the message body directly. For all other options a Content Template must be pre-defined in Twilio.',
    type: 'string',
    required: true,
    dynamic: true
  },
  toPhoneNumber: {
    label: 'To Phone Number',
    description: 'The number to send the message to (E.164 format).',
    type: 'string',
    required: false,
    default: undefined,
    depends_on: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'channel',
          operator: 'is_not',
          value: CHANNELS.MESSENGER
        }
      ]
    }
  },
  toMessengerPageUserId: {
    label: 'To Messenger Page or User ID',
    description: 'A valid Facebook Messenger Page Id or Messenger User Id to send the message to.',
    type: 'string',
    required: false,
    default: undefined,
    depends_on: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'channel',
          operator: 'is',
          value: CHANNELS.MESSENGER
        }
      ]
    }
  },
  fromPhoneNumber: {
    label: 'From Phone Number',
    description:
      "The Twilio phone number (E.164 format) or Short Code. If not in the dropdown, enter it directly. Please ensure the number supports the selected 'Channel' type.",
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
  fromMessengerSenderId: {
    label: 'From Messenger Sender ID',
    description:
      'The unique identifier for your Facebook Page, used to send messages via Messenger. You can find this in your Facebook Page settings.',
    type: 'string',
    required: false,
    default: undefined,
    depends_on: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'senderType',
          operator: 'is',
          value: SENDER_TYPE.MESSENGER_SENDER_ID
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
  contentSid: {
    label: 'Content Template SID',
    description: 'The SID of the Content Template to use.',
    type: 'string',
    dynamic: true,
    required: false,
    allowNull: false,
    disabledInputMethods: ['variable', 'function'],
    depends_on: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'contentTemplateType',
          operator: 'is_not',
          value: ALL_CONTENT_TYPES.INLINE.friendly_name
        }
      ]
    }
  },
  contentVariables: {
    label: 'Content Variables',
    description:
      'Variables to be used in the Content Template. The Variables must be defined in the Content Template in Twilio.',
    type: 'object',
    dynamic: true,
    required: false,
    defaultObjectUI: 'keyvalue',
    additionalProperties: true,
    depends_on: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'contentTemplateType',
          operator: 'is_not',
          value: ALL_CONTENT_TYPES.INLINE.friendly_name
        }
      ]
    }
  },
  inlineBody: {
    label: 'Inline Template',
    description:
      'Define an inline message body to be sent. Variables values can be referenced using {{variable}} format. e.g. Hello {{first_name}}!.',
    type: 'text',
    format: 'text',
    required: false,
    default: undefined,
    depends_on: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'contentTemplateType',
          operator: 'is',
          value: ALL_CONTENT_TYPES.INLINE.friendly_name
        }
      ]
    }
  },
  inlineMediaUrls: {
    label: 'Inline Media URLs',
    description: 'The URLs of the media to sent with the inline message. The URLs must be publicaly accessible.',
    type: 'string',
    multiple: true,
    required: false,
    depends_on: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'contentTemplateType',
          operator: 'is',
          value: ALL_CONTENT_TYPES.INLINE.friendly_name
        }
      ]
    }
  },
  validityPeriod: {
    label: 'Validity Period',
    description:
      'The number of seconds between 1-14400 that the message is valid for. Default is 14400. If the message is not delivered within this time, it will not be delivered.',
    type: 'number',
    required: false,
    minimum: 1,
    maximum: 14400,
    default: undefined
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
