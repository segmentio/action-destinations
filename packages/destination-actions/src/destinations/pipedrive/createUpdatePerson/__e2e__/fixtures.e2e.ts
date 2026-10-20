import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import createUpdatePerson from '../index'

const FLAGON_NAME_VALIDATE_DOMAIN = 'actions-pipedrive-validate-domain'

const DOMAIN_HINT =
  'Check E2E_PIPEDRIVE_DOMAIN and E2E_PIPEDRIVE_API_TOKEN. With a valid domain both fixtures succeed. ' +
  'With an invalid domain, the flag off fixture is expected to fail and the flag on fixture is expected to throw "Invalid domain".'

const fixtures: E2EFixture[] = [
  {
    description: 'Creates or updates a person with the domain validation flag off',
    subscribe: 'type = "identify"',
    mode: 'single',
    mapping: {
      ...defaultValues(createUpdatePerson.fields)
    },
    event: createE2EEvent('identify', undefined, {
      userId: 'e2e-pipedrive-flag-off-001',
      traits: {
        name: 'E2E Pipedrive Flag Off',
        email: 'e2e-pipedrive-flag-off@example.com'
      }
    }),
    features: { [FLAGON_NAME_VALIDATE_DOMAIN]: false },
    expect: {
      status: 'success'
    },
    verboseFailureHint: DOMAIN_HINT
  },
  {
    description: 'Creates or updates a person with the domain validation flag on',
    subscribe: 'type = "identify"',
    mode: 'single',
    mapping: {
      ...defaultValues(createUpdatePerson.fields)
    },
    event: createE2EEvent('identify', undefined, {
      userId: 'e2e-pipedrive-flag-on-001',
      traits: {
        name: 'E2E Pipedrive Flag On',
        email: 'e2e-pipedrive-flag-on@example.com'
      }
    }),
    features: { [FLAGON_NAME_VALIDATE_DOMAIN]: true },
    expect: {
      status: 'success'
    },
    verboseFailureHint: DOMAIN_HINT
  }
]

export default fixtures
