/**
 * Component test fixtures for Mixpanel `trackEvent` with strict mode off (see `nonStrictConfig`).
 *
 *  - `success` — the future-timed event strict mode rejects (fixtures.ct.ts) gets a 200.
 */
import type { CTFixture } from '../../../../lib/component-test/types'
import { futureEvent } from './fixtures.ct'

const fixtures: CTFixture[] = [
  {
    description: 'future-timed event is not rejected with strict mode off',
    mode: 'single',
    subscribe: 'type = "track"',
    event: futureEvent('e2e-user-nonstrict-001'),
    mapping: {},
    features: { 'actions-mixpanel-project-token-auth': true },
    expect: { status: 'success', httpStatus: 200 }
  }
]

export default fixtures
