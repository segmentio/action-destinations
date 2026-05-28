import type { E2EDestinationConfig, E2EFixture } from '@segment/actions-core'
import trackEventSuccess from '../trackEvent/__e2e__/success'
import trackEventMissingIdentifiers from '../trackEvent/__e2e__/missing-identifiers'
import updateUserSuccess from '../updateUser/__e2e__/success'

export const config: E2EDestinationConfig = {
  settings: {
    apiKey: { $env: 'E2E_ITERABLE_API_KEY' },
    dataCenterLocation: 'united_states'
  }
}

export const fixtures: Record<string, E2EFixture[]> = {
  trackEvent: [trackEventSuccess, trackEventMissingIdentifiers],
  updateUser: [updateUserSuccess]
}
