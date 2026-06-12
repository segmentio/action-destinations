import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EJourneysV1AudienceEvent, FLAGS } from '@segment/actions-core'
import userList from '../index'

const COMPUTATION_KEY = 'e2e_test_user_list'
const COMPUTATION_ID = 'aud_e2e_google_journeys_001'

const FAILURE_HINT =
  'Ensure GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID, GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET, and ADWORDS_DEVELOPER_TOKEN env vars are set. The customerId must be a valid Google Ads account.'

// Journeys V1 events carry no membership signal (properties[computation_key] is omitted), so the
// user is always added regardless of the audience-membership feature flag. Each scenario below is
// defined once and run twice — once flag-OFF and once flag-ON — asserting the SAME expected output,
// which proves the always-add behaviour is independent of the flag.
const baseFixtures: E2EFixture[] = [
  {
    description: 'JourneysV1 Audience: Add a user to the customer match list via track event',
    subscribe: 'event = "Audience Entered" or event = "Audience Exited"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED'
    },
    mode: 'single',
    event: createE2EJourneysV1AudienceEvent({
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-google-journeys-user-001',
      email: 'e2e-google-journeys-test-001@segment.com'
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'JourneysV1 Audience: Batch add users to the customer match list',
    subscribe: 'event = "Audience Entered" or event = "Audience Exited"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2EJourneysV1AudienceEvent({
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-journeys-user-002',
        email: 'e2e-google-journeys-test-002@segment.com'
      }),
      createE2EJourneysV1AudienceEvent({
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-journeys-user-003',
        email: 'e2e-google-journeys-test-003@segment.com'
      }),
      createE2EJourneysV1AudienceEvent({
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-google-journeys-user-004',
        email: 'e2e-google-journeys-test-004@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: { create: { userIdentifiers: [{ hashedEmail: 'd2307079cffc9d57323b96b8c42ec0a0319761d49246d574d7aaa69977381fba' }] } }
        },
        {
          status: 200,
          sent: { create: { userIdentifiers: [{ hashedEmail: '496b2e198a53783256ff19936a68661751b1f681a3aba56832a7e86ef4c07aa6' }] } }
        },
        {
          status: 200,
          sent: { create: { userIdentifiers: [{ hashedEmail: 'd489341851a7f0e6b6f0f40bbd00435b663e71a45ac2e8daf7ca4f92e81896ef' }] } }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // 9-event batch mixing plain adds, events carrying properties[computation_key]=false, and
    // invalid payloads. Journeys V1 events are ALWAYS named "Audience Entered", and that event name
    // resolves to an add before the membership signal is ever considered — so even an event with
    // properties[computation_key]=false still results in an add (it is NOT a remove). This asserts
    // that holds per-index even with invalid payloads interleaved.
    // Order: add✓, false✓(->add), invalid✗, false✓(->add), invalid✗, add✓, false✓(->add), invalid✗, add✓
    description: 'JourneysV1 Audience: 9-event mixed batch — valid adds, removes and invalid payloads keep correct indexes',
    subscribe: 'event = "Audience Entered" or event = "Audience Exited"',
    mapping: {
      ...defaultValues(userList.fields),
      ad_user_data_consent_state: 'GRANTED',
      ad_personalization_consent_state: 'GRANTED'
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2EJourneysV1AudienceEvent({ computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'v1mix-0', email: 'v1mix-0@segment.com' }),
      createE2EJourneysV1AudienceEvent({ computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'v1mix-1', email: 'v1mix-1@segment.com', enrichedTraits: { [COMPUTATION_KEY]: false } }),
      createE2EJourneysV1AudienceEvent({ computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'v1mix-2' }),
      createE2EJourneysV1AudienceEvent({ computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'v1mix-3', email: 'v1mix-3@segment.com', enrichedTraits: { [COMPUTATION_KEY]: false } }),
      createE2EJourneysV1AudienceEvent({ computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'v1mix-4' }),
      createE2EJourneysV1AudienceEvent({ computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'v1mix-5', email: 'v1mix-5@segment.com' }),
      createE2EJourneysV1AudienceEvent({ computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'v1mix-6', email: 'v1mix-6@segment.com', enrichedTraits: { [COMPUTATION_KEY]: false } }),
      createE2EJourneysV1AudienceEvent({ computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'v1mix-7' }),
      createE2EJourneysV1AudienceEvent({ computationKey: COMPUTATION_KEY, computationId: COMPUTATION_ID, externalAudienceId: '$externalAudienceId', userId: 'v1mix-8', email: 'v1mix-8@segment.com' })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: '7935d2aa67adb77400ca8f5efae91e616caecc50fb55c07763bb9c260ab4e20e' }] } } },
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: '798821d7148dd697bc0894041c00ca159b4e6993ec4a65e8c5d9b7a7c3470d1e' }] } } },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'Missing or Invalid data for CONTACT_INFO.', errorreporter: 'INTEGRATIONS' },
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: '3e6029913d48115d001921aac9cbf002f23daff3c53b7f7aa276132842420c4f' }] } } },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'Missing or Invalid data for CONTACT_INFO.', errorreporter: 'INTEGRATIONS' },
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: '98130000e24927df4230259b474821f269031a019900c76e28558a33cada735b' }] } } },
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: '8d12d0223f5db0f1df2ac0cf8ee2eabd537326e5adb768811b1df8c7621d6a8d' }] } } },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: 'Missing or Invalid data for CONTACT_INFO.', errorreporter: 'INTEGRATIONS' },
        { status: 200, sent: { create: { userIdentifiers: [{ hashedEmail: '6a2893f98f8e53405aaae5952ab71b287cb7e21c39ff98011f5680de0e6b357d' }] } } }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

// Run every scenario twice: flag-OFF and flag-ON. Both assert the SAME expected output, proving the
// always-add behaviour is independent of the audience-membership feature flag.
const fixtures: E2EFixture[] = baseFixtures.flatMap((fixture) => [
  { ...fixture, description: `${fixture.description} (flag OFF)` },
  { ...fixture, description: `${fixture.description} (flag ON)`, features: { [FLAGS.ACTIONS_GOOGLE_EC_AUDIENCE_MEMBERSHIP]: true } }
])

export default fixtures
