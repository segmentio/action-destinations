import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BULK_IMPORT_ENDPOINT, GET_LEADS_ENDPOINT, REMOVE_USERS_ENDPOINT } from '../../constants'

const testDestination = createTestIntegration(Destination)

const LIST_ID = '12345'
const API_ENDPOINT = 'https://123-ABC-456.mktorest.com'
const settings = {
  client_id: '1234',
  client_secret: '1234',
  api_endpoint: API_ENDPOINT,
  folder_name: 'Test Folder'
}

const mapping = {
  external_id: { '@path': '$.context.personas.external_audience_id' },
  lookup_field: 'email',
  data: {
    email: {
      '@if': {
        exists: { '@path': '$.context.traits.email' },
        then: { '@path': '$.context.traits.email' },
        else: { '@path': '$.properties.email' }
      }
    }
  },
  field_value: {
    '@if': {
      exists: { '@path': '$.context.traits.email' },
      then: { '@path': '$.context.traits.email' },
      else: { '@path': '$.properties.email' }
    }
  },
  enable_batching: true,
  batch_size: 300,
  event_name: { '@path': '$.event' }
}

// A valid Engage-style add/remove event: computation_class/computation_key + a membership
// boolean at properties[computation_key], plus an email so field_value/data.email resolve.
function membershipEvent(email: string, membership: boolean) {
  return createTestEvent({
    event: 'Test Event',
    type: 'track',
    properties: {
      my_audience: membership,
      email
    },
    context: {
      traits: { email },
      personas: {
        computation_class: 'audience',
        computation_key: 'my_audience',
        external_audience_id: LIST_ID
      }
    }
  })
}

// No email anywhere => field_value's default (`@if exists traits.email then ... else properties.email`)
// resolves to undefined, and field_value is `required: true` => AJV schema validation fails on this
// event BEFORE performBatch is ever called. The framework filters it out and records the error at its
// original index itself.
function schemaInvalidEvent() {
  return createTestEvent({
    event: 'Test Event',
    type: 'track',
    properties: {}
  })
}

// Has an email (so schema validation passes) but no context.personas at all, and the batch's mapping
// carries no `__segment_internal_sync_mode` => resolveAudienceMembership (core) returns undefined for
// this event. It reaches syncListBatch, which sets its own per-index MultiStatus validation error.
function businessInvalidEvent(email: string) {
  return createTestEvent({
    event: 'Test Event',
    type: 'track',
    properties: { email },
    context: { traits: { email } }
  })
}

describe('MarketoStaticLists.syncList - mixed batch MultiStatus correctness', () => {
  beforeEach(() => nock.cleanAll())

  it('preserves original indices across add/remove successes and both kinds of validation failure, interspersed', async () => {
    // 10 events, interleaved so no two adjacent events are the same kind - this is deliberately
    // NOT grouped by type, to prove index-preservation isn't an artifact of contiguous blocks.
    //   0: add       1: schema-invalid   2: remove   3: business-invalid   4: add
    //   5: remove    6: schema-invalid   7: business-invalid   8: remove   9: add
    const events = [
      membershipEvent('u0@example.com', true), // 0: add
      schemaInvalidEvent(), // 1: schema-invalid
      membershipEvent('u2@example.com', false), // 2: remove
      businessInvalidEvent('u3@example.com'), // 3: business-invalid
      membershipEvent('u4@example.com', true), // 4: add
      membershipEvent('u5@example.com', false), // 5: remove
      schemaInvalidEvent(), // 6: schema-invalid
      businessInvalidEvent('u7@example.com'), // 7: business-invalid
      membershipEvent('u8@example.com', false), // 8: remove
      membershipEvent('u9@example.com', true) // 9: add
    ]

    // Add bucket (indices 0, 4, 9): single bulk-CSV import POST for all three at once.
    const addScope = nock(API_ENDPOINT)
      .post(BULK_IMPORT_ENDPOINT.replace('externalId', LIST_ID).replace('fieldToLookup', 'email'))
      .reply(200, { success: true })

    // Remove bucket (indices 2, 5, 8): GET leads by email, then DELETE by the returned lead ids.
    // extractFilterData joins field_value in payload order, which follows the original relative
    // order of the remove events in the batch: index 2, then 5, then 8.
    const filterValues = encodeURIComponent('u2@example.com,u5@example.com,u8@example.com')
    const getLeadsScope = nock(API_ENDPOINT)
      .get(GET_LEADS_ENDPOINT.replace('field', 'email').replace('emailsToFilter', filterValues))
      .reply(200, {
        success: true,
        // Ids deliberately mirror each user's original batch index, so the expected `sent` value
        // below (`id=2`, `id=5`, `id=8`) makes the index correspondence obvious at a glance.
        result: [{ id: 2 }, { id: 5 }, { id: 8 }]
      })

    const deleteLeadsScope = nock(API_ENDPOINT)
      .delete(REMOVE_USERS_ENDPOINT.replace('listId', LIST_ID).replace('idsToDelete', '2,5,8'))
      .reply(200, { success: true })

    const responses = await testDestination.executeBatch('syncList', {
      events,
      settings,
      mapping
    })

    expect(responses.length).toBe(10)

    // --- Adds: 0, 4, 9 ---
    expect(responses[0]).toMatchObject({ status: 200, sent: 'u0@example.com', body: { success: true } })
    expect(responses[4]).toMatchObject({ status: 200, sent: 'u4@example.com', body: { success: true } })
    expect(responses[9]).toMatchObject({ status: 200, sent: 'u9@example.com', body: { success: true } })

    // --- Removes: 2, 5, 8 ---
    expect(responses[2]).toMatchObject({ status: 200, sent: 'id=2', body: { success: true } })
    expect(responses[5]).toMatchObject({ status: 200, sent: 'id=5', body: { success: true } })
    expect(responses[8]).toMatchObject({ status: 200, sent: 'id=8', body: { success: true } })

    // --- Schema-invalid (rejected before performBatch, by the framework itself): 1, 6 ---
    expect(responses[1]).toMatchObject({ status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errorreporter: 'INTEGRATIONS' })
    expect(responses[6]).toMatchObject({ status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errorreporter: 'INTEGRATIONS' })
    expect(responses[1].errormessage).toBe("The root value is missing the required field 'field_value'.")
    expect(responses[6].errormessage).toBe("The root value is missing the required field 'field_value'.")

    // --- Business-invalid (rejected inside syncListBatch itself): 3, 7 ---
    expect(responses[3]).toMatchObject({
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errorreporter: 'INTEGRATIONS',
      errormessage: 'Audience Membership must be a boolean'
    })
    expect(responses[7]).toMatchObject({
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errorreporter: 'INTEGRATIONS',
      errormessage: 'Audience Membership must be a boolean'
    })

    expect(addScope.isDone()).toBe(true)
    expect(getLeadsScope.isDone()).toBe(true)
    expect(deleteLeadsScope.isDone()).toBe(true)
  })
})
