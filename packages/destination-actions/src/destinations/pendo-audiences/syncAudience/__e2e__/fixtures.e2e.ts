import type { E2EFixture, SegmentEvent } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import syncAudience from '../index'

const COMPUTATION_KEY = 'e2e_test_audience'
const COMPUTATION_ID = 'aud_e2e_pendo_001'

const FAILURE_HINT =
  'Ensure the Pendo Integration Key has segment read/write permissions and E2E_PENDO_AUDIENCES_REGION matches the account region.'

// An identify event whose traits omit the computation key, so core cannot resolve
// audience membership (true/false). Used to exercise the InvalidAudienceMembershipError path.
function createNoMembershipEvent(userId: string): SegmentEvent {
  return {
    type: 'identify',
    messageId: '$guid',
    timestamp: '$now',
    userId,
    traits: {},
    context: {
      personas: {
        computation_class: 'audience',
        computation_key: COMPUTATION_KEY,
        computation_id: COMPUTATION_ID,
        external_audience_id: '$externalAudienceId'
      }
    }
  } as unknown as SegmentEvent
}

const fixtures: E2EFixture[] = [
  {
    description:
      'Batch with successful add + remove, a missing-visitorId failure, and an unresolvable-membership failure',
    subscribe: 'type = "identify" or type = "track"',
    mapping: defaultValues(syncAudience.fields),
    mode: 'batchWithMultistatus',
    events: [
      // idx 0 — valid add → success
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: '$guid:batchAddUser'
      }),
      // idx 1 — valid remove → success
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: '$guid:batchRemoveUser'
      }),
      // idx 2 — no userId, so visitorId cannot be resolved → validation failure
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        anonymousId: '$guid:batchAnonUser'
      }),
      // idx 3 — has a visitorId but no membership boolean → InvalidAudienceMembershipError
      createNoMembershipEvent('$guid:batchNoMembershipUser')
    ],
    // Visitor IDs are random per run ($guid), so we assert the per-row status plus the
    // add/remove operation rather than exact IDs. A freshly-created segment can briefly return
    // 409 ("operation in progress"); retries give it time to settle so the writes succeed.
    // Pendo returns 200 for a successful add and 202 for a successful remove.
    retries: 5,
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200, body: { patch: [{ op: 'add', path: '/visitors' }] } },
        { status: 202, body: { patch: [{ op: 'remove', path: '/visitors' }] } },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED' },
        { status: 400, errormessage: 'Unable to determine audience membership for this event' }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
