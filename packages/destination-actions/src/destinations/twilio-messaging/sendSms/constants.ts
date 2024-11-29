export const CONTENT_SID_TOKEN = '{accountSid}'

export const ACCOUNT_SID_TOKEN = '{accountSid}'

export const SEND_SMS_URL = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID_TOKEN}/Messages.json`

export const FIELD_REGEX = /\[(.*?)\]/

export const TOKEN_REGEX = /{(.*?)}/g   // matches tokens for the inline template

export const E164_REGEX = /^\+?[1-9]\d{1,14}$/

export const MESSAGING_SERVICE_SID_REGEX = /^MG[0-9a-fA-F]{32}$/

export const TEMPLATE_SID_REGEX = /^HX[0-9a-fA-F]{32}$/

export const GET_INCOMING_PHONE_NUMBERS_URL = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID_TOKEN}/IncomingPhoneNumbers.json?PageSize=1000`

export const GET_MESSAGING_SERVICE_SIDS_URL = 'https://messaging.twilio.com/v1/Services?PageSize=1000'

export const GET_TEMPLATES_URL = 'https://content.twilio.com/v1/Content?PageSize=1000'

export const GET_TEMPLATE_URL = `https://content.twilio.com/v1/Content/${CONTENT_SID_TOKEN}`

export const GET_TEMPLATE_VARIABLES_URL = `https://content.twilio.com/v1/Content/${CONTENT_SID_TOKEN}`

export const MESSAGE_TYPE = {
    INLINE: { value: 'Inline', template_name: undefined, has_media:true },
    TEXT: { value: 'Text', template_name: 'twilio/text', has_media:false },
    MEDIA: { value: 'Media', template_name: 'twilio/media', has_media:true },
    QUICK_REPLY: { value: 'Quick Reply', template_name: 'twilio/quick-reply', has_media:false },
    CALL_TO_ACTION: { value: 'Call to Action', template_name: 'twilio/call-to-action', has_media:false },
    LIST_PICKER: { value: 'List Picker', template_name: 'twilio/list-picker', has_media:false },
    CARD: { value: 'Card', template_name: 'twilio/card', has_media:true },
    WHATSAPP_CARD: { value: 'WhatsApp Card', template_name: 'whatsapp/card', has_media:true },
    WHATSAPP_AUTHENTICATION: { value: 'WhatsApp Authentication', template_name: 'whatsapp/authentication', has_media:false },
    CATALOG: { value: 'Catalog', template_name: 'twilio/catalog', has_media:false }
} as const

export type MessageType = Exclude<
  typeof MESSAGE_TYPE[keyof typeof MESSAGE_TYPE]['template_name'],
  undefined
>

export const SENDER_TYPE = {
    PHONE_NUMBER: 'Phone number',
    MESSAGING_SERVICE: 'Messaging Service'
}