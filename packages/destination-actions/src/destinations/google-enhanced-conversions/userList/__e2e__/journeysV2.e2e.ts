import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EJourneysV2AudienceEvent, FLAGS } from '@segment/actions-core'
import userList from '../index'

const COMPUTATION_KEY = 'e2e_test_user_list'
const COMPUTATION_ID = 'journey_e2e_google_v2_001'

// Journeys V2 is only ever sent with the audience-membership feature flag ON. Every fixture in this
// file therefore sets the flag; membership (add vs remove) is driven by properties[computation_key].
const FEATURES = { [FLAGS.ACTIONS_GOOGLE_EC_AUDIENCE_MEMBERSHIP]: true }

const FAILURE_HINT =
  'Ensure GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID, GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET, and ADWORDS_DEVELOPER_TOKEN env vars are set. The customerId must be a valid Google Ads account.'

const fixtures: E2EFixture[] = [
  {
    description: 'JourneysV2 Audience (flag ON): Add a user via journey_step track event (computation_key=true)',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED'
    },
    mode: 'single',
    features: FEATURES,
    event: createE2EJourneysV2AudienceEvent({
      action: 'add',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      journeyName: 'e2e journey v2',
      userId: 'e2e-google-journeysv2-user-001',
      email: 'e2e-google-journeysv2-test-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'JourneysV2 Audience (flag ON): Remove a user via journey_step track event (computation_key=false)',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'single',
    features: FEATURES,
    event: createE2EJourneysV2AudienceEvent({
      action: 'remove',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      journeyName: 'e2e journey v2',
      userId: 'e2e-google-journeysv2-user-002',
      email: 'e2e-google-journeysv2-test-002@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'JourneysV2 Audience (flag ON): Batch add users via journey_step track events',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED'
    },
    mode: 'batchWithMultistatus',
    features: FEATURES,
    events: [
      createE2EJourneysV2AudienceEvent({
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        journeyName: 'e2e journey v2',
        userId: 'e2e-google-journeysv2-user-003',
        email: 'e2e-google-journeysv2-test-003@segment.com'
      }),
      createE2EJourneysV2AudienceEvent({
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        journeyName: 'e2e journey v2',
        userId: 'e2e-google-journeysv2-user-004',
        email: 'e2e-google-journeysv2-test-004@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: '35bb98bd7dc71b074d55d51ffe418d4d4f07728cd82eaa7c890da9fb23eea157' }] } } },
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: 'c159bbc9edbad504b7ca0ffc8232be6a5eca1a2887638a70e436092e040e396e' }] } } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'JourneysV2 Audience (flag ON): Batch remove users via journey_step track events (computation_key=false)',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'batchWithMultistatus',
    features: FEATURES,
    events: [
      createE2EJourneysV2AudienceEvent({
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        journeyName: 'e2e journey v2',
        userId: 'v2m-101',
        email: 'v2m-101@segment.com'
      }),
      createE2EJourneysV2AudienceEvent({
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        journeyName: 'e2e journey v2',
        userId: 'v2m-102',
        email: 'v2m-102@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200, sent: { remove: { userIdentifiers: [{ hashedEmail: 'f086b2c06faa04d027c3bcdc8366893569cfd99bb4a59018edd2dd2a04d801f6' }] } } },
        { status: 200, sent: { remove: { userIdentifiers: [{ hashedEmail: 'e4cabef80ff04f76da89d1d00b4d18d58579a71f3c3fdf139cd6d6583c526de6' }] } } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // 9-event batch (flag ON) interleaving adds, removes and invalid payloads to verify the
    // per-index multi-status mapping stays correct under reordering. Membership comes from
    // properties[computation_key]: add✓, remove✓, add✗, remove✓, remove✗, add✓, add✓, remove✗, remove✓
    description: 'JourneysV2 Audience (flag ON): 9-event mixed batch — interleaved valid/invalid adds and removes keep correct indexes',
    subscribe: 'type = "track"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'batchWithMultistatus',
    features: FEATURES,
    events: [
      createE2EJourneysV2AudienceEvent({ action: 'add', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', journeyName: 'e2e journey v2', userId: 'v2m-0', email: 'v2m-0@segment.com' }),
      createE2EJourneysV2AudienceEvent({ action: 'remove', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', journeyName: 'e2e journey v2', userId: 'v2m-1', email: 'v2m-1@segment.com' }),
      createE2EJourneysV2AudienceEvent({ action: 'add', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', journeyName: 'e2e journey v2', userId: 'v2m-2' }),
      createE2EJourneysV2AudienceEvent({ action: 'remove', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', journeyName: 'e2e journey v2', userId: 'v2m-3', email: 'v2m-3@segment.com' }),
      createE2EJourneysV2AudienceEvent({ action: 'remove', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', journeyName: 'e2e journey v2', userId: 'v2m-4' }),
      createE2EJourneysV2AudienceEvent({ action: 'add', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', journeyName: 'e2e journey v2', userId: 'v2m-5', email: 'v2m-5@segment.com' }),
      createE2EJourneysV2AudienceEvent({ action: 'add', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', journeyName: 'e2e journey v2', userId: 'v2m-6', email: 'v2m-6@segment.com' }),
      createE2EJourneysV2AudienceEvent({ action: 'remove', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', journeyName: 'e2e journey v2', userId: 'v2m-7' }),
      createE2EJourneysV2AudienceEvent({ action: 'remove', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', journeyName: 'e2e journey v2', userId: 'v2m-8', email: 'v2m-8@segment.com' })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: 'd4980da72370143d8d2844ce171c99db1ec59d65f07e7259467df180f5f83f08' }] } } },
        { status: 200, sent: { remove: { userIdentifiers: [{ hashedEmail: 'fdab3a056ca869762be8fcc2bdc885b2f5f274dc125faef0b33c20bb22769a2d' }] } } },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'Missing or Invalid data for CONTACT_INFO.', errorreporter: 'INTEGRATIONS' },
        { status: 200, sent: { remove: { userIdentifiers: [{ hashedEmail: '88dcddb7554e2188369df497d3f6ae5d44a8cc9758c8be12b1584e5364c5216a' }] } } },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'Missing or Invalid data for CONTACT_INFO.', errorreporter: 'INTEGRATIONS' },
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: '9fc62099c40f7faa483cf4bb4af48634846ebf5f7a7da497d114b80c7a8407a7' }] } } },
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: '0e502a442893647887c72ddb2b4d3b2e8f8a2d863ce53dcadbf1e39296e47b83' }] } } },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'Missing or Invalid data for CONTACT_INFO.', errorreporter: 'INTEGRATIONS' },
        { status: 200, sent: { remove: { userIdentifiers: [{ hashedEmail: 'e0508f5db35da171d0df69e4df906c6bf524ab5f044f41ba58e8cb60ffbffb29' }] } } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
