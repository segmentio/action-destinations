export const SEND_SMS_URL = `https://api.twilio.com/2010-04-01/Accounts/{accountSID}/Messages.json`

export const TOKEN_REGEX = /{(.*?)}/g   // matches tokens for the inline template

export const E164_REGEX = /^\+?[1-9]\d{1,14}$/

export const MESSAGING_SERVICE_SID_REGEX = /^MG[0-9a-fA-F]{32}$/

export const TEMPLATE_SID_REGEX = /^HX[0-9a-fA-F]{32}$/