import { Destination, DestinationDefinition } from '../destination-kit'
import type { JSONObject } from '../json-object'
import type { SegmentEvent } from '../segment-event'
import { createTestEvent } from '../create-test-event'
import {
  MultiStatusResponse,
  ActionDestinationSuccessResponse,
  ActionDestinationErrorResponse,
  AsyncActionDefinition,
  AsyncBatchResponse,
  PollPayload,
  PollResponse
} from '../destination-kit/action'
import { ErrorCodes, IntegrationError, RetryableError, InvalidAuthenticationError } from '../errors'
import { HTTPError } from '../request-client'
import { Response, Request } from '../fetch'

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

  test('validates all the payloads, skips and reports invalid payloads', async () => {
    const destination = new Destination(basicBatch)
    const spy = jest.spyOn(basicBatch.actions.testAction, 'performBatch')

    const invalidEvent = createTestEvent({
      event: 'Test Event',
      type: 'track',
      userId: undefined
    })

    const response = await destination.onBatch([...events, invalidEvent], basicBatchSettings)
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        // excludes the invalid event!
        payload: expect.arrayContaining([{ user_id: 'user_123' }, { user_id: 'user_456' }])
      })
    )

    expect(response).toMatchInlineSnapshot(`
      Array [
        Object {
          "multistatus": Array [
            Object {
              "body": Object {},
              "sent": Object {
                "user_id": "user_123",
              },
              "status": 200,
            },
            Object {
              "body": Object {},
              "sent": Object {
                "user_id": "user_456",
              },
              "status": 200,
            },
            Object {
              "errormessage": "The root value is missing the required field 'user_id'.",
              "errorreporter": "INTEGRATIONS",
              "errortype": "PAYLOAD_VALIDATION_FAILED",
              "status": 400,
            },
          ],
        },
      ]
    `)
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

  test('ensures that only subscribed events get passed on and filtered events gets reported', async () => {
    const destination = new Destination(basicBatch)
    const spy = jest.spyOn(basicBatch.actions.testAction, 'performBatch')

    const unsubscribedEvent = createTestEvent({
      event: 'Test Event',
      type: 'identify',
      userId: 'nope'
    })

    const response = await destination.onBatch([unsubscribedEvent, ...events], basicBatchSettings)

    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: expect.not.arrayContaining([{ user_id: 'nope' }])
      })
    )

    expect(response).toMatchInlineSnapshot(`
      Array [
        Object {
          "multistatus": Array [
            Object {
              "errormessage": "Payload is either invalid or does not match the subscription",
              "errorreporter": "INTEGRATIONS",
              "errortype": "PAYLOAD_VALIDATION_FAILED",
              "status": 400,
            },
            Object {
              "body": Object {},
              "sent": Object {
                "user_id": "user_123",
              },
              "status": 200,
            },
            Object {
              "body": Object {},
              "sent": Object {
                "user_id": "user_456",
              },
              "status": 200,
            },
          ],
        },
      ]
    `)
  })

  test('doesnt invoke anything if there are no subscribed or valid events', async () => {
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
                    "errortype": "PAYLOAD_VALIDATION_FAILED",
                    "status": 400,
                  },
                  Object {
                    "errormessage": "The root value is missing the required field 'user_id'.",
                    "errorreporter": "INTEGRATIONS",
                    "errortype": "PAYLOAD_VALIDATION_FAILED",
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

describe('MultiStatus', () => {
  it('all methods should work as expected', () => {
    const multiStatusResponse = new MultiStatusResponse()

    // 0. Push success as object
    multiStatusResponse.pushSuccessResponse({
      body: { ok: true },
      sent: { user_id: 'user001' },
      status: 200
    })

    // 1. Push success with ActionDestinationSuccessResponse
    multiStatusResponse.pushSuccessResponse(
      new ActionDestinationSuccessResponse({
        body: { ok: true },
        sent: { user_id: 'user002' },
        status: 200
      })
    )

    // 2. Push error as object
    multiStatusResponse.pushErrorResponse({
      body: { ok: true },
      sent: { user_id: 'user003' },
      status: 400,
      errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
      errormessage: 'Payload is either invalid or missing required fields'
    })

    // 3. Push error with ActionDestinationErrorResponse
    multiStatusResponse.pushErrorResponse(
      new ActionDestinationErrorResponse({
        body: { ok: true },
        sent: { user_id: 'user004' },
        status: 400,
        errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
        errormessage: 'Payload is either invalid or missing required fields'
      })
    )

    // 4. Push a generic response, determined by class
    multiStatusResponse.pushResponseObject(
      new ActionDestinationSuccessResponse({
        body: { ok: true },
        sent: { info: 'THIS_WILL_BE_DELETED_LATER' },
        status: 200
      })
    )

    // 5. Push a generic response at index, determined by class
    multiStatusResponse.pushResponseObjectAtIndex(
      5,
      new ActionDestinationErrorResponse({
        body: { ok: true },
        sent: { info: 'THIS_WILL_BE_DELETED_LATER' },
        status: 400,
        errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
        errormessage: 'Payload is either invalid or missing required fields'
      })
    )

    // 6. Set success at index
    multiStatusResponse.setSuccessResponseAtIndex(6, {
      body: { ok: true },
      sent: { user_id: 'user005' },
      status: 200
    })

    // 7. Set error at index
    multiStatusResponse.setErrorResponseAtIndex(7, {
      body: { ok: true },
      sent: { user_id: 'user004' },
      status: 400,
      errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
      errormessage: 'Payload is either invalid or missing required fields'
    })

    expect(multiStatusResponse.getResponseAtIndex(4)).toMatchInlineSnapshot(`
      ActionDestinationSuccessResponse {
        "data": Object {
          "body": Object {
            "ok": true,
          },
          "sent": Object {
            "info": "THIS_WILL_BE_DELETED_LATER",
          },
          "status": 200,
        },
      }
    `)

    expect(multiStatusResponse.getResponseAtIndex(5)).toMatchInlineSnapshot(`
      ActionDestinationErrorResponse {
        "data": Object {
          "body": Object {
            "ok": true,
          },
          "errormessage": "Payload is either invalid or missing required fields",
          "errortype": "PAYLOAD_VALIDATION_FAILED",
          "sent": Object {
            "info": "THIS_WILL_BE_DELETED_LATER",
          },
          "status": 400,
        },
      }
    `)

    expect(multiStatusResponse.length()).toBe(8)

    // Unset the responses at index 4 and 5
    multiStatusResponse.unsetResponseAtIndex(4)
    multiStatusResponse.unsetResponseAtIndex(5)

    // Push an error response without error type, should be inferred from the status code
    multiStatusResponse.pushErrorResponse({
      status: 404,
      errormessage: "The requested resource couldn't be found"
    })

    expect(multiStatusResponse.getAllResponses()).toMatchInlineSnapshot(`
      Array [
        ActionDestinationSuccessResponse {
          "data": Object {
            "body": Object {
              "ok": true,
            },
            "sent": Object {
              "user_id": "user001",
            },
            "status": 200,
          },
        },
        ActionDestinationSuccessResponse {
          "data": Object {
            "body": Object {
              "ok": true,
            },
            "sent": Object {
              "user_id": "user002",
            },
            "status": 200,
          },
        },
        ActionDestinationErrorResponse {
          "data": Object {
            "body": Object {
              "ok": true,
            },
            "errormessage": "Payload is either invalid or missing required fields",
            "errortype": "PAYLOAD_VALIDATION_FAILED",
            "sent": Object {
              "user_id": "user003",
            },
            "status": 400,
          },
        },
        ActionDestinationErrorResponse {
          "data": Object {
            "body": Object {
              "ok": true,
            },
            "errormessage": "Payload is either invalid or missing required fields",
            "errortype": "PAYLOAD_VALIDATION_FAILED",
            "sent": Object {
              "user_id": "user004",
            },
            "status": 400,
          },
        },
        ,
        ,
        ActionDestinationSuccessResponse {
          "data": Object {
            "body": Object {
              "ok": true,
            },
            "sent": Object {
              "user_id": "user005",
            },
            "status": 200,
          },
        },
        ActionDestinationErrorResponse {
          "data": Object {
            "body": Object {
              "ok": true,
            },
            "errormessage": "Payload is either invalid or missing required fields",
            "errortype": "PAYLOAD_VALIDATION_FAILED",
            "sent": Object {
              "user_id": "user004",
            },
            "status": 400,
          },
        },
        ActionDestinationErrorResponse {
          "data": Object {
            "errormessage": "The requested resource couldn't be found",
            "errortype": "NOT_FOUND",
            "status": 404,
          },
        },
      ]
    `)

    expect(multiStatusResponse.isSuccessResponseAtIndex(1)).toBe(true)
    expect(multiStatusResponse.isErrorResponseAtIndex(1)).toBe(false)
    expect(multiStatusResponse.isSuccessResponseAtIndex(2)).toBe(false)
    expect(multiStatusResponse.isErrorResponseAtIndex(2)).toBe(true)

    // successCount and errorCount reflect the current state, ignoring unset (sparse) slots
    // Successes: indices 0, 1, 6 = 3; Errors: indices 2, 3, 7, 8 = 4
    expect(multiStatusResponse.successCount).toBe(3)
    expect(multiStatusResponse.errorCount).toBe(4)
  })
})

describe('Async Batching', () => {
  const mockPerformBatch = jest.fn()
  const mockPerformPoll = jest.fn()

  const asyncActionDefinition: AsyncActionDefinition<JSONObject, { user_id: string; session_id?: number }> = {
    title: 'Async Test Action',
    description: 'Async Test Action',
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
    performBatch: mockPerformBatch,
    performPoll: mockPerformPoll
  }

  const asyncBatchDestination: DestinationDefinition<JSONObject> = {
    name: 'Async Batching Destination',
    mode: 'cloud',
    actions: {},
    asyncActions: {
      asyncTestAction: asyncActionDefinition
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('basic async batch happy path', async () => {
    const multiStatusResponse = new MultiStatusResponse()
    multiStatusResponse.pushSuccessResponse({ status: 200, body: {}, sent: { user_id: 'user_123' } })
    multiStatusResponse.pushSuccessResponse({ status: 200, body: {}, sent: { user_id: 'user_456' } })

    mockPerformBatch.mockResolvedValue({
      jobId: 'async-job-123',
      status: 200,
      multiStatusResponse
    } as AsyncBatchResponse)

    const destination = new Destination(asyncBatchDestination)
    const result = await destination.executeAsyncBatch('asyncTestAction', {
      events,
      mapping: { user_id: { '@path': '$.userId' } },
      settings: {}
    })

    expect(result.jobId).toBe('async-job-123')
    expect(result.multiStatusResponse.getResponseAtIndex(0).value()).toEqual({
      body: {},
      sent: { user_id: 'user_123' },
      status: 200
    })
    expect(result.multiStatusResponse.getResponseAtIndex(1).value()).toEqual({
      body: {},
      sent: { user_id: 'user_456' },
      status: 200
    })
  })

  test('transforms all the payloads based on the mapping', async () => {
    const multiStatusResponse = new MultiStatusResponse()
    multiStatusResponse.pushSuccessResponse({ status: 200, body: {}, sent: {} })
    multiStatusResponse.pushSuccessResponse({ status: 200, body: {}, sent: {} })

    mockPerformBatch.mockResolvedValue({
      jobId: 'async-job-456',
      status: 200,
      multiStatusResponse
    } as AsyncBatchResponse)

    const destination = new Destination(asyncBatchDestination)
    await destination.executeAsyncBatch('asyncTestAction', {
      events,
      mapping: { user_id: { '@path': '$.userId' } },
      settings: {}
    })

    expect(mockPerformBatch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: expect.arrayContaining([{ user_id: 'user_123' }, { user_id: 'user_456' }])
      })
    )
  })

  test('validates all the payloads, skips and reports invalid payloads', async () => {
    const multiStatusResponse = new MultiStatusResponse()
    multiStatusResponse.pushSuccessResponse({ status: 200, body: {}, sent: { user_id: 'user_123' } })
    multiStatusResponse.pushSuccessResponse({ status: 200, body: {}, sent: { user_id: 'user_456' } })

    mockPerformBatch.mockResolvedValue({
      jobId: 'async-job-789',
      status: 200,
      multiStatusResponse
    } as AsyncBatchResponse)

    const destination = new Destination(asyncBatchDestination)

    const invalidEvent = createTestEvent({
      event: 'Test Event',
      type: 'track',
      userId: undefined
    })

    const result = await destination.executeAsyncBatch('asyncTestAction', {
      events: [...events, invalidEvent],
      mapping: { user_id: { '@path': '$.userId' } },
      settings: {}
    })

    expect(mockPerformBatch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        // excludes the invalid event!
        payload: expect.arrayContaining([{ user_id: 'user_123' }, { user_id: 'user_456' }])
      })
    )

    expect(result.jobId).toBe('async-job-789')
    expect(result.multiStatusResponse.length()).toBe(3)
    expect(result.multiStatusResponse.getResponseAtIndex(0).value().status).toBe(200)
    expect(result.multiStatusResponse.getResponseAtIndex(1).value().status).toBe(200)
    expect(result.multiStatusResponse.getResponseAtIndex(2).value().status).toBe(400)
    const errResponse2 = result.multiStatusResponse.getResponseAtIndex(2)
    expect(errResponse2 instanceof ActionDestinationErrorResponse && errResponse2.value().errortype).toBe(
      ErrorCodes.PAYLOAD_VALIDATION_FAILED
    )
  })

  test('does not invoke performBatch if there are no valid events', async () => {
    const destination = new Destination(asyncBatchDestination)

    const invalidEvents: SegmentEvent[] = [
      createTestEvent({
        event: 'Test Event',
        type: 'track',
        userId: undefined
      }),
      createTestEvent({
        event: 'Test Event 2',
        type: 'track',
        userId: undefined
      })
    ]

    const result = await destination.executeAsyncBatch('asyncTestAction', {
      events: invalidEvents,
      mapping: { user_id: { '@path': '$.userId' } },
      settings: {}
    })

    expect(mockPerformBatch).not.toHaveBeenCalled()
    expect(result.jobId).toBeUndefined()
    expect(result.multiStatusResponse.length()).toBe(2)
    expect(result.multiStatusResponse.getResponseAtIndex(0).value().status).toBe(400)
    expect(result.multiStatusResponse.getResponseAtIndex(1).value().status).toBe(400)
  })

  test('invokes the async batch perform function when there is only 1 event', async () => {
    const multiStatusResponse = new MultiStatusResponse()
    multiStatusResponse.pushSuccessResponse({ status: 200, body: {}, sent: { user_id: 'user_123' } })

    mockPerformBatch.mockResolvedValue({
      jobId: 'single-event-job',
      status: 200,
      multiStatusResponse
    } as AsyncBatchResponse)

    const destination = new Destination(asyncBatchDestination)

    const result = await destination.executeAsyncBatch('asyncTestAction', {
      events: [events[0]],
      mapping: { user_id: { '@path': '$.userId' } },
      settings: {}
    })

    expect(mockPerformBatch).toHaveBeenCalledTimes(1)
    expect(mockPerformBatch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: expect.arrayContaining([{ user_id: 'user_123' }])
      })
    )
    expect(result.jobId).toBe('single-event-job')
  })

  test('removes empty values from all the payloads', async () => {
    const multiStatusResponse = new MultiStatusResponse()
    multiStatusResponse.pushSuccessResponse({ status: 200, body: {}, sent: {} })
    multiStatusResponse.pushSuccessResponse({ status: 200, body: {}, sent: {} })

    mockPerformBatch.mockResolvedValue({
      jobId: 'empty-values-job',
      status: 200,
      multiStatusResponse
    } as AsyncBatchResponse)

    const destination = new Destination(asyncBatchDestination)

    await destination.executeAsyncBatch('asyncTestAction', {
      events,
      mapping: {
        user_id: { '@path': '$.userId' },
        session_id: { '@path': '$.integrations.Test' }
      },
      settings: {}
    })

    expect(mockPerformBatch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: expect.arrayContaining([{ user_id: 'user_123', session_id: 1234 }, { user_id: 'user_456' }])
      })
    )
  })
})

describe('Async Batching - error handling', () => {
  const mockPerformBatch = jest.fn()
  const mockPerformPoll = jest.fn()

  const asyncActionDefinition: AsyncActionDefinition<JSONObject, { user_id: string }> = {
    title: 'Async Test Action',
    description: 'Async Test Action',
    fields: {
      user_id: {
        type: 'string',
        label: 'User ID',
        description: 'User ID',
        required: true,
        default: { '@path': '$.userId' }
      }
    },
    performBatch: mockPerformBatch,
    performPoll: mockPerformPoll
  }

  const asyncBatchDestination: DestinationDefinition<JSONObject> = {
    name: 'Async Batching Destination',
    mode: 'cloud',
    actions: {},
    asyncActions: { asyncTestAction: asyncActionDefinition }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('handles HTTPError thrown from performBatch', async () => {
    const mockResponse = new Response('bad request', { status: 400 })
    mockPerformBatch.mockRejectedValue(new HTTPError(mockResponse, new Request('https://example.com'), {} as any))

    const destination = new Destination(asyncBatchDestination)
    const result = await destination.executeAsyncBatch('asyncTestAction', {
      events,
      mapping: { user_id: { '@path': '$.userId' } },
      settings: {}
    })

    expect(result.jobId).toBeUndefined()
    expect(result.multiStatusResponse.getResponseAtIndex(0).value().status).toBe(400)
    expect(result.multiStatusResponse.getResponseAtIndex(1).value().status).toBe(400)
  })

  test('handles IntegrationError thrown from performBatch', async () => {
    mockPerformBatch.mockRejectedValue(new IntegrationError('something went wrong', 'INTEGRATION_ERROR', 500))

    const destination = new Destination(asyncBatchDestination)
    const result = await destination.executeAsyncBatch('asyncTestAction', {
      events,
      mapping: { user_id: { '@path': '$.userId' } },
      settings: {}
    })

    expect(result.jobId).toBeUndefined()
    expect(result.multiStatusResponse.getResponseAtIndex(0).value().status).toBe(500)
    expect(result.multiStatusResponse.getResponseAtIndex(1).value().status).toBe(500)
  })

  test('handles RetryableError thrown from performBatch', async () => {
    mockPerformBatch.mockRejectedValue(new RetryableError('rate limited', 429))

    const destination = new Destination(asyncBatchDestination)
    const result = await destination.executeAsyncBatch('asyncTestAction', {
      events,
      mapping: { user_id: { '@path': '$.userId' } },
      settings: {}
    })

    expect(result.jobId).toBeUndefined()
    expect(result.multiStatusResponse.getResponseAtIndex(0).value().status).toBe(429)
    expect(result.multiStatusResponse.getResponseAtIndex(1).value().status).toBe(429)
  })

  test('handles InvalidAuthenticationError thrown from performBatch', async () => {
    mockPerformBatch.mockRejectedValue(new InvalidAuthenticationError('invalid token'))

    const destination = new Destination(asyncBatchDestination)
    const result = await destination.executeAsyncBatch('asyncTestAction', {
      events,
      mapping: { user_id: { '@path': '$.userId' } },
      settings: {}
    })

    expect(result.jobId).toBeUndefined()
    expect(result.multiStatusResponse.getResponseAtIndex(0).value().status).toBe(401)
    expect(result.multiStatusResponse.getResponseAtIndex(1).value().status).toBe(401)
  })

  test('rethrows unknown errors thrown from performBatch', async () => {
    mockPerformBatch.mockRejectedValue(new Error('unexpected failure'))

    const destination = new Destination(asyncBatchDestination)
    await expect(
      destination.executeAsyncBatch('asyncTestAction', {
        events,
        mapping: { user_id: { '@path': '$.userId' } },
        settings: {}
      })
    ).rejects.toThrow('unexpected failure')
  })

  test('invalid payloads are excluded from batch and error handling fills remaining slots', async () => {
    mockPerformBatch.mockRejectedValue(new IntegrationError('something went wrong', 'INTEGRATION_ERROR', 500))

    const invalidEvent = createTestEvent({ event: 'Test Event', type: 'track', userId: undefined })
    const destination = new Destination(asyncBatchDestination)
    const result = await destination.executeAsyncBatch('asyncTestAction', {
      events: [events[0], invalidEvent, events[1]],
      mapping: { user_id: { '@path': '$.userId' } },
      settings: {}
    })

    expect(result.jobId).toBeUndefined()
    // invalid payload gets a 400
    expect(result.multiStatusResponse.getResponseAtIndex(1).value().status).toBe(400)
    const errResponse1 = result.multiStatusResponse.getResponseAtIndex(1)
    expect(errResponse1 instanceof ActionDestinationErrorResponse && errResponse1.value().errortype).toBe(
      ErrorCodes.PAYLOAD_VALIDATION_FAILED
    )
    // valid payloads get the IntegrationError status
    expect(result.multiStatusResponse.getResponseAtIndex(0).value().status).toBe(500)
    expect(result.multiStatusResponse.getResponseAtIndex(2).value().status).toBe(500)
  })
})

describe('Async Poll', () => {
  const mockPerformBatch = jest.fn()
  const mockPerformPoll = jest.fn()

  const asyncActionDefinition: AsyncActionDefinition<JSONObject, { user_id: string }> = {
    title: 'Async Poll Test Action',
    description: 'Async Poll Test Action',
    fields: {
      user_id: {
        type: 'string',
        label: 'User ID',
        description: 'User ID',
        required: true
      }
    },
    performBatch: mockPerformBatch,
    performPoll: mockPerformPoll
  }

  const asyncPollDestination: DestinationDefinition<JSONObject> = {
    name: 'Async Poll Destination',
    mode: 'cloud',
    actions: {},
    asyncActions: {
      asyncPollAction: asyncActionDefinition
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('poll returns IN_PROGRESS status', async () => {
    const pollResponse: PollResponse = {
      jobId: 'poll-job-123',
      status: 'IN_PROGRESS',
      stats: {
        successCount: 50,
        failureCount: 0
      }
    }

    mockPerformPoll.mockResolvedValue(pollResponse)

    const destination = new Destination(asyncPollDestination)
    const pollPayload: PollPayload = { jobId: 'poll-job-123', attempt: 1 }

    const result = await destination.executeAsyncPoll('asyncPollAction', {
      pollPayload,
      settings: {}
    })

    expect(result.status).toBe('IN_PROGRESS')
    expect(result.jobId).toBe('poll-job-123')
    expect(result.stats.successCount).toBe(50)
  })

  test('poll returns COMPLETED status with granular results', async () => {
    const granularResults = new MultiStatusResponse()
    granularResults.pushSuccessResponse({ status: 200, body: {}, sent: {} })
    granularResults.pushSuccessResponse({ status: 200, body: {}, sent: {} })

    const pollResponse: PollResponse = {
      jobId: 'poll-job-456',
      status: 'COMPLETED',
      stats: {
        successCount: 2,
        failureCount: 0
      },
      granularResults
    }

    mockPerformPoll.mockResolvedValue(pollResponse)

    const destination = new Destination(asyncPollDestination)
    const pollPayload: PollPayload = { jobId: 'poll-job-456', attempt: 5 }

    const result = await destination.executeAsyncPoll('asyncPollAction', {
      pollPayload,
      settings: {}
    })

    expect(result.status).toBe('COMPLETED')
    expect(result.jobId).toBe('poll-job-456')
    expect(result.stats.successCount).toBe(2)
    expect(result.granularResults).toBeDefined()
  })

  test('poll returns FAILED status with batch error', async () => {
    const pollResponse: PollResponse = {
      jobId: 'poll-job-789',
      status: 'FAILED',
      stats: {
        successCount: 0,
        failureCount: 10
      },
      batchResults: {
        status: 500,
        errortype: 'UNKNOWN_ERROR',
        errormessage: 'External API failure'
      }
    }

    mockPerformPoll.mockResolvedValue(pollResponse)

    const destination = new Destination(asyncPollDestination)
    const pollPayload: PollPayload = { jobId: 'poll-job-789', attempt: 3 }

    const result = await destination.executeAsyncPoll('asyncPollAction', {
      pollPayload,
      settings: {}
    })

    expect(result.status).toBe('FAILED')
    expect(result.stats.failureCount).toBe(10)
    expect(result.batchResults?.status).toBe(500)
    expect(result.batchResults?.errormessage).toBe('External API failure')
  })

  test('poll passes attempt number correctly', async () => {
    const pollResponse: PollResponse = {
      jobId: 'poll-job-attempt',
      status: 'IN_PROGRESS',
      stats: {
        successCount: 5,
        failureCount: 0
      }
    }

    mockPerformPoll.mockResolvedValue(pollResponse)

    const destination = new Destination(asyncPollDestination)
    const pollPayload: PollPayload = { jobId: 'poll-job-attempt', attempt: 7 }

    await destination.executeAsyncPoll('asyncPollAction', {
      pollPayload,
      settings: {}
    })

    expect(mockPerformPoll).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: { jobId: 'poll-job-attempt', attempt: 7 }
      })
    )
  })

  test('poll throws error for non-existent action', async () => {
    const destination = new Destination(asyncPollDestination)
    const pollPayload: PollPayload = { jobId: 'poll-job-error', attempt: 1 }

    await expect(
      destination.executeAsyncPoll('nonExistentAction', {
        pollPayload,
        settings: {}
      })
    ).rejects.toThrow('Async action nonExistentAction not found or does not support polling.')
  })
})
