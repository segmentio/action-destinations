export const SEND_SMS_URL = 'https://api.twilio.com/2010-04-01/Accounts/{accountSID}/Messages.json'

export const TOKEN_REGEX = /{(.*?)}/g   // matches tokens for the inline template

export const E164_REGEX = /^\+?[1-9]\d{1,14}$/

export const MESSAGING_SERVICE_SID_REGEX = /^MG[0-9a-fA-F]{32}$/

export const TEMPLATE_SID_REGEX = /^HX[0-9a-fA-F]{32}$/

export const GET_INCOMING_PHONE_NUMBERS_URL = 'https://api.twilio.com/2010-04-01/Accounts/{accountSid}/IncomingPhoneNumbers.json?PageSize=1000'

export const GET_MESSAGING_SERVICE_SIDS_URL = 'https://messaging.twilio.com/v1/Services?PageSize=1000'

export const GET_TEMPLATES_URL = 'https://content.twilio.com/v1/Content?PageSize=1000'

export const GET_TEMPLATE_VARIABLES_URL = 'https://content.twilio.com/v1/Content/{contentSid}'