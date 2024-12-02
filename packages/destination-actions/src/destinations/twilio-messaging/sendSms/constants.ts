export const CONTENT_SID_TOKEN = '{accountSid}'

export const ACCOUNT_SID_TOKEN = '{accountSid}'

export const SEND_SMS_URL = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID_TOKEN}/Messages.json`

export const FIELD_REGEX = /\[(.*?)\]/

export const TOKEN_REGEX = /{{(.*?)}}/g  

export const E164_REGEX = /^\+?[1-9]\d{1,14}$/

export const MESSAGING_SERVICE_SID_REGEX = /^MG[0-9a-fA-F]{32}$/

export const CONTENT_SID_REGEX = /^HX[0-9a-fA-F]{32}$/

export const GET_INCOMING_PHONE_NUMBERS_URL = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID_TOKEN}/IncomingPhoneNumbers.json?PageSize=1000`

export const GET_MESSAGING_SERVICE_SIDS_URL = 'https://messaging.twilio.com/v1/Services?PageSize=1000'

export const GET_ALL_CONTENTS_URL = 'https://content.twilio.com/v1/Content?PageSize=1000'

export const GET_CONTENT_URL = `https://content.twilio.com/v1/Content/${CONTENT_SID_TOKEN}`

export const GET_CONTENT_VARIABLES_URL = `https://content.twilio.com/v1/Content/${CONTENT_SID_TOKEN}`

export const PREDEFINED_MESSAGE_TYPES = {
    TEXT: { friendly_name: 'Text', name: 'twilio/text', supports_media:false },
    MEDIA: { friendly_name: 'Media', name: 'twilio/media', supports_media:true },
    QUICK_REPLY: { friendly_name: 'Quick Reply', name: 'twilio/quick-reply', supports_media:false },
    CALL_TO_ACTION: { friendly_name: 'Call to Action', name: 'twilio/call-to-action', supports_media:false },
    LIST_PICKER: { friendly_name: 'List Picker', name: 'twilio/list-picker', supports_media:false },
    CARD: { friendly_name: 'Card', name: 'twilio/card', supports_media:true },
    WHATSAPP_CARD: { friendly_name: 'WhatsApp Card', name: 'whatsapp/card', supports_media:true },
    WHATSAPP_AUTHENTICATION: { friendly_name: 'WhatsApp Authentication', name: 'whatsapp/authentication', supports_media:false },
    CATALOG: { friendly_name: 'Catalog', name: 'twilio/catalog', supports_media:false }
} as const

export const INLINE_MESSAGE_TYPES = {
  INLINE: { friendly_name: 'Inline', name: undefined, supports_media:true }
} as const

export const ALL_MESSAGE_TYPES = {
  ...PREDEFINED_MESSAGE_TYPES,
  ...INLINE_MESSAGE_TYPES
}

export const SENDER_TYPE = {
    PHONE_NUMBER: 'Phone number',
    MESSAGING_SERVICE: 'Messaging Service'
}