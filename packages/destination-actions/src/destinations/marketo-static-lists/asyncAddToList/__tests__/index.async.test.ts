import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BULK_IMPORT_ENDPOINT } from '../../constants'

const testDestination = createTestIntegration(Destination)

const EXTERNAL_AUDIENCE_ID = '12345'
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
  data: { email: { '@path': '$.context.traits.email' } },
  enable_batching: true,
  batch_size: 300000,
  event_name: { '@path': '$.event' }
}

const makeEvent = (email: string, externalAudienceId: string = EXTERNAL_AUDIENCE_ID) =>
  createTestEvent({
    event: 'Audience Entered',
    type: 'track',
    properties: {},
    context: {
      traits: { email },
      // An empty string signals "no connected list" — falsy, so external_audience_id is omitted.
      personas: externalAudienceId ? { external_audience_id: externalAudienceId } : {}
    }
  })

// The submit endpoint path (query string is matched loosely with a regex below).
const bulkImportBase = API_ENDPOINT + BULK_IMPORT_ENDPOINT.replace('externalId', EXTERNAL_AUDIENCE_ID)

afterEach(() => {
  nock.cleanAll()
})

describe('MarketoStaticLists.asyncAddToList.performBatch', () => {
  it('submits the import and returns the batchId as the jobId', async () => {
    nock(bulkImportBase)
      .post(/.*/)
      .reply(200, { success: true, result: [{ batchId: 3404, importId: '3404', status: 'Queued' }] })

    const response = await testDestination.testAsyncBatchAction('asyncAddToList', {
      events: [makeEvent('a@example.com'), makeEvent('b@example.com')],
      mapping,
      settings
    })

    expect(response.jobId).toBe('3404')
    expect(response.status).toBe(200)
    expect(response.multiStatusResponse.getResponseAtIndex(0).value()).toMatchObject({ status: 200 })
    expect(response.multiStatusResponse.getResponseAtIndex(1).value()).toMatchObject({ status: 200 })
  })

  it('returns a per-index validation error when no list ID is present and sends no request', async () => {
    const scope = nock(bulkImportBase).post(/.*/).reply(200, { success: true })

    const response = await testDestination.testAsyncBatchAction('asyncAddToList', {
      events: [makeEvent('a@example.com', '')],
      mapping,
      settings
    })

    expect(response.jobId).toBeUndefined()
    expect(response.status).toBe(400)
    expect(response.multiStatusResponse.getResponseAtIndex(0).value()).toMatchObject({
      status: 400,
      errormessage: 'No list ID found in payload'
    })
    expect(scope.isDone()).toBe(false)
  })

  it('maps a retryable Marketo error code (1016) to a 500 per-index error but still surfaces the batchId', async () => {
    nock(bulkImportBase)
      .post(/.*/)
      .reply(200, {
        success: false,
        result: [{ batchId: 9001, importId: '9001', status: 'Failed' }],
        errors: [{ code: '1016', message: 'Too many imports' }]
      })

    const response = await testDestination.testAsyncBatchAction('asyncAddToList', {
      events: [makeEvent('a@example.com')],
      mapping,
      settings
    })

    expect(response.jobId).toBe('9001')
    expect(response.multiStatusResponse.getResponseAtIndex(0).value()).toMatchObject({ status: 500 })
  })

  it('maps a non-retryable Marketo error code (1003) to a 400 per-index error', async () => {
    nock(bulkImportBase)
      .post(/.*/)
      .reply(200, {
        success: false,
        errors: [{ code: '1003', message: 'Invalid data' }]
      })

    const response = await testDestination.testAsyncBatchAction('asyncAddToList', {
      events: [makeEvent('a@example.com')],
      mapping,
      settings
    })

    expect(response.multiStatusResponse.getResponseAtIndex(0).value()).toMatchObject({
      status: 400,
      errormessage: 'Invalid data'
    })
  })

  it('surfaces a 401 for an authentication error code (601) so the framework can refresh the token', async () => {
    nock(bulkImportBase)
      .post(/.*/)
      .reply(200, {
        success: false,
        errors: [{ code: '601', message: 'Access token invalid' }]
      })

    const response = await testDestination.testAsyncBatchAction('asyncAddToList', {
      events: [makeEvent('a@example.com')],
      mapping,
      settings
    })

    // parseErrorResponseBatch throws InvalidAuthenticationError; the framework converts it into a
    // batch-level 401 error response.
    expect(response.status).toBe(401)
    expect(response.multiStatusResponse.getResponseAtIndex(0).value()).toMatchObject({ status: 401 })
  })
})

describe('MarketoStaticLists.asyncAddToList.performPoll', () => {
  const BATCH_ID = '3404'
  const statusPath = `/bulk/v1/leads/batch/${BATCH_ID}.json`
  const failuresPath = `/bulk/v1/leads/batch/${BATCH_ID}/failures.json`

  const poll = (uploadCount: number) =>
    testDestination.testAsyncPollAction('asyncAddToList', {
      pollPayload: { jobId: BATCH_ID, uploadCount },
      settings
    })

  // Narrow the optional multiStatusResponse so tests can read per-index values without non-null asserts.
  const valueAt = (response: Awaited<ReturnType<typeof poll>>, i: number) => {
    const ms = response.multiStatusResponse
    if (!ms) throw new Error('expected multiStatusResponse to be defined')
    return ms.getResponseAtIndex(i).value()
  }

  it('returns IN_PROGRESS while the batch is Queued or Importing', async () => {
    nock(API_ENDPOINT)
      .get(statusPath)
      .reply(200, { success: true, result: [{ batchId: 3404, status: 'Queued' }] })

    const response = await poll(3)
    expect(response.jobStatus).toBe('IN_PROGRESS')
  })

  it('returns RETRYABLE_ERROR when the status result is not yet materialized', async () => {
    nock(API_ENDPOINT).get(statusPath).reply(200, { success: true, result: [] })

    const response = await poll(3)
    expect(response.jobStatus).toBe('RETRYABLE_ERROR')
  })

  it('returns FAILED when the batch status is Failed', async () => {
    nock(API_ENDPOINT)
      .get(statusPath)
      .reply(200, { success: true, result: [{ batchId: 3404, status: 'Failed' }] })

    const response = await poll(3)
    expect(response.jobStatus).toBe('FAILED')
  })

  it('reports all rows as success on a clean Complete without fetching failures.json', async () => {
    const statusScope = nock(API_ENDPOINT)
      .get(statusPath)
      .reply(200, {
        success: true,
        result: [
          { batchId: 3404, status: 'Complete', numOfLeadsProcessed: 3, numOfRowsFailed: 0, numOfRowsWithWarning: 0 }
        ]
      })
    const failuresScope = nock(API_ENDPOINT).get(failuresPath).reply(200, 'should-not-be-called')

    const response = await poll(3)

    expect(response.jobStatus).toBe('SUCCEEDED')
    for (let i = 0; i < 3; i++) {
      expect(valueAt(response, i)).toMatchObject({ status: 200 })
    }
    expect(statusScope.isDone()).toBe(true)
    expect(failuresScope.isDone()).toBe(false)
  })

  it('treats warnings as success and does not fetch failures.json', async () => {
    const failuresScope = nock(API_ENDPOINT).get(failuresPath).reply(200, 'should-not-be-called')
    nock(API_ENDPOINT)
      .get(statusPath)
      .reply(200, {
        success: true,
        result: [
          { batchId: 3404, status: 'Complete', numOfLeadsProcessed: 3, numOfRowsFailed: 0, numOfRowsWithWarning: 1 }
        ]
      })

    const response = await poll(3)

    expect(response.jobStatus).toBe('SUCCEEDED')
    for (let i = 0; i < 3; i++) {
      expect(valueAt(response, i)).toMatchObject({ status: 200 })
    }
    expect(failuresScope.isDone()).toBe(false)
  })

  it('reports exact success/failure counts on a partial failure, enriched with the failures.json reason', async () => {
    nock(API_ENDPOINT)
      .get(statusPath)
      .reply(200, {
        success: true,
        result: [
          { batchId: 3404, status: 'Complete', numOfLeadsProcessed: 2, numOfRowsFailed: 1, numOfRowsWithWarning: 0 }
        ]
      })
    nock(API_ENDPOINT)
      .get(failuresPath)
      .reply(200, 'email,ImportFailureReason\nbroken@example.com,Value for field is invalid\n')

    const response = await poll(3)

    expect(response.jobStatus).toBe('SUCCEEDED')
    // 2 successes + 1 failure (counts exact; failed index is approximate -> last index)
    expect(valueAt(response, 0)).toMatchObject({ status: 200 })
    expect(valueAt(response, 1)).toMatchObject({ status: 200 })
    expect(valueAt(response, 2)).toMatchObject({
      status: 400,
      errormessage: 'Marketo bulk import failure(s): Value for field is invalid'
    })
  })

  it('returns FAILED when every row failed', async () => {
    nock(API_ENDPOINT)
      .get(statusPath)
      .reply(200, {
        success: true,
        result: [
          { batchId: 3404, status: 'Complete', numOfLeadsProcessed: 0, numOfRowsFailed: 2, numOfRowsWithWarning: 0 }
        ]
      })
    nock(API_ENDPOINT).get(failuresPath).reply(200, 'email,ImportFailureReason\na@example.com,bad\nb@example.com,bad\n')

    const response = await poll(2)

    expect(response.jobStatus).toBe('FAILED')
    expect(valueAt(response, 0)).toMatchObject({ status: 400 })
    expect(valueAt(response, 1)).toMatchObject({ status: 400 })
  })

  it('falls back to a generic reason when failures.json is unavailable (404)', async () => {
    nock(API_ENDPOINT)
      .get(statusPath)
      .reply(200, {
        success: true,
        result: [
          { batchId: 3404, status: 'Complete', numOfLeadsProcessed: 2, numOfRowsFailed: 1, numOfRowsWithWarning: 0 }
        ]
      })
    nock(API_ENDPOINT).get(failuresPath).reply(404)

    const response = await poll(3)

    expect(response.jobStatus).toBe('SUCCEEDED')
    expect(valueAt(response, 2)).toMatchObject({
      status: 400,
      errormessage: `Row failed during Marketo bulk import (batch ${BATCH_ID})`
    })
  })

  it('returns RETRYABLE_ERROR on a 5xx status response', async () => {
    nock(API_ENDPOINT).get(statusPath).reply(500, {})

    const response = await poll(3)
    expect(response.jobStatus).toBe('RETRYABLE_ERROR')
  })

  it('returns FAILED on a non-retryable HTTP error', async () => {
    nock(API_ENDPOINT).get(statusPath).reply(404, {})

    const response = await poll(3)
    expect(response.jobStatus).toBe('FAILED')
  })
})
