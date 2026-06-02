import type { E2EAudienceDestinationConfig } from '@segment/actions-core'

export const config: E2EAudienceDestinationConfig = {
  settings: {
    apiKey: { $env: 'E2E_ITERABLE_AUDIENCES_API_KEY' },
    iterableProjectType: 'hybrid'
  },
  audience: {
    audienceName: 'e2e_test_audience',
    audienceSettings: {},
    createAudience: true,
    getAudience: false,
    teardown: false
  }
}
