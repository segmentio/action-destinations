import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import trackEvent from '../index'
import { FLAGS } from '../../common/utils'

// The Mixpanel Import Events API (/import) is exercised by trackEvent. It authenticates with the
// API Secret when the project-token-auth flag is OFF and with the Project Token when it is ON.
// Every fixture below is therefore defined once and run twice — flag OFF and flag ON — asserting
// the SAME expected output. That proves switching credentials via the flag does not change
// behaviour (both credentials must be valid for the project).
//
// `mixpanel-multistatus` must be enabled for onBatch() to return a per-item MultiStatus array, so
// the batch fixtures set it on both variants. For batch fixtures we assert the full per-item
// MultiStatus response: each item's `status`, `body`, and the transformed `sent` payload (the exact
// Mixpanel event the action built). On success Mixpanel's import API returns body "OK".
//
// NOTE ON FAILURE TYPES (per request):
//   - "Type 1" = a payload that fails Segment schema validation BEFORE performBatch is called
//     (here: a track event with no `event` name). It never reaches our code; it is reported at its
//     original batch index with errortype PAYLOAD_VALIDATION_FAILED / errorreporter INTEGRATIONS.
//   - "Type 2" = a payload that fails validation INSIDE performBatch. trackEvent's performBatch does
//     NOT run any per-item code validation, so a true Type-2 failure cannot be manufactured for this
//     action. The realistic post-dispatch per-item failure is a SERVER-SIDE rejection by Mixpanel
//     strict mode (failed_records), surfaced with errorreporter DESTINATION. A FUTURE timestamp
//     triggers it ("'properties.time' is invalid: must not be in the future"); note that a far-PAST
//     timestamp is NOT rejected by Mixpanel, so the future timestamp is the reliable trigger.
//
// FIELD COVERAGE: the "all fields" fixture below populates every input field of the action so each
// one is exercised in at least one successful single request. It asserts success only; per-field
// `sent` assertions live in the batch/multistatus fixtures, which expose the transformed payload.

const MULTISTATUS = 'mixpanel-multistatus'

// Emit a flag-OFF and a flag-ON variant of a fixture, merging the project-token-auth flag into any
// features the fixture already declares.
function withAuthFlagVariants(fixture: E2EFixture): E2EFixture[] {
  const off: E2EFixture = {
    ...fixture,
    description: `${fixture.description} (project-token-auth OFF)`
  }
  const on: E2EFixture = {
    ...fixture,
    description: `${fixture.description} (project-token-auth ON)`,
    features: { ...(fixture.features ?? {}), [FLAGS.PROJECT_TOKEN_AUTH]: true }
  }
  return [off, on]
}

// A fully-populated event exercising every input field of the trackEvent action.
const ALL_FIELDS_EVENT = {
  type: 'track' as const,
  event: 'E2E All Fields Event',
  // messageId/timestamp are dynamic ($guid/$now) like a real event.
  messageId: '$guid',
  timestamp: '$now',
  userId: 'e2e-user-allfields-001',
  anonymousId: 'e2e-anon-allfields-001',
  properties: {
    customStringProp: 'customValue',
    customNumberProp: 42
  },
  context: {
    groupId: 'e2e-group-001',
    ip: '203.0.113.5',
    locale: 'en-US',
    timezone: 'America/New_York',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    app: { name: 'E2E App', namespace: 'com.e2e.app', build: '42', version: '1.2.3', platform: 'iOS' },
    os: { name: 'iOS', version: '17.2' },
    device: {
      id: 'e2e-dev-001',
      type: 'ios',
      name: 'iPhone',
      manufacturer: 'Apple',
      model: 'iPhone15,2',
      advertisingId: 'e2e-adid-001',
      adTrackingEnabled: true,
      idfa: 'e2e-idfa-001'
    },
    network: { bluetooth: false, carrier: 'Verizon', cellular: true, wifi: true },
    location: { country: 'US', region: 'NY' },
    library: { name: 'analytics.js', version: '2.0.0' },
    page: { url: 'https://example.com/pricing', referrer: 'https://google.com' },
    screen: { width: 1920, height: 1080, density: 2 },
    campaign: { source: 'newsletter', medium: 'email', name: 'spring-sale', term: 'discount', content: 'top-banner' },
    userAgentData: {
      mobile: true,
      platform: 'macOS',
      architecture: 'arm',
      bitness: '64',
      model: 'MacBookPro',
      platformVersion: '14.2',
      uaFullVersion: '120.0.6099.109',
      wow64: false
    }
  }
}

const baseFixtures: E2EFixture[] = [
  {
    description: 'Successfully tracks a single event',
    subscribe: 'type = "track"',
    mapping: defaultValues(trackEvent.fields),
    mode: 'single',
    event: createE2EEvent('track', 'E2E Button Clicked', {
      userId: 'e2e-test-user-mixpanel-track-001',
      properties: {
        buttonId: 'cta-signup',
        page: '/pricing'
      }
    }),
    expect: {
      status: 'success'
    }
  },
  {
    // Field coverage: every input field is populated so each is exercised in a successful request.
    description: 'Successfully tracks an event exercising all fields',
    subscribe: 'type = "track"',
    mapping: defaultValues(trackEvent.fields),
    mode: 'single',
    event: ALL_FIELDS_EVENT,
    expect: {
      status: 'success'
    }
  },
  {
    description: 'Successfully tracks a batch of events',
    subscribe: 'type = "track"',
    mapping: defaultValues(trackEvent.fields),
    mode: 'batchWithMultistatus',
    features: { [MULTISTATUS]: true },
    events: [
      createE2EEvent('track', 'E2E Batch Event A', {
        userId: 'e2e-test-user-mixpanel-track-batch-001',
        properties: { plan: 'pro' }
      }),
      createE2EEvent('track', 'E2E Batch Event B', {
        userId: 'e2e-test-user-mixpanel-track-batch-002',
        properties: { plan: 'free' }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          body: 'OK',
          sent: {
            event: 'E2E Batch Event A',
            properties: {
              distinct_id: 'e2e-test-user-mixpanel-track-batch-001',
              $user_id: 'e2e-test-user-mixpanel-track-batch-001',
              $source: 'segment',
              plan: 'pro'
            }
          }
        },
        {
          status: 200,
          body: 'OK',
          sent: {
            event: 'E2E Batch Event B',
            properties: {
              distinct_id: 'e2e-test-user-mixpanel-track-batch-002',
              $user_id: 'e2e-test-user-mixpanel-track-batch-002',
              $source: 'segment',
              plan: 'free'
            }
          }
        }
      ]
    }
  },
  {
    // Type 1 only: a pre-performBatch validation failure (missing `event`) alongside successes.
    description: 'Batch with a pre-performBatch validation failure (missing event) and successes',
    subscribe: 'type = "track"',
    mapping: defaultValues(trackEvent.fields),
    mode: 'batchWithMultistatus',
    features: { [MULTISTATUS]: true },
    events: [
      createE2EEvent('track', 'E2E Valid Event 1', {
        userId: 'e2e-test-user-mixpanel-track-mix-001',
        properties: { ok: true }
      }),
      // No event name -> required field `event` is missing -> fails schema validation before
      // performBatch is reached.
      createE2EEvent('track', undefined, {
        userId: 'e2e-test-user-mixpanel-track-mix-002',
        properties: { ok: false }
      }),
      createE2EEvent('track', 'E2E Valid Event 3', {
        userId: 'e2e-test-user-mixpanel-track-mix-003',
        properties: { ok: true }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          body: 'OK',
          sent: {
            event: 'E2E Valid Event 1',
            properties: {
              distinct_id: 'e2e-test-user-mixpanel-track-mix-001',
              ok: true
            }
          }
        },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errorreporter: 'INTEGRATIONS' },
        {
          status: 200,
          body: 'OK',
          sent: {
            event: 'E2E Valid Event 3',
            properties: {
              distinct_id: 'e2e-test-user-mixpanel-track-mix-003',
              ok: true
            }
          }
        }
      ]
    }
  },
  {
    // Comprehensive mixed batch satisfying requirement 2a: at least one pre-performBatch failure,
    // at least one event that fails AFTER dispatch (Mixpanel strict-mode server-side rejection),
    // and at least one event successfully delivered to Mixpanel.
    description: 'Mixed batch: pre-validation failure + server-side reject + success',
    subscribe: 'type = "track"',
    mapping: defaultValues(trackEvent.fields),
    mode: 'batchWithMultistatus',
    features: { [MULTISTATUS]: true },
    events: [
      // [0] valid -> delivered to Mixpanel
      createE2EEvent('track', 'E2E Mixed Valid', {
        userId: 'e2e-test-user-mixpanel-track-srv-001',
        properties: { ok: true }
      }),
      // [1] missing event name -> Type 1, fails before performBatch (INTEGRATIONS)
      createE2EEvent('track', undefined, {
        userId: 'e2e-test-user-mixpanel-track-srv-002'
      }),
      // [2] valid schema but a fixed FUTURE timestamp (year 2100) -> Mixpanel strict mode rejects
      //     it server-side into failed_records, surfaced with errorreporter DESTINATION. This
      //     timestamp is the deliberately-invalid value under test, so it is intentionally fixed
      //     (not $now). messageId stays dynamic.
      {
        ...createE2EEvent('track', 'E2E Mixed Future', {
          userId: 'e2e-test-user-mixpanel-track-srv-003',
          properties: { ok: true }
        }),
        timestamp: '2100-01-01T00:00:00.000Z'
      }
    ],
    verboseFailureHint:
      'Index 2 expects a Mixpanel strict-mode server-side rejection (errorreporter DESTINATION) for the future (year-2100) timestamp ("must not be in the future").',
    expect: {
      status: 'success',
      jsonContains: [
        {
          // When ANY record in the batch fails strict mode, Mixpanel returns a top-level
          // code 400 / status "Bad Request", and the action stamps that status onto the
          // surviving success items' body (so it is "Bad Request" here, not "OK").
          status: 200,
          body: 'Bad Request',
          sent: {
            event: 'E2E Mixed Valid',
            properties: {
              distinct_id: 'e2e-test-user-mixpanel-track-srv-001',
              ok: true
            }
          }
        },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errorreporter: 'INTEGRATIONS' },
        {
          status: 400,
          errortype: 'BAD_REQUEST',
          errorreporter: 'DESTINATION',
          errormessage: "'properties.time' is invalid: must not be in the future",
          sent: {
            event: 'E2E Mixed Future',
            properties: {
              time: 4102444800000,
              distinct_id: 'e2e-test-user-mixpanel-track-srv-003'
            }
          },
          body: {
            field: 'properties.time',
            message: "'properties.time' is invalid: must not be in the future"
          }
        }
      ]
    }
  }
]

const fixtures: E2EFixture[] = baseFixtures.flatMap(withAuthFlagVariants)

export default fixtures
