import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2ERetlAudienceEvent, FLAGS } from '@segment/actions-core'
import userList from '../index'

const COMPUTATION_KEY = 'e2e_test_user_list'
const COMPUTATION_ID = 'aud_e2e_google_retl_001'

const FAILURE_HINT = 'Ensure GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID, GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET, and ADWORDS_DEVELOPER_TOKEN env vars are set. The customerId must be a valid Google Ads account.'

// RETL add/remove is driven by the RETL event name (new/updated -> add, deleted -> remove) and is
// independent of the audience-membership feature flag. Each scenario below is defined once and run
// twice — once flag-OFF and once flag-ON — asserting the SAME expected output, which proves the
// flag does not change RETL behaviour.
const baseFixtures: E2EFixture[] = [
  {
    description: 'RETL Audience: syncMode=add adds users from a batch of "new" events',
    subscribe: 'event = "new"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'add'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-001',
        email: 'e2e-google-retl-001@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-002',
        email: 'e2e-google-retl-002@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: { create: { userIdentifiers: [{ hashedEmail: 'da38a4fe5619680740b842adecb9ea5120150e4f6ce0c0d0aa7a0ca91c364630' }] } }
        },
        {
          status: 200,
          sent: { create: { userIdentifiers: [{ hashedEmail: '5cd717f1a25782ca98b12590144f4c8583a4b810401b328a52fbf4a231c4e6f8' }] } }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL Audience: syncMode=delete removes users from a batch of "deleted" events',
    subscribe: 'event = "deleted"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'delete'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-003',
        email: 'e2e-google-retl-003@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-004',
        email: 'e2e-google-retl-004@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: { remove: { userIdentifiers: [{ hashedEmail: '4e98dfa8c84b29862aa03b0d110b00b7d905c7b9f7c294f68c0e88ee3f29f518' }] } }
        },
        {
          status: 200,
          sent: { remove: { userIdentifiers: [{ hashedEmail: 'b33339bcc552b3d387990463eb7c58a3133112a98ad2e013efd1a796dc7d9644' }] } }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL Audience: syncMode=mirror adds users from a batch of "new" events',
    subscribe: 'event = "new"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-005',
        email: 'e2e-google-retl-005@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'new',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-006',
        email: 'e2e-google-retl-006@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: { create: { userIdentifiers: [{ hashedEmail: '7ce632dee60b40e07cd7ec6208b86b87315b055e0392e56bba58804ef2754a61' }] } }
        },
        {
          status: 200,
          sent: { create: { userIdentifiers: [{ hashedEmail: '3bef4fd9f1da3b027692be905e7a2da5ca5ec118d467d6ff36a16fd8f30a9833' }] } }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'RETL Audience: syncMode=mirror removes users from a batch of "deleted" events',
    subscribe: 'event = "deleted"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-007',
        email: 'e2e-google-retl-007@segment.com'
      }),
      createE2ERetlAudienceEvent({
        eventName: 'deleted',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-retl-user-008',
        email: 'e2e-google-retl-008@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: { remove: { userIdentifiers: [{ hashedEmail: '7ae9a9b8012d258e594599ab711287b4b692bec6277697a5a3db3e3fcd31e12c' }] } }
        },
        {
          status: 200,
          sent: { remove: { userIdentifiers: [{ hashedEmail: '30bd445519516df10e927cd05196d1667aa0bfdb8ea8d6e5741ed75d884176f5' }] } }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // Single-event (perform) path: a one-row "new" sync adds the user. Single mode returns a raw
    // HTTP response (no multistatus), so we assert overall success rather than a per-item operation.
    description: 'RETL Audience: single "new" event adds the user',
    subscribe: 'event = "new"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'single',
    event: createE2ERetlAudienceEvent({
      eventName: 'new',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-google-retl-single-new',
      email: 'e2e-google-retl-single-new@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // Single-event (perform) path: a one-row "deleted" sync removes the user.
    description: 'RETL Audience: single "deleted" event removes the user',
    subscribe: 'event = "deleted"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'single',
    event: createE2ERetlAudienceEvent({
      eventName: 'deleted',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-google-retl-single-del',
      email: 'e2e-google-retl-single-del@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // 9-event batch with new/updated (add) and deleted (remove) interleaved with invalid payloads,
    // to verify the per-index multi-status mapping stays correct under reordering.
    // Order: new✓, deleted✓, new✗, deleted✓, deleted✗, new✓, updated✓, deleted✗, new✓
    description: 'RETL Audience: 9-event mixed batch — interleaved valid/invalid adds and removes keep correct indexes',
    subscribe: 'event = "new" or event = "updated" or event = "deleted"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED',
      __segment_internal_sync_mode: 'mirror'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2ERetlAudienceEvent({ eventName: 'new', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'retl-0', email: 'retl-0@segment.com' }),
      createE2ERetlAudienceEvent({ eventName: 'deleted', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'retl-1', email: 'retl-1@segment.com' }),
      createE2ERetlAudienceEvent({ eventName: 'new', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'retl-2' }),
      createE2ERetlAudienceEvent({ eventName: 'deleted', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'retl-3', email: 'retl-3@segment.com' }),
      createE2ERetlAudienceEvent({ eventName: 'deleted', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'retl-4' }),
      createE2ERetlAudienceEvent({ eventName: 'new', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'retl-5', email: 'retl-5@segment.com' }),
      createE2ERetlAudienceEvent({ eventName: 'updated', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'retl-6', email: 'retl-6@segment.com' }),
      createE2ERetlAudienceEvent({ eventName: 'deleted', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'retl-7' }),
      createE2ERetlAudienceEvent({ eventName: 'new', computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'retl-8', email: 'retl-8@segment.com' })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: '4e3e610050ba6c757dc7e5c6f33fcfe8a5f8fd7cb659f02b093eae9f063f8ec7' }] } } },
        { status: 200, sent: { remove: { userIdentifiers: [{ hashedEmail: 'f29a347244339c963fef80a1d46649aa4c895f8949e8124850156c37656e3c81' }] } } },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'Missing or Invalid data for CONTACT_INFO.', errorreporter: 'INTEGRATIONS' },
        { status: 200, sent: { remove: { userIdentifiers: [{ hashedEmail: 'a68c164db3eb71b91b3df945bcdb17617a9acfa6b1c2775abdde85551d1f88ff' }] } } },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'Missing or Invalid data for CONTACT_INFO.', errorreporter: 'INTEGRATIONS' },
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: '4821ab0741dfb49b33153bfe57c22a4829de7a3374d24556501975a3932b7a9a' }] } } },
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: '7170e91c6bc5b00770bbb8c2c4461cc64279b15e86f938b8576cb81c01e8fce2' }] } } },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'Missing or Invalid data for CONTACT_INFO.', errorreporter: 'INTEGRATIONS' },
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: 'e605cb0d45cd796cb1fba41d3782ac1fb0e85c1843cda22c6478617fbb6c2204' }] } } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

// Run every scenario twice: flag-OFF and flag-ON. Both assert the SAME expected output, proving RETL
// behaviour is independent of the audience-membership feature flag.
const fixtures: E2EFixture[] = baseFixtures.flatMap((fixture) => [
  { ...fixture, description: `${fixture.description} (flag OFF)` },
  { ...fixture, description: `${fixture.description} (flag ON)`, features: { [FLAGS.ACTIONS_GOOGLE_EC_AUDIENCE_MEMBERSHIP]: true } }
])

export default fixtures
