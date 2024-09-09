import { Destination, DestinationDefinition } from '../destination-kit'
import type { JSONObject } from '../json-object'
import type { SegmentEvent } from '../segment-event'
import { createTestEvent } from '../create-test-event'

const basicBatch: DestinationDefinition<JSONObject> = {
  name: 'Batching Destination',
  mode: 'cloud',
  actions: {
    testAction: {
      title: 'Test Action',
      description: 'Test Action',
      fields: {
        user_id: {
          type: 'string',
          label: 'User ID',
          description: 'User ID',
          required: true,
          default: {
            '@path': '$.userId'
          }
        },
        session_id: {
          type: 'number',
          label: 'Session ID',
          description: 'Session ID'
        }
      },
      perform: (_request) => {
        return 'success'
      },
      performBatch: (_request) => {
        return 'batch success'
      }
    }
  }
}

const events: SegmentEvent[] = [
  createTestEvent({
    anonymousId: 'anon_123',
    userId: 'user_123',
    timestamp: '2021-07-12T23:02:40.563Z',
    event: 'Test Event',
    integrations: {
      // @ts-ignore the types are wrong
      Test: 1234
    }
  }),
  createTestEvent({
    anonymousId: 'anon_456',
    userId: 'user_456',
    timestamp: '2021-07-12T23:02:41.563Z',
    event: 'Test Event'
  })
]

const basicBatchSettings = {
  subscription: {
    subscribe: 'type = "track"',
    partnerAction: 'testAction',
    mapping: {
      user_id: {
        '@path': '$.userId'
      }
    }
  }
}

describe('Batching', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('basic happy path', async () => {
    const destination = new Destination(basicBatch)
    const res = await destination.onBatch(events, basicBatchSettings)
    expect(res).toEqual([
      {
        multistatus: [
          { body: {}, sent: { user_id: 'user_123' }, status: 200 },
          { body: {}, sent: { user_id: 'user_456' }, status: 200 }
        ]
      }
    ])
  })

  test('transforms all the payloads based on the subscription mapping', async () => {
    const destination = new Destination(basicBatch)
    const spy = jest.spyOn(basicBatch.actions.testAction, 'performBatch')

    await destination.onBatch(events, basicBatchSettings)

    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: expect.arrayContaining([{ user_id: 'user_123' }, { user_id: 'user_456' }])
      })
    )
  })

  test('removes empty values from all the payloads based on the subscription mapping', async () => {
    const destination = new Destination(basicBatch)
    const spy = jest.spyOn(basicBatch.actions.testAction, 'performBatch')

    await destination.onBatch(events, {
      subscription: {
        subscribe: 'type = "track"',
        partnerAction: 'testAction',
        mapping: {
          user_id: {
            '@path': '$.userId'
          },
          session_id: {
            '@path': '$.integrations.Test'
          }
        }
      }
    })

    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: expect.arrayContaining([{ user_id: 'user_123', session_id: 1234 }, { user_id: 'user_456' }])
      })
    )
  })

  test('validates all the payloads, ignores invalid payloads', async () => {
    const destination = new Destination(basicBatch)
    const spy = jest.spyOn(basicBatch.actions.testAction, 'performBatch')

    const invalidEvent = createTestEvent({
      event: 'Test Event',
      type: 'track',
      userId: undefined
    })

    await destination.onBatch([...events, invalidEvent], basicBatchSettings)
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        // excludes the invalid event!
        payload: expect.arrayContaining([{ user_id: 'user_123' }, { user_id: 'user_456' }])
      })
    )
  })

  test('invokes the batch perform function when there is only 1 event', async () => {
    const destination = new Destination(basicBatch)
    const batchSpy = jest.spyOn(basicBatch.actions.testAction, 'performBatch')
    const spy = jest.spyOn(basicBatch.actions.testAction, 'perform')

    // send a single event
    await destination.onBatch([events[0]], basicBatchSettings)

    expect(spy).not.toHaveBeenCalled()
    expect(batchSpy).toHaveBeenCalledTimes(1)
    expect(batchSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: expect.arrayContaining([{ user_id: 'user_123' }])
      })
    )
  })

  test('invokes the batch perform function even when there is only 1 subscribed event', async () => {
    const destination = new Destination(basicBatch)
    const batchSpy = jest.spyOn(basicBatch.actions.testAction, 'performBatch')
    const spy = jest.spyOn(basicBatch.actions.testAction, 'perform')

    const unsubscribedEvent = createTestEvent({
      event: 'Test Event',
      type: 'identify',
      userId: 'nope'
    })

    await destination.onBatch([unsubscribedEvent, events[0]], basicBatchSettings)
    expect(spy).not.toHaveBeenCalled()
    expect(batchSpy).toHaveBeenCalledTimes(1)
    expect(batchSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: expect.not.arrayContaining([{ user_id: 'nope' }])
      })
    )
  })

  test('ensures that only subscribed events get passed on', async () => {
    const destination = new Destination(basicBatch)
    const spy = jest.spyOn(basicBatch.actions.testAction, 'performBatch')

    const unsubscribedEvent = createTestEvent({
      event: 'Test Event',
      type: 'identify',
      userId: 'nope'
    })

    await destination.onBatch([unsubscribedEvent, ...events], basicBatchSettings)

    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: expect.not.arrayContaining([{ user_id: 'nope' }])
      })
    )
  })

  test('doesnt invoke anything if there are no subscribed, valid events', async () => {
    const destination = new Destination(basicBatch)
    const batchSpy = jest.spyOn(basicBatch.actions.testAction, 'performBatch')
    const spy = jest.spyOn(basicBatch.actions.testAction, 'perform')

    const events: SegmentEvent[] = [
      // Unsubscribed event
      createTestEvent({
        event: 'Test Event',
        type: 'identify',
        userId: 'nope'
      }),
      // Invalid event
      createTestEvent({
        event: 'Test Event',
        type: 'track',
        userId: undefined
      })
    ]

    const promise = destination.onBatch(events, basicBatchSettings)
    // The promise resolves because invalid events are ignored by the batch handler until we can get per-item responses hooked up
    await expect(promise).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "multistatus": Array [
                  Object {
                    "errormessage": "Payload is either invalid or does not match the subscription",
                    "errorreporter": "INTEGRATIONS",
                    "errortype": "INVALID_PAYLOAD",
                    "status": 400,
                  },
                  Object {
                    "errormessage": "Invalid payload",
                    "errorreporter": "INTEGRATIONS",
                    "errortype": "INVALID_PAYLOAD",
                    "status": 400,
                  },
                ],
              },
            ]
          `)
    expect(batchSpy).not.toHaveBeenCalled()
    expect(spy).not.toHaveBeenCalled()
  })
})
