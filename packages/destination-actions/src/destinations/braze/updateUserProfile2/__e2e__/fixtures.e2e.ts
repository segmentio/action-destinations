/**
 * E2E fixtures for Braze `updateUserProfile2` (`POST /users/track`, `attributes`).
 *
 * The action supports only the `update` sync mode, so `add` is rejected by the action itself.
 */
import type { E2EFixture } from '../../../../lib/e2e/types'
import { createE2EEvent } from '../../../../lib/e2e/helpers'

const UPDATE = { __segment_internal_sync_mode: 'update' }

const identify = (userId: string, traits: Record<string, string | number | boolean>) =>
  createE2EEvent('identify', undefined, { userId, traits })

const fixtures: E2EFixture[] = [
  {
    description: 'identify with standard and custom traits updates one profile',
    mode: 'single',
    subscribe: 'type = "identify"',
    event: identify('e2e-braze-user-001', {
      first_name: 'E2E',
      last_name: 'Braze',
      gender: 'female',
      e2e_plan: 'sandbox',
      e2e_score: 7
    }),
    mapping: UPDATE,
    expect: { status: 'success', httpStatus: 201, jsonContains: { message: 'success', attributes_processed: 1 } },
    // A profile write can briefly 5xx under load; overrides the suite's one retry.
    retries: 2
  },
  {
    description: 'batch of two identifies updates two profiles',
    mode: 'batchWithMultistatus',
    subscribe: 'type = "identify"',
    events: [
      identify('e2e-braze-batch-001', { e2e_plan: 'sandbox' }),
      identify('e2e-braze-batch-002', { e2e_plan: 'sandbox' })
    ],
    mapping: UPDATE,
    expect: { status: 'success', jsonContains: { attributes_processed: 2 } }
  },
  {
    description: 'identify in add mode is rejected as an unsupported sync mode',
    mode: 'single',
    subscribe: 'type = "identify"',
    event: identify('e2e-braze-user-err-001', { e2e_plan: 'sandbox' }),
    mapping: { __segment_internal_sync_mode: 'add' },
    expect: {
      status: 'error',
      errorType: 'Invalid syncMode',
      httpStatus: 400,
      errorMessage: 'Sync mode add is not supported'
    }
  },
  {
    description: 'identify with no user identifier is rejected before any request',
    mode: 'single',
    subscribe: 'type = "identify"',
    event: createE2EEvent('identify', undefined, { anonymousId: 'e2e-braze-anon-err-001', traits: { e2e_plan: 'x' } }),
    mapping: UPDATE,
    expect: { status: 'error', errorType: 'Missing required fields', httpStatus: 400 }
  }
]

export default fixtures
