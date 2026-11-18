/**
 * E2E fixtures for Braze `trackEvent2` with an API key Braze rejects (see `invalidKeyConfig`).
 * They prove a partner's non-2xx response reaches the result with its status, for one event and
 * for a batch, where Braze's 401 marks every item.
 */
import type { E2EFixture } from '../../../../lib/e2e/types'
import { createE2EEvent } from '../../../../lib/e2e/helpers'

const fixtures: E2EFixture[] = [
  {
    description: 'invalid API key is rejected by Braze with 401',
    mode: 'single',
    subscribe: 'type = "track"',
    event: createE2EEvent('track', 'E2E Braze Bad Key', { userId: 'e2e-braze-user-401' }),
    mapping: { __segment_internal_sync_mode: 'add' },
    expect: { status: 'failure', httpStatus: 401 },
    verboseFailureHint: 'Braze should return 401 for an unknown API key; a 2xx means the key is valid.'
  },
  {
    description: 'invalid API key fails a batch with 401',
    mode: 'batchWithMultistatus',
    subscribe: 'type = "track"',
    events: [
      createE2EEvent('track', 'E2E Braze Bad Key A', { userId: 'e2e-braze-user-401a' }),
      createE2EEvent('track', 'E2E Braze Bad Key B', { userId: 'e2e-braze-user-401b' })
    ],
    mapping: { __segment_internal_sync_mode: 'add' },
    expect: { status: 'failure', httpStatus: 401 }
  }
]

export default fixtures
