import { PredefinedContentTypes } from './types'

export const CONTENT_SID_TOKEN = '{accountSid}'

export const ACCOUNT_SID_TOKEN = '{accountSid}'

export const SEND_SMS_URL = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID_TOKEN}/Messages.json`

export const FIELD_REGEX = /\[(.*?)\]/

export const TOKEN_REGEX = /{{(.*?)}}/g

export const E164_REGEX = /^\+[1-9]\d{1,14}$/

export const TWILIO_SHORT_CODE_REGEX = /^[1-9]\d{4,5}$/

export const MESSAGING_SERVICE_SID_REGEX = /^MG[0-9a-fA-F]{32}$/

export const CONTENT_SID_REGEX = /^HX[0-9a-fA-F]{32}$/

export const GET_INCOMING_PHONE_NUMBERS_URL = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID_TOKEN}/IncomingPhoneNumbers.json?PageSize=1000`

export const GET_INCOMING_SHORT_CODES_URL = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID_TOKEN}/SMS/ShortCodes.json?PageSize=1000`

export const GET_MESSAGING_SERVICE_SIDS_URL = 'https://messaging.twilio.com/v1/Services?PageSize=1000'

export const GET_ALL_CONTENTS_URL = 'https://content.twilio.com/v1/Content?PageSize=1000'

export const GET_CONTENT_URL = `https://content.twilio.com/v1/Content/${CONTENT_SID_TOKEN}`

export const GET_CONTENT_VARIABLES_URL = `https://content.twilio.com/v1/Content/${CONTENT_SID_TOKEN}`

export const CHANNELS = {
  SMS: 'SMS',
  MMS: 'MMS',
  WHATSAPP: 'Whatsapp',
  MESSENGER: 'Messenger'
} as const

export const PREDEFINED_CONTENT_TYPES: PredefinedContentTypes = {
  TEXT: {
    friendly_name: 'Text',
    name: 'twilio/text',
    supports_media: false,
    supported_channels: [CHANNELS.SMS, CHANNELS.WHATSAPP, CHANNELS.MESSENGER]
  },
  MEDIA: {
    friendly_name: 'Media',
    name: 'twilio/media',
    supports_media: true,
    supported_channels: [CHANNELS.MMS, CHANNELS.WHATSAPP, CHANNELS.MESSENGER]
  },
  QUICK_REPLY: {
    friendly_name: 'Quick Reply',
    name: 'twilio/quick-reply',
    supports_media: false,
    supported_channels: [CHANNELS.WHATSAPP, CHANNELS.MESSENGER]
  },
  CALL_TO_ACTION: {
    friendly_name: 'Call to Action',
    name: 'twilio/call-to-action',
    supports_media: false,
    supported_channels: [CHANNELS.WHATSAPP, CHANNELS.MESSENGER]
  },
  LIST_PICKER: {
    friendly_name: 'List Picker',
    name: 'twilio/list-picker',
    supports_media: false,
    supported_channels: [CHANNELS.WHATSAPP]
  },
  CARD: {
    friendly_name: 'Card',
    name: 'twilio/card',
    supports_media: true,
    supported_channels: [CHANNELS.WHATSAPP, CHANNELS.MESSENGER]
  },
  WHATSAPP_CARD: {
    friendly_name: 'WhatsApp Card',
    name: 'whatsapp/card',
    supports_media: true,
    supported_channels: [CHANNELS.WHATSAPP]
  },
  WHATSAPP_AUTHENTICATION: {
    friendly_name: 'WhatsApp Authentication',
    name: 'whatsapp/authentication',
    supports_media: false,
    supported_channels: [CHANNELS.WHATSAPP]
  },
  CATALOG: {
    friendly_name: 'Catalog',
    name: 'twilio/catalog',
    supports_media: false,
    supported_channels: [CHANNELS.WHATSAPP]
  }
}

export const INLINE_CONTENT_TYPES = {
  INLINE: {
    friendly_name: 'Inline',
    name: undefined,
    supports_media: true,
    supported_channels: [CHANNELS.SMS, CHANNELS.MMS, CHANNELS.WHATSAPP, CHANNELS.MESSENGER]
  }
}

export const ALL_CONTENT_TYPES = {
  ...PREDEFINED_CONTENT_TYPES,
  ...INLINE_CONTENT_TYPES
}

export const CONTENT_TYPE_FRIENDLY_NAMES_SUPPORTING_MEDIA = Object.values(ALL_CONTENT_TYPES).filter((t) => t.supports_media).map((t) => t.friendly_name)

export const SENDER_TYPE = {
  PHONE_NUMBER: 'Phone number',
  MESSENGER_SENDER_ID: 'Messenger Sender ID',
  MESSAGING_SERVICE: 'Messaging Service'
}