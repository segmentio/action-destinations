import { LAUNCHDARKLY_AUDIENCES_API_VERSION } from '../versioning-info'

export const CONSTANTS = {
  LD_CLIENT_SDK_BASE_URL: 'https://clientsdk.launchdarkly.com',
  LD_API_BASE_URL: `https://app.launchdarkly.com/api/${LAUNCHDARKLY_AUDIENCES_API_VERSION}`,

  LD_API_CUSTOM_AUDIENCE_ENDPOINT: '/segment-targets/segment-audiences',
  ADD: 'ADD',
  REMOVE: 'REMOVE'
}
