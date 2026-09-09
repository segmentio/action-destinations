import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_URL } from '../../config'
import { NO_LIST_ID_ERROR } from '../functions'

const testDestination = createTestIntegration(Destination)

const settings = { api_key: 'fake-api-key' }
const listId = 'XYZABC'

// A valid Engage-style add/remove event: computation_class/computation_key + a membership
// boolean at properties[computation_key].
function membershipEvent(email: string, membership: boolean) {
  return createTestEvent({
    type: 'track',
    properties: { my_audience: membership, email },
    context: {
      personas: {
        computation_class: 'audience',
        computation_key: 'my_audience'
      }
    }
  })
}

// Has an email (so schema validation passes) but no context.personas at all, and the batch's
// mapping carries no `__segment_internal_sync_mode` => resolveAudienceMembership (core) returns
// undefined for this event. It reaches syncListBatch, which sets its own per-index MultiStatus
// validation error - never sent to the destination API.
function businessInvalidEvent(email: string) {
  return createTestEvent({ type: 'track', properties: { email } })
}

// external_id over the 255-char limit fails AJV schema validation (maxLength) before performBatch
// is ever called - the framework filters it out and records the error at its original index
// itself, without our code ever seeing it.
function schemaInvalidEvent() {
  return createTestEvent({ type: 'track', properties: { external_id: 'a'.repeat(256) } })
}

const interleavedMapping = {
  list_id: listId,
  email: { '@path': '$.properties.email' },
  external_id: { '@path': '$.properties.external_id' }
}

describe('Klaviyo.syncList - batch', () => {
  beforeEach(() => nock.cleanAll())

  it('calls the add API once for an all-add batch and never calls remove', async () => {
    const emails = ['u0@example.com', 'u1@example.com']
    const events = emails.map((email) => membershipEvent(email, true))

    const addScope = nock(API_URL)
      .post('/profile-bulk-import-jobs/', (body) => {
        const profiles = body.data.attributes.profiles.data
        return (
          profiles.length === 2 &&
          profiles[0].attributes.email === emails[0] &&
          profiles[1].attributes.email === emails[1]
        )
      })
      .reply(200, { data: { id: 'job1' } })

    const responses = await testDestination.executeBatch('syncList', {
      events,
      settings,
      mapping: { list_id: listId, email: { '@path': '$.properties.email' } }
    })

    expect(responses).toMatchObject([{ status: 200 }, { status: 200 }])
    expect(addScope.isDone()).toBe(true)
  })

  it('calls the remove API once for an all-remove batch and never calls add', async () => {
    const emails = ['u0@example.com', 'u1@example.com']
    const events = emails.map((email) => membershipEvent(email, false))

    nock(`${API_URL}/profiles`)
      .get(`/?filter=any(email,["${emails.join('","')}"])`)
      .reply(200, { data: [{ id: 'P0' }, { id: 'P1' }] })

    const removeScope = nock(`${API_URL}/lists/${listId}`)
      .delete('/relationships/profiles/', {
        data: [
          { type: 'profile', id: 'P0' },
          { type: 'profile', id: 'P1' }
        ]
      })
      .reply(200, {})

    const responses = await testDestination.executeBatch('syncList', {
      events,
      settings,
      mapping: { list_id: listId, email: { '@path': '$.properties.email' } }
    })

    expect(responses).toMatchObject([{ status: 200 }, { status: 200 }])
    expect(removeScope.isDone()).toBe(true)
  })

  it('preserves original indices across add/remove successes and both kinds of validation failure, interspersed', async () => {
    //   0: add       1: schema-invalid   2: remove   3: business-invalid   4: add
    //   5: remove    6: schema-invalid   7: business-invalid   8: remove   9: add
    const events = [
      membershipEvent('u0@example.com', true), // 0: add
      schemaInvalidEvent(), // 1: schema-invalid (external_id too long)
      membershipEvent('u2@example.com', false), // 2: remove
      businessInvalidEvent('u3@example.com'), // 3: business-invalid
      membershipEvent('u4@example.com', true), // 4: add
      membershipEvent('u5@example.com', false), // 5: remove
      schemaInvalidEvent(), // 6: schema-invalid
      businessInvalidEvent('u7@example.com'), // 7: business-invalid
      membershipEvent('u8@example.com', false), // 8: remove
      membershipEvent('u9@example.com', true) // 9: add
    ]

    // Add bucket (indices 0, 4, 9): single bulk-import-job POST for all three at once.
    const addScope = nock(API_URL)
      .post('/profile-bulk-import-jobs/', (body) => {
        const profiles = body.data.attributes.profiles.data
        const emails = profiles.map((p: { attributes: { email: string } }) => p.attributes.email)
        return (
          emails.length === 3 &&
          emails.includes('u0@example.com') &&
          emails.includes('u4@example.com') &&
          emails.includes('u9@example.com')
        )
      })
      .reply(200, { data: { id: 'job1' } })

    // Remove bucket (indices 2, 5, 8): GET profiles by email, then a single combined DELETE.
    const removeEmails = ['u2@example.com', 'u5@example.com', 'u8@example.com']
    const getProfilesScope = nock(`${API_URL}/profiles`)
      .get(`/?filter=any(email,["${removeEmails.join('","')}"])`)
      .reply(200, {
        // Ids deliberately mirror each user's original batch index, so the correspondence is
        // obvious at a glance.
        data: [{ id: 'P2' }, { id: 'P5' }, { id: 'P8' }]
      })

    const deleteProfilesScope = nock(`${API_URL}/lists/${listId}`)
      .delete('/relationships/profiles/', {
        data: [
          { type: 'profile', id: 'P2' },
          { type: 'profile', id: 'P5' },
          { type: 'profile', id: 'P8' }
        ]
      })
      .reply(200, {})

    const responses = await testDestination.executeBatch('syncList', {
      events,
      settings,
      mapping: interleavedMapping
    })

    expect(responses.length).toBe(10)

    // --- Adds: 0, 4, 9 --- (sent is the constructed Klaviyo profile object: {type, attributes})
    expect(responses[0]).toMatchObject({ status: 200, sent: { attributes: { email: 'u0@example.com' } } })
    expect(responses[4]).toMatchObject({ status: 200, sent: { attributes: { email: 'u4@example.com' } } })
    expect(responses[9]).toMatchObject({ status: 200, sent: { attributes: { email: 'u9@example.com' } } })

    // --- Removes: 2, 5, 8 ---
    expect(responses[2]).toMatchObject({ status: 200 })
    expect(responses[5]).toMatchObject({ status: 200 })
    expect(responses[8]).toMatchObject({ status: 200 })

    // --- Schema-invalid (rejected before performBatch, by the framework itself): 1, 6 ---
    expect(responses[1]).toMatchObject({ status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED' })
    expect(responses[6]).toMatchObject({ status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED' })

    // --- Business-invalid (rejected inside syncListBatch itself): 3, 7 ---
    expect(responses[3]).toMatchObject({
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'Audience Membership must be a boolean'
    })
    expect(responses[7]).toMatchObject({
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'Audience Membership must be a boolean'
    })

    expect(addScope.isDone()).toBe(true)
    expect(getProfilesScope.isDone()).toBe(true)
    expect(deleteProfilesScope.isDone()).toBe(true)
  })

  it('sets a per-index error and skips the destination API call when list_id is missing for one item in an otherwise valid batch', async () => {
    const withListId = (email: string, listIdValue?: string) =>
      createTestEvent({
        type: 'track',
        properties: { my_audience: true, email, list_id: listIdValue },
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } }
      })

    const events = [
      withListId('u0@example.com', listId),
      withListId('u1@example.com', undefined), // missing list_id
      withListId('u2@example.com', listId)
    ]

    const addScope = nock(API_URL)
      .post('/profile-bulk-import-jobs/', (body) => {
        const profiles = body.data.attributes.profiles.data
        const emails = profiles.map((p: { attributes: { email: string } }) => p.attributes.email)
        return emails.length === 2 && emails.includes('u0@example.com') && emails.includes('u2@example.com')
      })
      .reply(200, { data: { id: 'job1' } })

    const responses = await testDestination.executeBatch('syncList', {
      events,
      settings,
      mapping: {
        email: { '@path': '$.properties.email' },
        list_id: { '@path': '$.properties.list_id' }
      }
    })

    expect(responses[0]).toMatchObject({ status: 200 })
    expect(responses[1]).toMatchObject({
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: NO_LIST_ID_ERROR
    })
    expect(responses[2]).toMatchObject({ status: 200 })
    expect(addScope.isDone()).toBe(true)
  })

  it('makes no destination API calls at all when every item in the batch is invalid', async () => {
    const events = [businessInvalidEvent('u0@example.com'), businessInvalidEvent('u1@example.com')]

    const responses = await testDestination.executeBatch('syncList', {
      events,
      settings,
      mapping: { list_id: listId, email: { '@path': '$.properties.email' } }
    })

    expect(responses).toMatchObject([
      { status: 400, errormessage: 'Audience Membership must be a boolean' },
      { status: 400, errormessage: 'Audience Membership must be a boolean' }
    ])
    expect(nock.pendingMocks().length).toBe(0)
  })

  it('sets a per-index error and skips the destination API call when email is invalid for one item in an otherwise valid remove batch', async () => {
    const events = [
      membershipEvent('u0@example.com', false),
      membershipEvent('user@domain.c', false), // fails EMAIL_REGEX (TLD too short)
      membershipEvent('u2@example.com', false)
    ]

    const removeEmails = ['u0@example.com', 'u2@example.com']
    const getProfilesScope = nock(`${API_URL}/profiles`)
      .get(`/?filter=any(email,["${removeEmails.join('","')}"])`)
      .reply(200, { data: [{ id: 'P0' }, { id: 'P2' }] })

    const deleteProfilesScope = nock(`${API_URL}/lists/${listId}`)
      .delete('/relationships/profiles/', {
        data: [
          { type: 'profile', id: 'P0' },
          { type: 'profile', id: 'P2' }
        ]
      })
      .reply(200, {})

    const responses = await testDestination.executeBatch('syncList', {
      events,
      settings,
      mapping: { list_id: listId, email: { '@path': '$.properties.email' } }
    })

    expect(responses[0]).toMatchObject({ status: 200 })
    expect(responses[1]).toMatchObject({
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'Email must be a valid email address.'
    })
    expect(responses[2]).toMatchObject({ status: 200 })
    expect(getProfilesScope.isDone()).toBe(true)
    expect(deleteProfilesScope.isDone()).toBe(true)
  })

  it('applies the hook list id to every payload before bucketing, for both add and remove buckets', async () => {
    const HOOK_LIST_ID = 'HOOK-LIST-ID'
    const events = [membershipEvent('add-user@example.com', true), membershipEvent('remove-user@example.com', false)]

    const addScope = nock(API_URL)
      .post('/profile-bulk-import-jobs/', (body) => body.data.relationships.lists.data[0].id === HOOK_LIST_ID)
      .reply(200, { data: { id: 'job1' } })

    nock(`${API_URL}/profiles`)
      .get(`/?filter=any(email,["remove-user@example.com"])`)
      .reply(200, { data: [{ id: 'P1' }] })

    const removeScope = nock(`${API_URL}/lists/${HOOK_LIST_ID}`)
      .delete('/relationships/profiles/', { data: [{ type: 'profile', id: 'P1' }] })
      .reply(200, {})

    const responses = await testDestination.executeBatch('syncList', {
      events,
      settings,
      mapping: {
        email: { '@path': '$.properties.email' },
        retlOnMappingSave: { outputs: { id: HOOK_LIST_ID, name: 'Hook List' } }
      }
    })

    expect(responses).toMatchObject([{ status: 200 }, { status: 200 }])
    expect(addScope.isDone()).toBe(true)
    expect(removeScope.isDone()).toBe(true)
  })
})
