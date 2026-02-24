export const BASE_URL_PRODUCTION = 'https://memory.twilio.com'
export const BASE_URL_STAGING = 'https://memory.stage.twilio.com'
let BASE_URL = process.env.ACTIONS_MEMORA_ENV === 'production' ? BASE_URL_PRODUCTION : BASE_URL_STAGING
if (process.env.STUB_MEMORA_API) {
  BASE_URL = 'https://blackhole-webhook.segment.com/'
}

export { BASE_URL }
