import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent, FLAGS } from '@segment/actions-core'
import userList from '../index'

const COMPUTATION_KEY = 'e2e_test_user_list'
const COMPUTATION_ID = 'aud_e2e_google_001'

const FAILURE_HINT = 'Ensure GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID, GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET, and ADWORDS_DEVELOPER_TOKEN env vars are set. The customerId must be a valid Google Ads account.'

// Engage add/remove is driven by the event name (Audience Entered/Exited) and is independent of the
// audience-membership feature flag. Each scenario below is defined once and run twice — once
// flag-OFF and once flag-ON — asserting the SAME expected output, which proves the flag does not
// change Engage behaviour.
const baseFixtures: E2EFixture[] = [
  {
    description: 'Engage Audience: Add a user to the customer match list via track event',
    subscribe: 'event = "Audience Entered" or event = "Audience Exited"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED'
    },
    mode: 'single',
    event: createE2EEngageAudienceEvent({
      type: 'track',
      action: 'add',
      eventName: 'Audience Entered',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-google-user-001',
      email: 'e2e-google-test-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Engage Audience: Remove a user from the customer match list via track event',
    subscribe: 'event = "Audience Entered"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED'
    },
    mode: 'single',
    event: createE2EEngageAudienceEvent({
      type: 'track',
      action: 'remove',
      eventName: 'Audience Exited',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-google-user-001',
      email: 'e2e-google-test-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Engage Audience: Batch add and remove users from the customer match list',
    subscribe: 'event = "Audience Entered" or event = "Audience Exited"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-user-002',
        email: 'e2e-google-test-002@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-user-003',
        email: 'e2e-google-test-003@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'remove',
        eventName: 'Audience Exited',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-user-001',
        email: 'e2e-google-test-001@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: { create: { userIdentifiers: [{ hashedEmail: 'ed0929a753a3a21b343a7dde6ea518e71ff7f7016ff9f794fc15a6b281dd3596' }] } }
        },
        {
          status: 200,
          sent: { create: { userIdentifiers: [{ hashedEmail: '68bb6163c36a3c629fdec854ba60a445191ae745e81d2ea30bd2dc6de8639fb0' }] } }
        },
        {
          status: 200,
          sent: { remove: { userIdentifiers: [{ hashedEmail: 'afccaad85313c73389344c48ad104e32e73abb309c660c529bc7869aba7e1298' }] } }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // 9-event batch with adds and removes interleaved with invalid payloads, to verify the
    // per-index multi-status mapping (sent operation + error) stays correct under reordering.
    // Order: add✓, remove✓, add✗, remove✓, remove✗, add✓, add✓, remove✗, remove✓
    description: 'Engage Audience: 9-event mixed batch — interleaved valid/invalid adds and removes keep correct indexes',
    subscribe: 'event = "Audience Entered" or event = "Audience Exited"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2EEngageAudienceEvent({ type: 'track', action: 'add', eventName: 'Audience Entered', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'eng-0', email: 'eng-0@segment.com' }),
      createE2EEngageAudienceEvent({ type: 'track', action: 'remove', eventName: 'Audience Exited', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'eng-1', email: 'eng-1@segment.com' }),
      createE2EEngageAudienceEvent({ type: 'track', action: 'add', eventName: 'Audience Entered', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'eng-2' }),
      createE2EEngageAudienceEvent({ type: 'track', action: 'remove', eventName: 'Audience Exited', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'eng-3', email: 'eng-3@segment.com' }),
      createE2EEngageAudienceEvent({ type: 'track', action: 'remove', eventName: 'Audience Exited', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'eng-4' }),
      createE2EEngageAudienceEvent({ type: 'track', action: 'add', eventName: 'Audience Entered', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'eng-5', email: 'eng-5@segment.com' }),
      createE2EEngageAudienceEvent({ type: 'track', action: 'add', eventName: 'Audience Entered', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'eng-6', email: 'eng-6@segment.com' }),
      createE2EEngageAudienceEvent({ type: 'track', action: 'remove', eventName: 'Audience Exited', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'eng-7' }),
      createE2EEngageAudienceEvent({ type: 'track', action: 'remove', eventName: 'Audience Exited', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'eng-8', email: 'eng-8@segment.com' })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: '933a7b9c77740f82a4dc45199faf1d4480284882be71dcc24d75fc7bd79f316d' }] } } },
        { status: 200, sent: { remove: { userIdentifiers: [{ hashedEmail: '909eb51e2387a8a1a5529d12de458155784fb822dabd471db33d7d32c209ac36' }] } } },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'Missing or Invalid data for CONTACT_INFO.', errorreporter: 'INTEGRATIONS' },
        { status: 200, sent: { remove: { userIdentifiers: [{ hashedEmail: '5850f3d49135b144c6f20afee2c75902077e11361ec47d071e9f83381576ed5a' }] } } },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'Missing or Invalid data for CONTACT_INFO.', errorreporter: 'INTEGRATIONS' },
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: 'b7e64df010cdea3d026ccca6ded57425b47bf7387045ebbcc4ff93b015d3519e' }] } } },
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: 'ef8aaa0dc5fbee41ac7525970a089167c17496fd144c6718a7e46539783f7bcb' }] } } },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'Missing or Invalid data for CONTACT_INFO.', errorreporter: 'INTEGRATIONS' },
        { status: 200, sent: { remove: { userIdentifiers: [{ hashedEmail: '0184be992dafe5c8a136852078ed10f641bc6dfe9499417f53c9e1a67458e6f8' }] } } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

// Run every scenario twice: flag-OFF and flag-ON. Both assert the SAME expected output, proving
// Engage behaviour is independent of the audience-membership feature flag.
const flagIndependentFixtures: E2EFixture[] = baseFixtures.flatMap((fixture) => [
  { ...fixture, description: `${fixture.description} (flag OFF)` },
  { ...fixture, description: `${fixture.description} (flag ON)`, features: { [FLAGS.ACTIONS_GOOGLE_EC_AUDIENCE_MEMBERSHIP]: true } }
])

// Flag-ON-only fixtures using arbitrary (non-"Audience Entered/Exited") event names. With the flag
// on, the add/remove operation is resolved by actions-core from the audience membership signal
// (properties[computation_key]), NOT from the event name — so any event name works. (With the flag
// off these same payloads would return "Could not determine Operation Type", which is why they are
// flag-ON only.)
const flagOnCustomEventNameFixtures: E2EFixture[] = [
  {
    description: 'Engage Audience (flag ON): custom event name "Signed Up" adds via audience membership (true)',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'single',
    features: { [FLAGS.ACTIONS_GOOGLE_EC_AUDIENCE_MEMBERSHIP]: true },
    event: createE2EEngageAudienceEvent({
      type: 'track',
      action: 'add',
      eventName: 'Signed Up',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'eng-custom-add',
      email: 'eng-custom-add@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Engage Audience (flag ON): custom event names resolve add/remove from audience membership, not event name',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'batchWithMultistatus',
    features: { [FLAGS.ACTIONS_GOOGLE_EC_AUDIENCE_MEMBERSHIP]: true },
    events: [
      createE2EEngageAudienceEvent({ type: 'track', action: 'add', eventName: 'Signed Up', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'eng-custom-b1', email: 'eng-custom-b1@segment.com' }),
      createE2EEngageAudienceEvent({ type: 'track', action: 'remove', eventName: 'Account Closed', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'eng-custom-b2', email: 'eng-custom-b2@segment.com' }),
      createE2EEngageAudienceEvent({ type: 'track', action: 'add', eventName: 'Completed Purchase', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'eng-custom-b3', email: 'eng-custom-b3@segment.com' })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: 'ee7981caccbe1912787c5fcdf9e335b236f3adee3dd200ae2ec043f5a64b140e' }] } } },
        { status: 200, sent: { remove: { userIdentifiers: [{ hashedEmail: '5e528e6789bc100b9cd37a92ebfe2769c34d116e8dd6a6829769fb04ebec88d5' }] } } },
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: 'cab4f03dcf6f27b17ea90819b9be769ad7fbe89320134becbda71397c3520210' }] } } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

const fixtures: E2EFixture[] = [...flagIndependentFixtures, ...flagOnCustomEventNameFixtures]

export default fixtures
