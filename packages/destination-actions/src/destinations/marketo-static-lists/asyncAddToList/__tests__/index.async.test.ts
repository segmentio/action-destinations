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
