import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EJourneysV1AudienceEvent, createE2EJourneysV2AudienceEvent } from '@segment/actions-core'
import syncAudiencesToDSP from '../index'
import { FLAG_AUDIENCE_MEMBERSHIP } from '../../utils'

const COMPUTATION_KEY = 'e2e_test_amazon_amc_journeys'
const COMPUTATION_ID = 'aud_e2e_amazon_amc_journeys_001'

const FAILURE_HINT =
  'Needs E2E_AMAZON_AMC_{CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN,ADVERTISER_ID} and ACTIONS_AMAZON_AMC_CLIENT_ID. ' +
  'The refresh token must carry the audiences scope and reach the advertiser.'

const mapping = defaultValues(syncAudiencesToDSP.fields)

// The records endpoint answers 202 with a jobRequestId whichever action was sent, so what these prove
// is the end-to-end flow against Amazon: the event name is not 'Audience Entered' or 'Audience
// Exited', so the add or remove is resolved from the membership boolean.
const flagOn = { [FLAG_AUDIENCE_MEMBERSHIP]: true }

const v2Event = (action: 'add' | 'remove', userId: string) =>
  createE2EJourneysV2AudienceEvent({
    action,
    computationKey: COMPUTATION_KEY,
    computationId: COMPUTATION_ID,
    externalAudienceId: '$externalAudienceId',
    userId,
    email: `${userId}@segment.com`
  })

const fixtures: E2EFixture[] = [
  {
    description: 'Journeys V2: an entering user is added',
    subscribe: 'type = "track"',
    mapping,
    features: flagOn,
    mode: 'single',
    event: v2Event('add', 'e2e-amc-jv2-add-1'),
    expect: { status: 'success', httpStatus: 202 },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Journeys V2: an exiting user is removed',
    subscribe: 'type = "track"',
    mapping,
    features: flagOn,
    mode: 'single',
    event: v2Event('remove', 'e2e-amc-jv2-add-1'),
    expect: { status: 'success', httpStatus: 202 },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Journeys V2: a batch of entering and exiting users',
    subscribe: 'type = "track"',
    mapping,
    features: flagOn,
    mode: 'batch',
    events: [
      v2Event('add', 'e2e-amc-jv2-batch-1'),
      v2Event('remove', 'e2e-amc-jv2-batch-2'),
      v2Event('add', 'e2e-amc-jv2-batch-3')
    ],
    expect: { status: 'success', httpStatus: 202 },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Journeys V1: an Audience Entered event carries no boolean and is added',
    subscribe: 'event = "Audience Entered" or event = "Audience Exited"',
    mapping,
    features: flagOn,
    mode: 'single',
    event: createE2EJourneysV1AudienceEvent({
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId',
      userId: 'e2e-amc-jv1-add-1',
      email: 'e2e-amc-jv1-add-1@segment.com'
    }),
    expect: { status: 'success', httpStatus: 202 },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
