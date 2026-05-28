import type { E2EDestinationConfig, E2EFixture } from '@segment/actions-core'
import trackEventFixtures from '../trackEvent/__e2e__/fixtures'
import updateUserFixtures from '../updateUser/__e2e__/fixtures'

export const config: E2EDestinationConfig = {
  settings: {
    apiKey: { $env: 'E2E_ITERABLE_API_KEY' },
    dataCenterLocation: 'united_states'
  }
}

export const fixtures: Record<string, E2EFixture[]> = {
  trackEvent: trackEventFixtures,
  updateUser: updateUserFixtures
}
