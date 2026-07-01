import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import { randomUUID } from 'crypto'
import updateUser from '../index'

// Emails are generated once per process so the full create-then-rename path is
// exercised with fresh identifiers on every run, while staying stable across the
// runner's retries within a single run. The $guid runner marker can't be used
// here because it only substitutes a string that is *entirely* '$guid' — it does
// not interpolate inside an email string.
const singleEmailFrom = `e2e-email-change-from-${randomUUID()}@segment.com`
const singleEmailTo = `e2e-email-change-to-${randomUUID()}@segment.com`

const singleUserId = `e2e-userid-change-${randomUUID()}`
const singleUserIdEmailTo = `e2e-userid-change-to-${randomUUID()}@segment.com`

const batchUserId1 = `e2e-batch-user-1-${randomUUID()}`
const batchUserId2 = `e2e-batch-user-2-${randomUUID()}`
const batchEmail1From = `e2e-batch-1-from-${randomUUID()}@segment.com`
const batchEmail1To = `e2e-batch-1-to-${randomUUID()}@segment.com`
const batchEmail2From = `e2e-batch-2-from-${randomUUID()}@segment.com`
const batchEmail2To = `e2e-batch-2-to-${randomUUID()}@segment.com`

const fixtures: E2EFixture[] = [
  {
    description: 'Successfully upserts a user with email and data fields',
    subscribe: 'type = "identify"',
    mapping: defaultValues(updateUser.fields),
    mode: 'single',
    event: createE2EEvent('identify', undefined, {
      userId: 'e2e-test-user-001',
      traits: {
        email: 'e2e-test@segment.com',
        firstName: 'E2E',
        lastName: 'TestUser',
        plan: 'premium'
      }
    }),
    expect: {
      status: 'success'
    }
  },
  {
    // perform() upserts the user via /api/users/update (keyed by the current
    // email), then issues a second /api/users/updateEmail call to re-key them to
    // newEmail. perform() returns the second response, so the assertion below
    // verifies the updateEmail call succeeded.
    description: 'Changes a user email address when identified by email (update + updateEmail)',
    subscribe: 'type = "identify"',
    mapping: {
      ...defaultValues(updateUser.fields),
      newEmail: { '@path': '$.traits.newEmail' }
    },
    mode: 'single',
    event: createE2EEvent('identify', undefined, {
      traits: {
        email: singleEmailFrom,
        newEmail: singleEmailTo,
        firstName: 'E2E',
        lastName: 'EmailChange'
      }
    }),
    expect: {
      status: 'success',
      jsonContains: { code: 'Success' }
    },
    verboseFailureHint:
      'Asserts the second /api/users/updateEmail call. On reruns Iterable may merge profiles if the target email already exists; it still returns code "Success".'
  },
  {
    // No email on the event — the user is identified by userId, so perform()
    // upserts via /api/users/update (keyed by userId) and then issues
    // /api/users/updateEmail with currentUserId (the currentUserId branch).
    // perform() returns the updateEmail response, so the assertion verifies it.
    //
    // This requires an Iterable project with userId-based (or Hybrid)
    // identification: in such a project /api/users/update creates the userId-keyed
    // user, so the follow-up updateEmail call can find it. (In an email-only
    // project this path returns 400 UnknownUserIdError.)
    description: 'Changes a user email address when identified by userId only (currentUserId branch)',
    subscribe: 'type = "identify"',
    mapping: (() => {
      const { email, ...rest } = defaultValues(updateUser.fields)
      return {
        ...rest,
        newEmail: { '@path': '$.traits.newEmail' }
      }
    })(),
    mode: 'single',
    event: createE2EEvent('identify', undefined, {
      userId: singleUserId,
      traits: {
        newEmail: singleUserIdEmailTo,
        firstName: 'E2E',
        lastName: 'UserIdEmailChange'
      }
    }),
    expect: {
      status: 'success',
      jsonContains: { code: 'Success' }
    },
    verboseFailureHint:
      'Exercises the currentUserId branch of perform(). Requires a userId-based or Hybrid Iterable project; in an email-only project this returns 400 UnknownUserIdError.'
  },
  {
    // Batch mode: performBatch folds newEmail into each user's dataFields.email
    // and issues a single /api/users/bulkUpdate call. Core fans the single
    // response out into a per-item multistatus array of { status, body, sent }.
    //
    // 'sent' is the mapped *action payload* (pre-transform), so it carries the
    // top-level newEmail field — it does NOT reflect the dataFields.email folding
    // that performBatch does afterwards. 'body' is the shared bulkUpdate response;
    // successCount === number of events proves Iterable accepted the writes.
    //
    // dataFields is mapped from an explicit object (not raw $.traits) so the
    // helper newEmail trait is not dumped into Iterable as a junk custom field.
    description: 'Batch updates users carrying newEmail (bulkUpdate, per-item multistatus)',
    subscribe: 'type = "identify"',
    mapping: {
      email: { '@path': '$.traits.email' },
      userId: { '@path': '$.userId' },
      newEmail: { '@path': '$.traits.newEmail' },
      dataFields: { firstName: { '@path': '$.traits.firstName' } },
      enable_batching: true
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2EEvent('identify', undefined, {
        userId: batchUserId1,
        traits: {
          email: batchEmail1From,
          newEmail: batchEmail1To,
          firstName: 'BatchOne'
        }
      }),
      createE2EEvent('identify', undefined, {
        userId: batchUserId2,
        traits: {
          email: batchEmail2From,
          newEmail: batchEmail2To,
          firstName: 'BatchTwo'
        }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          body: { successCount: 2, failCount: 0 },
          sent: {
            email: batchEmail1From,
            userId: batchUserId1,
            newEmail: batchEmail1To
          }
        },
        {
          status: 200,
          body: { successCount: 2, failCount: 0 },
          sent: {
            email: batchEmail2From,
            userId: batchUserId2,
            newEmail: batchEmail2To
          }
        }
      ]
    },
    verboseFailureHint:
      'Asserts the per-item multistatus from the single /api/users/bulkUpdate call. Each item\'s "sent" payload carries the top-level newEmail; "body.successCount" should equal the number of events.'
  }
]

export default fixtures
