import { InputField } from '@segment/actions-core'
import { ALL_CONTENT_TYPES, SENDER_TYPE, CHANNELS, CONTENT_TYPE_FRIENDLY_NAMES_SUPPORTING_MEDIA } from './constants'

export const fields: Record<string, InputField> = {
  channel: {
    label: 'Channel',
    description: 'The channel to send the message on.',
    type: 'string',
    required: true,
    choices: [
      { label: 'SMS', value: CHANNELS.SMS },
      { label: 'MMS', value: CHANNELS.MMS },
      { label: 'WhatsApp', value: CHANNELS.WHATSAPP },
      { label: 'Facebook Messenger', value: CHANNELS.MESSENGER }
    ],
    default: CHANNELS.MMS,
    disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
  },
  toPhoneNumber: {
    label: 'To Phone Number',
    description: 'The number to send the message to (E.164 format).',
    type: 'string',
    required: true,
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
  messengerPageUserId: {
    label: 'Messenger Page or User ID',
    description: 'A valid Facebook Messenger Page Id or Messenger User Id.',
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
    label: 'From Phone Number',
    description: "The Twilio phone number (E.164 format). If not in the dropdown, enter it directly. Please ensure the number supports the selected 'Channel' type.",
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
  contentTemplateType: {
    label: 'Content Template Type',
    description: 'Select the Twilio Content Template type to use.',
    type: 'string',
    required: true,
    dynamic: true
  },
  contentSid: {
    label: 'Content Template SID',
    description: 'The SID of the Content Template to use.',
    type: 'string',
    dynamic: true,
    required: false,
    allowNull: false,
    disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
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
  mediaUrls: {
    label: 'Media URLs',
    description:
      'The URLs of the media to include with the message. The URLs should be configured in the Content Template in Twilio.',
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
          fieldKey: 'contentTemplateType',
          operator: 'is',
          value: CONTENT_TYPE_FRIENDLY_NAMES_SUPPORTING_MEDIA
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
  inlineVariables: {
    label: 'Inline Variables',
    description:
      "Variables to be send with the inline message. e.g. 'first_name' would match with {{first_name}} in the Inline Template message body.",
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue',
    additionalProperties: true,
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
  validityPeriod: {
    label: 'Validity Period',
    description:
      'The number of seconds between 1-14400 that the message is valid for. Default is 14400. If the message is not delivered within this time, it will not be delivered.',
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
