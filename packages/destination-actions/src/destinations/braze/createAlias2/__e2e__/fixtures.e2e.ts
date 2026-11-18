/**
 * E2E fixtures for Braze `createAlias2` (`POST /users/alias/new`). It has no batch path.
 *
 * Each attempt makes a new alias: `$guid:alias` names it, and the mapping reads it back from the
 * event, so the alias sent is the one the event carries.
 */
import type { E2EFixture } from '../../../../lib/e2e/types'
import { createE2EEvent } from '../../../../lib/e2e/helpers'

const ADD = { __segment_internal_sync_mode: 'add' }

const fixtures: E2EFixture[] = [
  {
    description: 'new alias for an identified user is created',
    mode: 'single',
    subscribe: 'event = "Create Alias"',
    event: createE2EEvent('track', 'Create Alias', {
      userId: 'e2e-braze-user-001',
      properties: { alias_name: '$guid:alias' }
    }),
    mapping: {
      ...ADD,
      external_id: { '@path': '$.userId' },
      alias_name: { '@path': '$.properties.alias_name' },
      alias_label: 'e2e_alias'
    },
    expect: { status: 'success', httpStatus: 201, jsonContains: { message: 'success', aliases_processed: 1 } }
  },
  {
    description: 'new alias-only user is created with no external id',
    mode: 'single',
    subscribe: 'event = "Create Alias"',
    event: createE2EEvent('track', 'Create Alias', { anonymousId: '$guid:anon' }),
    mapping: { ...ADD, alias_name: { '@path': '$.anonymousId' }, alias_label: 'e2e_anonymous_id' },
    expect: { status: 'success', jsonContains: { aliases_processed: 1 } }
  },
  {
    description: 'alias with no label fails validation before any request',
    mode: 'single',
    subscribe: 'event = "Create Alias"',
    event: createE2EEvent('track', 'Create Alias', { userId: 'e2e-braze-user-err-001' }),
    mapping: { ...ADD, alias_name: 'e2e-alias-no-label' },
    expect: {
      status: 'error',
      errorType: 'PAYLOAD_VALIDATION_FAILED',
      httpStatus: 400,
      errorMessage: "missing the required field 'alias_label'"
    }
  }
]

export default fixtures
