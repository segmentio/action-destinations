export const BASE_URL_PRODUCTION = 'https://memory.twilio.com'
export const BASE_URL_STAGING = 'https://memory.stage.twilio.com'
export const BASE_URL = process.env.ACTIONS_MEMORA_ENV === 'production' ? BASE_URL_PRODUCTION : BASE_URL_STAGING
