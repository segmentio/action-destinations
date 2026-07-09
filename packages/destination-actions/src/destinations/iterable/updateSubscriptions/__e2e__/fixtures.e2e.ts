import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import updateSubscriptions from '../index'

// subscription_group_id must reference real resources in the e2e Iterable project, so the IDs are
// read from the environment rather than hardcoded. Fixtures are plain modules, so we can read
// process.env directly (the $env marker only resolves inside settings). See ../../__e2e__/index.ts
// for the full list of env vars required to run this destination's e2e tests.
const MESSAGE_CHANNEL_ID = process.env.E2E_ITERABLE_MESSAGE_CHANNEL_ID ?? ''
const MESSAGE_TYPE_ID = process.env.E2E_ITERABLE_MESSAGE_TYPE_ID ?? ''
const EMAIL_LIST_ID = process.env.E2E_ITERABLE_EMAIL_LIST_ID ?? ''

const ID_HINT =
  'Ensure E2E_ITERABLE_MESSAGE_CHANNEL_ID, E2E_ITERABLE_MESSAGE_TYPE_ID and E2E_ITERABLE_EMAIL_LIST_ID are set to ' +
  'real resource IDs in the e2e Iterable project. The channel must be a Marketing channel (opt-out) so subscribe/' +
  'unsubscribe are supported, and the list must be a Static list. ' +
  'NOTE: the /api/subscriptions/{subscriptionGroup}/{subscriptionGroupId}/... endpoints are gated per project and ' +
  'must be enabled by Iterable (contact your CSM). If these fixtures fail with 404 ' +
  '{"code":"NotFound","msg":"Endpoint not found for project: <id>"} while other Iterable endpoints (e.g. GET ' +
  '/api/lists) return 200, the Subscription Preferences API is not yet enabled for the project - this is an ' +
  'environment gate, not a code or ID problem.'

// Reuse the shared e2e users (same as trackEvent fixtures). The Iterable e2e project is Hybrid, so
// both email- and userId-based identification resolve to a real profile.
const TEST_EMAIL = 'e2e-test@segment.com'
const TEST_USER_ID = 'e2e-test-user-001'

const fixtures: E2EFixture[] = [
  {
    // Single subscribe by email -> PATCH /api/subscriptions/messageChannel/{id}/user/{email}.
    description: 'Successfully subscribes a user to a message channel by email',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: {
      ...defaultValues(updateSubscriptions.fields),
      subscriptions: [
        { subscription_group_type: 'messageChannel', subscription_group_id: MESSAGE_CHANNEL_ID, action: 'subscribe' }
      ]
    },
    event: createE2EEvent('track', 'Subscriptions Updated', {
      properties: { email: TEST_EMAIL }
    }),
    expect: {
      status: 'success'
    },
    verboseFailureHint: ID_HINT
  },
  {
    // Single unsubscribe by email -> DELETE /api/subscriptions/messageChannel/{id}/user/{email}.
    description: 'Successfully unsubscribes a user from a message channel by email',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: {
      ...defaultValues(updateSubscriptions.fields),
      subscriptions: [
        { subscription_group_type: 'messageChannel', subscription_group_id: MESSAGE_CHANNEL_ID, action: 'unsubscribe' }
      ]
    },
    event: createE2EEvent('track', 'Subscriptions Updated', {
      properties: { email: TEST_EMAIL }
    }),
    expect: {
      status: 'success'
    },
    verboseFailureHint: ID_HINT
  },
  {
    // Single subscribe by userId only (Hybrid project) -> PATCH .../messageType/{id}/byUserId/{userId}.
    // Exercises the userId identifier branch of resolveIdentifier + getSingleUserEndpoint.
    description: 'Successfully subscribes a user to a message type by userId only',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: (() => {
      const { identifier, ...rest } = defaultValues(updateSubscriptions.fields)
      return {
        ...rest,
        identifier: { userId: { '@path': '$.userId' } },
        user_identifier_preference: 'userId',
        subscriptions: [
          { subscription_group_type: 'messageType', subscription_group_id: MESSAGE_TYPE_ID, action: 'subscribe' }
        ]
      }
    })(),
    event: createE2EEvent('track', 'Subscriptions Updated', {
      userId: TEST_USER_ID,
      properties: {}
    }),
    expect: {
      status: 'success'
    },
    verboseFailureHint:
      'Requires a userId-based or Hybrid Iterable project so the userId resolves to a real profile. ' + ID_HINT
  },
  {
    // Batch subscribe -> one PUT /api/subscriptions/emailList/{id}?action=subscribe with a users[] body.
    // Core fans the single HTTP response out into a per-item multistatus array. Both users share the
    // same subscriptions config (required by the `subscriptions` batch key), so both land in one call.
    description: 'Batch subscribes multiple users to an email list (bulk PUT, per-item multistatus)',
    subscribe: 'type = "track"',
    mode: 'batchWithMultistatus',
    mapping: {
      identifier: { email: { '@path': '$.properties.email' }, userId: { '@path': '$.userId' } },
      user_identifier_preference: 'email',
      subscriptions: [
        { subscription_group_type: 'emailList', subscription_group_id: EMAIL_LIST_ID, action: 'subscribe' }
      ],
      enable_batching: true
    },
    events: [
      createE2EEvent('track', 'Subscriptions Updated', {
        properties: { email: TEST_EMAIL }
      }),
      createE2EEvent('track', 'Subscriptions Updated', {
        properties: { email: 'e2e-test-2@segment.com' }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [{ status: 200 }, { status: 200 }]
    },
    verboseFailureHint: ID_HINT
  },
  {
    // Client-side validation: no email and no userId -> resolveIdentifier throws before any HTTP call.
    description: 'Rejects event when both email and userId are missing',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: {
      ...defaultValues(updateSubscriptions.fields),
      identifier: {},
      subscriptions: [
        { subscription_group_type: 'messageChannel', subscription_group_id: MESSAGE_CHANNEL_ID, action: 'subscribe' }
      ]
    },
    event: createE2EEvent('track', 'Subscriptions Updated', {
      properties: {}
    }),
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError',
      errorMessage: 'Must include email or userId in identifier.'
    }
  },
  {
    // Client-side validation: more than the 6-item maximum -> performUpdateSubscriptions throws
    // before any HTTP call.
    description: 'Rejects event with more than 6 subscription items',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: {
      ...defaultValues(updateSubscriptions.fields),
      subscriptions: Array.from({ length: 7 }, () => ({
        subscription_group_type: 'messageChannel',
        subscription_group_id: MESSAGE_CHANNEL_ID,
        action: 'subscribe'
      }))
    },
    event: createE2EEvent('track', 'Subscriptions Updated', {
      properties: { email: TEST_EMAIL }
    }),
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError',
      errorMessage: 'Maximum of 6 subscription items allowed. Received 7.'
    }
  },
  {
    // Client-side validation: a batch whose payloads carry different subscriptions violates the
    // batching invariant (performBatchUpdateSubscriptions issues one request per subscription using
    // the first payload's config for all users), so it throws before any HTTP call. subscriptions is
    // mapped from event properties so each event can carry its own.
    description: 'Rejects a batch whose payloads have differing subscriptions',
    subscribe: 'type = "track"',
    mode: 'batch',
    mapping: {
      identifier: { email: { '@path': '$.properties.email' }, userId: { '@path': '$.userId' } },
      user_identifier_preference: 'email',
      subscriptions: { '@path': '$.properties.subscriptions' },
      enable_batching: true
    },
    events: [
      createE2EEvent('track', 'Subscriptions Updated', {
        properties: {
          email: TEST_EMAIL,
          subscriptions: [
            {
              subscription_group_type: 'messageChannel',
              subscription_group_id: MESSAGE_CHANNEL_ID,
              action: 'subscribe'
            }
          ]
        }
      }),
      createE2EEvent('track', 'Subscriptions Updated', {
        properties: {
          email: 'e2e-test-2@segment.com',
          subscriptions: [
            { subscription_group_type: 'emailList', subscription_group_id: EMAIL_LIST_ID, action: 'unsubscribe' }
          ]
        }
      })
    ],
    expect: {
      status: 'error',
      errorType: 'PayloadValidationError',
      errorMessage:
        'All events in a batch must share the same subscription preferences. Received a batch with differing subscriptions, which is not supported.'
    }
  },
  {
    // HTTP failure from Iterable: subscribing against a non-existent group ID is rejected by the API.
    // Iterable returns a 4xx for an invalid subscription group. If the live response differs, adjust
    // httpStatus to match what Iterable actually returns.
    description: 'Surfaces an HTTP failure when the subscription group does not exist',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: {
      ...defaultValues(updateSubscriptions.fields),
      subscriptions: [{ subscription_group_type: 'messageChannel', subscription_group_id: '0', action: 'subscribe' }]
    },
    event: createE2EEvent('track', 'Subscriptions Updated', {
      properties: { email: TEST_EMAIL }
    }),
    expect: {
      status: 'failure',
      httpStatus: 400
    },
    verboseFailureHint:
      'Expects Iterable to reject a subscribe to a non-existent group ID (0) with a 4xx. If Iterable ' +
      'returns a different status (or a 200 with a failure body), adjust this fixture accordingly. ' +
      ID_HINT
  }
]

export default fixtures
