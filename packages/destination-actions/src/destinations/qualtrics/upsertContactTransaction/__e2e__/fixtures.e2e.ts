import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import upsertContactTransaction from '../index'

const FLAGON_NAME_VALIDATE_DATACENTER = 'actions-qualtrics-validate-datacenter'

const DATACENTER_HINT =
  'Set E2E_QUALTRICS_DATACENTER. With a valid datacenter the request reaches Qualtrics and is rejected for the placeholder token. ' +
  'With an invalid datacenter, the flag off fixture is sent to the built host and the flag on fixture throws "Invalid datacenter ID".'

const mapping = {
  ...defaultValues(upsertContactTransaction.fields),
  directoryId: 'POOL_e2etest'
}

const event = (userId: string) =>
  createE2EEvent('track', 'Transaction Created', {
    userId,
    traits: {
      qualtricsMailingListId: 'CG_e2etest',
      qualtricsContactId: 'CID_e2etest'
    }
  })

const fixtures: E2EFixture[] = [
  {
    description: 'Upserts a contact transaction with the datacenter validation flag off',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping,
    event: event('e2e-qualtrics-flag-off-001'),
    features: { [FLAGON_NAME_VALIDATE_DATACENTER]: false },
    expect: {
      status: 'failure',
      httpStatus: 401
    },
    verboseFailureHint: DATACENTER_HINT
  },
  {
    description: 'Upserts a contact transaction with the datacenter validation flag on',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping,
    event: event('e2e-qualtrics-flag-on-001'),
    features: { [FLAGON_NAME_VALIDATE_DATACENTER]: true },
    expect: {
      status: 'failure',
      httpStatus: 401
    },
    verboseFailureHint: DATACENTER_HINT
  }
]

export default fixtures
