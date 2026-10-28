import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import nock from 'nock'
import { EventType, submitEventBatchUrl } from '../api'
import destination from '../index'
import { settings } from '../testing'

const testDestination = createTestIntegration(destination)

// A batch of each action, with events that differ by index.
const batches: [string, EventType, (i: number) => SegmentEvent][] = [
  ['submitTrackEvent', 'track', (i) => createTestEvent({ type: 'track', event: `Event ${i}` })],
  [
    'submitIdentifyEvent',
    'identify',
    (i) => createTestEvent({ type: 'identify', traits: { email: `p${i}@example.com` } })
  ],
  ['submitScreenEvent', 'screen', (i) => createTestEvent({ type: 'screen', name: `Screen ${i}` })],
  [
    'submitPageEvent',
    'page',
    (i) => createTestEvent({ type: 'page', context: { page: { url: `https://example.com/${i}` } } })
  ]
]

// Sends a batch of `size` events, which SalesWings answers with `status` and `body`. Returns the events as they were
// sent, and the result of each event that the action reported to Segment.
const sendBatch = async (
  [actionName, eventType, event]: [string, EventType, (i: number) => SegmentEvent],
  size: number,
  status: number,
  body?: object
) => {
  let sent: object[] = []
  nock(submitEventBatchUrl(settings.environment, eventType))
    .post('', (requestBody) => {
      sent = requestBody
      return true
    })
    .reply(status, body)
  const events = Array.from({ length: size }, (_, i) => event(i))
  await testDestination.testBatchAction(actionName, { events, settings, useDefaultMappings: true })
  return { sent, results: testDestination.results[0].multistatus }
}

const accepted = (sent: object) => ({ status: 202, sent, body: 'Accepted' })

const failed = (sent: object, status: number, errortype: string, message: string, index: number) => ({
  status,
  errortype,
  errormessage: message,
  errorreporter: 'DESTINATION',
  sent,
  body: { status, message, index }
})

const batchResponse = (size: number, errorResponses: unknown[]) => ({
  itemsProcessed: size,
  success: size - errorResponses.length,
  error: errorResponses.length,
  errorResponses
})

describe('SalesWings batch results', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  describe.each(batches)('%s', (...batch) => {
    it('reports the events listed by a 207 response as failed, and the others as accepted', async () => {
      const errorResponses = [
        { status: 400, message: 'The event needs a userID, an anonymousID or an email', index: 1 },
        { status: 500, message: 'Cannot queue the event', index: 3 }
      ]
      const { sent, results } = await sendBatch(batch, 4, 207, batchResponse(4, errorResponses))
      expect(sent).toHaveLength(4)
      expect(results).toEqual([
        accepted(sent[0]),
        failed(sent[1], 400, 'BAD_REQUEST', errorResponses[0].message, 1),
        accepted(sent[2]),
        failed(sent[3], 500, 'INTERNAL_SERVER_ERROR', errorResponses[1].message, 3)
      ])
    })
  })

  it('reports every event as accepted for a 207 response without errors', async () => {
    const { sent, results } = await sendBatch(batches[0], 3, 207, batchResponse(3, []))
    expect(results).toEqual(sent.map(accepted))
  })

  it('reports every event as failed for a 207 response that lists all of them', async () => {
    const message = 'Cannot decode the event: DecodingFailure at .kind: Missing required field'
    const errorResponses = [0, 1].map((index) => ({ status: 400, message, index }))
    const { sent, results } = await sendBatch(batches[0], 2, 207, batchResponse(2, errorResponses))
    expect(results).toEqual([
      failed(sent[0], 400, 'BAD_REQUEST', message, 0),
      failed(sent[1], 400, 'BAD_REQUEST', message, 1)
    ])
  })

  it('reports every event as accepted for the 202 response of earlier SalesWings versions', async () => {
    const { sent, results } = await sendBatch(batches[0], 2, 202)
    expect(results).toEqual(sent.map(accepted))
  })

  it('ignores an error list in a response other than 207', async () => {
    const errorResponses = [{ status: 400, message: 'Not a multi-status response', index: 0 }]
    const { sent, results } = await sendBatch(batches[0], 2, 200, batchResponse(2, errorResponses))
    expect(results).toEqual(sent.map(accepted))
  })

  it('fails the whole batch when SalesWings rejects the request', async () => {
    await expect(sendBatch(batches[0], 2, 404, { message: 'Unknown project' })).rejects.toThrow('Not Found')
  })

  describe('with bad data from SalesWings', () => {
    it('reports a failure without a valid error status as 500, which Segment retries', async () => {
      const statuses = [undefined, 0, '400', 200, 600, 400.5]
      const errorResponses = statuses.map((status, index) => ({ status, message: `Failure ${index}`, index }))
      const { sent, results } = await sendBatch(batches[0], 6, 207, batchResponse(6, errorResponses))
      expect(results).toEqual(
        statuses.map((_, index) => failed(sent[index], 500, 'INTERNAL_SERVER_ERROR', `Failure ${index}`, index))
      )
    })

    it('ignores the entries that cannot be matched to an event of the batch', async () => {
      const failure = { status: 400, message: 'Not an event of the batch' }
      const errorResponses = [
        failure,
        { ...failure, index: -1 },
        { ...failure, index: 2 },
        { ...failure, index: '0' },
        { ...failure, index: 0.5 }
      ]
      const { sent, results } = await sendBatch(batches[0], 2, 207, batchResponse(2, errorResponses))
      expect(results).toEqual(sent.map(accepted))
    })

    it('reports a failure without a message with a generic message', async () => {
      const errorResponses = [
        { status: 400, index: 0 },
        { status: 400, message: '', index: 1 }
      ]
      const { sent, results } = await sendBatch(batches[0], 2, 207, batchResponse(2, errorResponses))
      expect(results).toEqual(
        [0, 1].map((index) => failed(sent[index], 400, 'BAD_REQUEST', 'SalesWings did not accept the event', index))
      )
    })

    it('reports one result for an event that is listed twice, from its last entry', async () => {
      const errorResponses = [
        { status: 400, message: 'First failure', index: 0 },
        { status: 500, message: 'Second failure', index: 0 }
      ]
      const { sent, results } = await sendBatch(batches[0], 2, 207, batchResponse(2, errorResponses))
      expect(results).toEqual([failed(sent[0], 500, 'INTERNAL_SERVER_ERROR', 'Second failure', 0), accepted(sent[1])])
    })
  })
})
