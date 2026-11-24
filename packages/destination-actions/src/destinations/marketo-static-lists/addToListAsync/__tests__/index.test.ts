import nock from 'nock'
import { createTestEvent, createTestIntegration, ActionDestinationErrorResponse } from '@segment/actions-core'
import Destination from '../../index'
import { buildCsv } from '../functions'
import { fields } from '../fields'
import { CSV_LIMIT } from '../../constants'

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
  external_id: LIST_ID,
  lookup_field: 'email',
  data: { email: { '@path': '$.context.traits.email' }, firstName: { '@path': '$.properties.firstName' } },
  enable_batching: true,
  event_name: { '@path': '$.event' }
}

const makeEvent = (email: string, firstName?: string) =>
  createTestEvent({
    event: 'Audience Entered',
    type: 'track',
    properties: { firstName },
    context: { traits: { email } }
  })

const importUrl = `/bulk/v1/leads.json?format=csv&listId=${LIST_ID}&lookupField=email`
const statusUrl = (id: string) => `/bulk/v1/leads/batch/${id}.json`

const submit = (events = [makeEvent('a@x.com', 'Ann'), makeEvent('b@x.com', 'Bob')], m: object = mapping) =>
  testDestination.testAsyncBatchAction('addToListAsync', { events, mapping: m, settings })

const poll = (jobId: string, uploadCount: number) =>
  testDestination.testAsyncPollAction('addToListAsync', { pollPayload: { jobId, uploadCount }, settings })

const statusBody = (result: object) => ({ requestId: 'r', success: true, result: [{ batchId: 987, ...result }] })

describe('Marketo Static Lists - Add to List (Async)', () => {
  afterEach(() => nock.cleanAll())

  describe('batching fields', () => {
    it('are hidden from customers', () => {
      expect(fields.batch_size?.unsafe_hidden).toBe(true)
      expect(fields.batch_bytes?.unsafe_hidden).toBe(true)
    })

    it('keep the default and maximum batch bytes below the Marketo CSV limit', () => {
      expect(fields.batch_bytes?.default as number).toBeLessThan(CSV_LIMIT)
      expect(fields.batch_bytes?.maximum as number).toBeLessThan(CSV_LIMIT)
    })

    it('keep each default within its own min/max', () => {
      for (const f of [fields.batch_size, fields.batch_bytes]) {
        expect(f?.default as number).toBeGreaterThanOrEqual(f?.minimum as number)
        expect(f?.default as number).toBeLessThanOrEqual(f?.maximum as number)
      }
    })
  })

  describe('buildCsv', () => {
    it('quotes commas, quotes and newlines (RFC 4180)', () => {
      const { csv } = buildCsv([
        { data: { email: 'a@x.com', note: 'hello, "world"\nbye' } },
        { data: { email: 'b@x.com', note: 'plain' } }
      ] as any)
      expect(csv).toBe('email,note\na@x.com,"hello, ""world""\nbye"\nb@x.com,plain')
    })

    it('keeps 0 and false, and blanks only null/undefined', () => {
      const { rows } = buildCsv([{ data: { a: 0, b: false, c: null, d: undefined } }] as any)
      expect(rows[0]).toBe('0,false,,')
    })

    it('uses the union of keys across payloads', () => {
      const { csv } = buildCsv([{ data: { email: 'a@x.com' } }, { data: { email: 'b@x.com', firstName: 'B' } }] as any)
      expect(csv).toBe('email,firstName\na@x.com,\nb@x.com,B')
    })
  })

  describe('performBatch (submit)', () => {
    it('returns the Marketo batchId as jobId and accepts every row', async () => {
      let uploaded = ''
      nock(API_ENDPOINT)
        .post(importUrl, (body) => {
          uploaded = typeof body === 'string' ? body : JSON.stringify(body)
          return true
        })
        .reply(200, { requestId: 'r', success: true, result: [{ batchId: 987, importId: 'i', status: 'Queued' }] })

      const response = await submit()

      expect(response.jobId).toBe('987')
      expect(response.status).toBe(200)
      expect(response.multiStatusResponse.getAllResponses()).toHaveLength(2)
      expect(response.multiStatusResponse.getAllResponses().every((r) => r.value().status === 200)).toBe(true)
      expect(uploaded).toContain('email,firstName')
      expect(uploaded).toContain('a@x.com,Ann')
    })

    it('fails every row with 400 when there is no list id', async () => {
      const { external_id: _omit, ...noList } = mapping
      const response = await submit(undefined, noList)

      expect(response.jobId).toBeUndefined()
      expect(response.status).toBe(400)
      expect(
        response.multiStatusResponse.getAllResponses().every((r) => r instanceof ActionDestinationErrorResponse)
      ).toBe(true)
    })

    it('rejects an oversize CSV without calling Marketo', async () => {
      const big = 'x'.repeat(10_000_001)
      const response = await submit([makeEvent('a@x.com', big)])

      expect(response.jobId).toBeUndefined()
      expect(response.status).toBe(400)
      expect(response.multiStatusResponse.getResponseAtIndex(0).value().errortype).toBe('PAYLOAD_TOO_LARGE')
    })

    it('maps 1016 (too many imports, HTTP 200) to a retryable 500, not a 200', async () => {
      nock(API_ENDPOINT)
        .post(importUrl)
        .reply(200, { requestId: 'r', success: false, errors: [{ code: '1016', message: 'Too many imports' }] })

      const response = await submit()

      expect(response.jobId).toBeUndefined()
      expect(response.status).toBe(500)
      const first = response.multiStatusResponse.getResponseAtIndex(0).value()
      expect(first.errortype).toBe('RETRYABLE_ERROR')
      expect(first.errormessage).toBe('Too many imports')
    })

    it('maps a known permanent code to 400', async () => {
      nock(API_ENDPOINT)
        .post(importUrl)
        .reply(200, { requestId: 'r', success: false, errors: [{ code: '1006', message: 'Field not found' }] })

      const response = await submit()

      expect(response.status).toBe(400)
      expect(response.multiStatusResponse.getResponseAtIndex(0).value().errortype).toBe('BAD_REQUEST')
    })

    it('treats an unknown code as retryable', async () => {
      nock(API_ENDPOINT)
        .post(importUrl)
        .reply(200, { requestId: 'r', success: false, errors: [{ code: '9999', message: 'New code' }] })

      expect((await submit()).status).toBe(500)
    })

    it('keeps the real HTTP status on a non-Marketo 5xx body', async () => {
      nock(API_ENDPOINT).post(importUrl).reply(503, 'Service Unavailable')

      const response = await submit()

      expect(response.status).toBe(503)
      expect(response.multiStatusResponse.getResponseAtIndex(0).value().errortype).toBe('RETRYABLE_ERROR')
    })

    it('does not claim delivery when Marketo accepts but returns no batchId', async () => {
      nock(API_ENDPOINT).post(importUrl).reply(200, { requestId: 'r', success: true, result: [] })

      const response = await submit()

      expect(response.jobId).toBeUndefined()
      expect(response.status).toBe(500)
    })

    it('surfaces an auth error (601) as a 401', async () => {
      nock(API_ENDPOINT)
        .post(importUrl)
        .reply(200, { requestId: 'r', success: false, errors: [{ code: '601', message: 'Access token invalid' }] })

      const response = await submit()

      expect(response.status).toBe(401)
    })
  })

  describe('performPoll', () => {
    it.each(['Queued', 'Importing'])('returns IN_PROGRESS while %s', async (status) => {
      nock(API_ENDPOINT).get(statusUrl('987')).reply(200, statusBody({ status }))

      const response = await poll('987', 3)

      expect(response.jobStatus).toBe('IN_PROGRESS')
      expect(response.jobId).toBe('987')
      expect(response.multiStatusResponse).toBeUndefined()
    })

    it('SUCCEEDED with every row successful when nothing failed', async () => {
      nock(API_ENDPOINT)
        .get(statusUrl('987'))
        .reply(200, statusBody({ status: 'Complete', numOfLeadsProcessed: 3, numOfRowsFailed: 0 }))

      const response = await poll('987', 3)

      expect(response.jobStatus).toBe('SUCCEEDED')
      const all = response.multiStatusResponse!.getAllResponses()
      expect(all).toHaveLength(3)
      expect(all.every((r) => r.value().status === 200)).toBe(true)
    })

    it('SUCCEEDED with aggregate counts on partial failure', async () => {
      nock(API_ENDPOINT)
        .get(statusUrl('987'))
        .reply(
          200,
          statusBody({
            status: 'Complete',
            numOfLeadsProcessed: 2,
            numOfRowsFailed: 1,
            message: 'Import completed with errors, 2 records imported (2 members), 1 failed'
          })
        )

      const response = await poll('987', 3)

      expect(response.jobStatus).toBe('SUCCEEDED')
      const all = response.multiStatusResponse!.getAllResponses()
      expect(all.filter((r) => r.value().status === 200)).toHaveLength(2)
      const failed = all.filter((r) => r instanceof ActionDestinationErrorResponse)
      expect(failed).toHaveLength(1)
      expect(failed[0].value().errormessage).toContain('1 failed')
    })

    it('FAILED when every row failed', async () => {
      nock(API_ENDPOINT)
        .get(statusUrl('987'))
        .reply(200, statusBody({ status: 'Complete', numOfLeadsProcessed: 0, numOfRowsFailed: 3 }))

      const response = await poll('987', 3)

      expect(response.jobStatus).toBe('FAILED')
      expect(
        response.multiStatusResponse!.getAllResponses().every((r) => r instanceof ActionDestinationErrorResponse)
      ).toBe(true)
    })

    it('FAILED (terminal) when Marketo reports the job Failed', async () => {
      nock(API_ENDPOINT)
        .get(statusUrl('987'))
        .reply(200, statusBody({ status: 'Failed', message: 'Invalid header' }))

      const response = await poll('987', 2)

      expect(response.jobStatus).toBe('FAILED')
      expect(response.multiStatusResponse!.getResponseAtIndex(0).value().errormessage).toBe('Invalid header')
    })

    it('RETRYABLE_ERROR when success:true but no job record yet', async () => {
      nock(API_ENDPOINT).get(statusUrl('987')).reply(200, { requestId: 'r', success: true, result: [] })

      expect((await poll('987', 1)).jobStatus).toBe('RETRYABLE_ERROR')
    })

    it('RETRYABLE_ERROR for an unrecognized status instead of guessing terminal', async () => {
      nock(API_ENDPOINT)
        .get(statusUrl('987'))
        .reply(200, statusBody({ status: 'Weird' }))

      expect((await poll('987', 1)).jobStatus).toBe('RETRYABLE_ERROR')
    })

    it('classifies success:false bodies by Marketo code (HTTP 200)', async () => {
      nock(API_ENDPOINT)
        .get(statusUrl('1'))
        .reply(200, { requestId: 'r', success: false, errors: [{ code: '1016', message: 'busy' }] })
      nock(API_ENDPOINT)
        .get(statusUrl('2'))
        .reply(200, { requestId: 'r', success: false, errors: [{ code: '1013', message: 'Object not found' }] })

      expect((await poll('1', 1)).jobStatus).toBe('RETRYABLE_ERROR')
      expect((await poll('2', 1)).jobStatus).toBe('FAILED')
    })

    it.each([
      [429, 'RETRYABLE_ERROR'],
      [500, 'RETRYABLE_ERROR'],
      [404, 'FAILED']
    ])('HTTP %i -> %s', async (httpStatus, expected) => {
      nock(API_ENDPOINT).get(statusUrl('987')).reply(httpStatus, {})

      const response = await poll('987', 1)

      expect(response.jobStatus).toBe(expected)
      expect(response.status).toBe(httpStatus)
    })

    it('RETRYABLE_ERROR on a transient network failure', async () => {
      nock(API_ENDPOINT).get(statusUrl('987')).replyWithError({ code: 'ECONNRESET', message: 'reset' })

      const response = await poll('987', 1)

      expect(response.jobStatus).toBe('RETRYABLE_ERROR')
      expect(response.status).toBe(500)
    })

    it('rethrows an auth error (601) so the token can be refreshed', async () => {
      nock(API_ENDPOINT)
        .get(statusUrl('987'))
        .reply(200, { requestId: 'r', success: false, errors: [{ code: '602', message: 'Access token expired' }] })

      await expect(poll('987', 1)).rejects.toThrow('Access token expired')
    })
  })
})
