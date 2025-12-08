export const SYNC_TO = {
  DSP: 'dsp',
  AMC: 'amc'
}

export const AUTHORIZATION_URL: Record<string, string> = {
  'https://advertising-api.amazon.com': 'https://api.amazon.com',
  'https://advertising-api-eu.amazon.com': 'https://api.amazon.co.uk',
  'https://advertising-api-fe.amazon.com': 'https://api.amazon.co.jp'
}

export const CONSTANTS = {
  CREATE: 'CREATE',
  DELETE: 'DELETE'
}

export const CURRENCY = ['USD', 'CAD', 'JPY', 'GBP', 'EUR', 'SAR', 'AUD', 'AED', 'CNY', 'MXN', 'INR', 'SEK', 'TRY']

export const REGEX_AUDIENCEID = /"audienceId":(\d+)/

export const REGEX_ADVERTISERID = /"advertiserId":"(\d+)"/

export const REGEX_EXTERNALUSERID = /^[0-9a-zA-Z-_]{1,128}$/

export const TTL_MAX_VALUE = 34300800

export const ALPHA_NUMERIC = /[^a-z0-9]/g

export const EMAIL_ALLOWED = /[^a-z0-9.@-]/g

export const NON_DIGIT = /[^\d]/g