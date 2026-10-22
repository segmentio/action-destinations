import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import CustomerIO from '../index'
import { Settings } from '../generated-types'
import { getDefaultMappings } from '../test-helper'
import { AccountRegion, sendBatch } from '../utils'

const testDestination = createTestIntegration(CustomerIO)
const trackService = nock('https://track.customer.io/api/v2')

const settings: Settings = {
  siteId: '12345',
  apiKey: 'abcde',
  accountRegion: AccountRegion.US
}

const timestamp = '2023-01-01T00:00:00.000Z'

const trackEvents = () =>
  ['user-0', 'user-1', 'user-2'].map((userId, index) =>
    createTestEvent({
      type: 'track',
      event: `Event ${index}`,
      userId,
      anonymousId: undefined,
      timestamp,
      properties: { index }
    })
  )

const executeTrackEventBatch = () =>
  testDestination.executeBatch('trackEvent', {
    events: trackEvents(),
    settings,
    mapping: getDefaultMappings('trackEvent')
  })

describe('CustomerIO batch multi-status handling', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('marks every entry as successful on a 200 response', async () => {
    trackService.post('/batch').reply(200, {})

    const response = await executeTrackEventBatch()

    expect(response).toHaveLength(3)
    response.forEach((entry, index) => {
      expect(entry).toMatchObject({
        status: 200,
        body: 'success',
        sent: {
          type: 'person',
          action: 'event',
          name: `Event ${index}`,
          identifiers: { id: `user-${index}` }
        }
      })
    })
  })

  it('marks only the entries named by batch_index as failed on a 207 response', async () => {
    trackService.post('/batch').reply(207, {
      errors: [
        {
          batch_index: 2,
          reason: 'invalid',
          field: 'identifiers',
          message: 'identifiers must not be empty'
        }
      ]
    })

    const response = await executeTrackEventBatch()

    expect(response).toHaveLength(3)
    expect(response[0]).toMatchObject({ status: 200, body: 'success', sent: { name: 'Event 0' } })
    expect(response[1]).toMatchObject({ status: 200, body: 'success', sent: { name: 'Event 1' } })
    expect(response[2]).toMatchObject({
      status: 400,
      errortype: 'BAD_REQUEST',
      errormessage: 'invalid - field: identifiers - identifiers must not be empty',
      errorreporter: 'DESTINATION',
      sent: { name: 'Event 2', identifiers: { id: 'user-2' } }
    })
  })

  it('combines multiple 207 errors for the same entry', async () => {
    trackService.post('/batch').reply(207, {
      errors: [
        { batch_index: 1, reason: 'invalid', field: 'name', message: 'name is required' },
        { batch_index: 1, reason: 'invalid', field: 'timestamp', message: 'timestamp is too old' }
      ]
    })

    const response = await executeTrackEventBatch()

    expect(response[0]).toMatchObject({ status: 200 })
    expect(response[1]).toMatchObject({
      status: 400,
      errormessage: 'invalid - field: name - name is required; invalid - field: timestamp - timestamp is too old',
      sent: { name: 'Event 1' }
    })
    expect(response[2]).toMatchObject({ status: 200 })
  })

  it('fails every entry without its own error when a 207 carries an error that cannot be tied to an entry', async () => {
    trackService.post('/batch').reply(207, {
      errors: [
        { batch_index: 1, reason: 'invalid', field: 'name', message: 'name is required' },
        { batch_index: 7, reason: 'invalid', message: 'not in this batch' },
        { reason: 'invalid', message: 'no index at all' }
      ]
    })

    const response = await executeTrackEventBatch()

    expect(response[0]).toMatchObject({
      status: 400,
      errortype: 'BAD_REQUEST',
      errormessage: 'invalid - not in this batch; invalid - no index at all',
      sent: { name: 'Event 0' }
    })
    expect(response[1]).toMatchObject({
      status: 400,
      errormessage: 'invalid - field: name - name is required',
      sent: { name: 'Event 1' }
    })
    expect(response[2]).toMatchObject({
      status: 400,
      errormessage: 'invalid - not in this batch; invalid - no index at all',
      sent: { name: 'Event 2' }
    })
  })

  it('maps batch_index errors to their entries on a 400 response and fails the rest with the response status', async () => {
    trackService.post('/batch').reply(400, {
      errors: [{ batch_index: 1, reason: 'invalid', field: 'type', message: 'unknown type' }]
    })

    const response = await executeTrackEventBatch()

    expect(response).toHaveLength(3)
    expect(response[1]).toMatchObject({
      status: 400,
      errortype: 'BAD_REQUEST',
      errormessage: 'invalid - field: type - unknown type',
      errorreporter: 'DESTINATION',
      sent: { name: 'Event 1' }
    })
    for (const index of [0, 2]) {
      expect(response[index]).toMatchObject({
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'Bad Request',
        errorreporter: 'DESTINATION',
        sent: { name: `Event ${index}` }
      })
    }
  })

  it('fails every entry with the request-level error on a 400 response without batch_index', async () => {
    trackService.post('/batch').reply(400, {
      errors: [{ reason: 'invalid', field: 'batch', message: 'batch is too large' }]
    })

    const response = await executeTrackEventBatch()

    expect(response).toHaveLength(3)
    response.forEach((entry, index) => {
      expect(entry).toMatchObject({
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'invalid - field: batch - batch is too large',
        sent: { name: `Event ${index}` }
      })
    })
  })

  it('lets 5xx errors bubble up so the whole batch is retried', async () => {
    trackService.post('/batch').reply(503, { errors: [{ batch_index: 0, message: 'unavailable' }] })

    await expect(executeTrackEventBatch()).rejects.toThrow('Service Unavailable')
  })

  it('lets a 500 with an errors array bubble up so the whole batch is retried', async () => {
    trackService.post('/batch').reply(500, { errors: [{ batch_index: 0, message: 'internal error' }] })

    await expect(executeTrackEventBatch()).rejects.toThrow('Internal Server Error')
  })

  it('propagates a non-400 4xx status to every entry when the body has batch_index errors', async () => {
    trackService.post('/batch').reply(422, {
      errors: [{ batch_index: 2, reason: 'invalid', field: 'timestamp', message: 'timestamp is in the future' }]
    })

    const response = await executeTrackEventBatch()

    expect(response).toHaveLength(3)
    expect(response[2]).toMatchObject({
      status: 422,
      errormessage: 'invalid - field: timestamp - timestamp is in the future',
      sent: { name: 'Event 2' }
    })
    for (const index of [0, 1]) {
      expect(response[index]).toMatchObject({ status: 422, errormessage: 'Unprocessable Entity' })
    }
  })

  it('lets 429 errors bubble up for a whole-batch retry even when the body has an errors array', async () => {
    trackService.post('/batch').reply(429, { errors: [{ batch_index: 0, message: 'rate limited' }] })

    await expect(executeTrackEventBatch()).rejects.toThrow('Too Many Requests')
  })

  it('lets 4xx errors without an errors array bubble up unchanged', async () => {
    trackService.post('/batch').reply(401, { meta: { error: 'Unauthorized request' } })

    await expect(executeTrackEventBatch()).rejects.toThrow('Unauthorized')
  })

  it('lets 4xx errors with an empty errors array bubble up unchanged', async () => {
    trackService.post('/batch').reply(400, { errors: [] })

    await expect(executeTrackEventBatch()).rejects.toThrow('Bad Request')
  })

  it('handles a 400 thrown as an HTTPError from another copy of actions-core (local dev server)', async () => {
    const error = Object.assign(new Error('Bad Request'), {
      name: 'HTTPError',
      response: { status: 400, data: { errors: [{ batch_index: 0, message: 'no identifiers' }] } }
    })
    const request = jest.fn().mockRejectedValue(error)

    const response = await sendBatch(request, [
      { action: 'event', type: 'person', settings, payload: { person_id: 'user-0', name: 'Event 0' } }
    ])

    expect(response.getAllResponses()).toHaveLength(1)
    expect(response.getResponseAtIndex(0).value()).toMatchObject({ status: 400, errormessage: 'no identifiers' })
  })

  it('keeps createUpdateObject entries in their original order across identify actions', async () => {
    trackService.post('/batch').reply(207, { errors: [{ batch_index: 1, message: 'bad object' }] })

    const events = [
      createTestEvent({ type: 'group', groupId: 'object-0', userId: 'user-0', timestamp }),
      createTestEvent({ type: 'group', groupId: 'object-1', userId: undefined, anonymousId: 'anon-1', timestamp }),
      createTestEvent({ type: 'group', groupId: 'object-2', userId: 'user-2', timestamp })
    ]

    const response = await testDestination.executeBatch('createUpdateObject', {
      events,
      settings,
      mapping: getDefaultMappings('createUpdateObject')
    })

    expect(response).toHaveLength(3)
    expect(response[0]).toMatchObject({
      status: 200,
      sent: { action: 'identify', identifiers: { object_id: 'object-0' } }
    })
    expect(response[1]).toMatchObject({
      status: 400,
      errormessage: 'bad object',
      sent: { action: 'identify_anonymous', identifiers: { object_id: 'object-1' } }
    })
    expect(response[2]).toMatchObject({
      status: 200,
      sent: { action: 'identify', identifiers: { object_id: 'object-2' } }
    })
  })
})
