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

  test('defaults status to 200 when performBatch omits it', async () => {
    const multiStatusResponse = new MultiStatusResponse()
    multiStatusResponse.pushSuccessResponse({ status: 200, body: {}, sent: { user_id: 'user_123' } })
    multiStatusResponse.pushSuccessResponse({ status: 200, body: {}, sent: { user_id: 'user_456' } })

    // Integration returns a response without a top-level status (untyped boundary)
    mockPerformBatch.mockResolvedValue({
      jobId: 'async-job-no-status',
      multiStatusResponse
    } as unknown as AsyncBatchResponse)

    const destination = new Destination(asyncBatchDestination)
    const result = await destination.executeAsyncBatch('asyncTestAction', {
      events,
      mapping: { user_id: { '@path': '$.userId' } },
      settings: {}
    })

    expect(result.jobId).toBe('async-job-no-status')
    expect(result.status).toBe(200)
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

  test('keeps audienceMembership aligned with the payload after invalid events are filtered', async () => {
    const multiStatusResponse = new MultiStatusResponse()
    multiStatusResponse.pushSuccessResponse({ status: 200, body: {}, sent: {} })
    multiStatusResponse.pushSuccessResponse({ status: 200, body: {}, sent: {} })

    mockPerformBatch.mockResolvedValue({
      jobId: 'audience-align-job',
      status: 200,
      multiStatusResponse
    } as AsyncBatchResponse)

    const personas = { computation_class: 'audience', computation_key: 'in_audience' }

    // Valid, membership = true
    const addedEvent = createTestEvent({
      userId: 'user_added',
      type: 'track',
      event: 'Audience Entered',
      context: { personas },
      properties: { in_audience: true }
    })
    // Invalid (missing required user_id) — filtered out before performBatch.
    // Sits between the two valid events, so a misaligned membership array would be detectable.
    const invalidEvent = createTestEvent({
      userId: undefined,
      type: 'track',
      event: 'Audience Entered',
      context: { personas },
      properties: { in_audience: true }
    })
    // Valid, membership = false
    const removedEvent = createTestEvent({
      userId: 'user_removed',
      type: 'track',
      event: 'Audience Exited',
      context: { personas },
      properties: { in_audience: false }
    })

    const destination = new Destination(asyncBatchDestination)
    await destination.executeAsyncBatch('asyncTestAction', {
      events: [addedEvent, invalidEvent, removedEvent],
      mapping: { user_id: { '@path': '$.userId' } },
      settings: {}
    })

    expect(mockPerformBatch).toHaveBeenCalledTimes(1)
    const data = mockPerformBatch.mock.calls[0][1]
    // The invalid event is dropped, so payload and audienceMembership both have length 2 and stay aligned:
    // audienceMembership[0] -> user_added (true), audienceMembership[1] -> user_removed (false).
    expect(data.payload).toEqual([{ user_id: 'user_added' }, { user_id: 'user_removed' }])
    expect(data.audienceMembership).toEqual([true, false])
  })

  test('does not throw and returns an empty multi-status response for an empty batch', async () => {
    const destination = new Destination(asyncBatchDestination)

    const result = await destination.executeAsyncBatch('asyncTestAction', {
      events: [],
      mapping: { user_id: { '@path': '$.userId' } },
      settings: {}
    })

    expect(mockPerformBatch).not.toHaveBeenCalled()
    expect(result.jobId).toBeUndefined()
    expect(result.status).toBe(200)
    expect(result.multiStatusResponse.length()).toBe(0)
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
      status: 200,
      jobStatus: 'IN_PROGRESS'
    }

    mockPerformPoll.mockResolvedValue(pollResponse)

    const destination = new Destination(asyncPollDestination)
    const pollPayload: PollPayload = { jobId: 'poll-job-123', uploadCount: 50 }

    const result = await destination.executeAsyncPoll('asyncPollAction', {
      pollPayload,
      settings: {}
    })

    expect(result.jobStatus).toBe('IN_PROGRESS')
    expect(result.status).toBe(200)
    expect(result.jobId).toBe('poll-job-123')
  })

  test('poll returns SUCCEEDED status with multi-status response', async () => {
    const multiStatusResponse = new MultiStatusResponse()
    multiStatusResponse.pushSuccessResponse({ status: 200, body: {}, sent: {} })
    multiStatusResponse.pushSuccessResponse({ status: 200, body: {}, sent: {} })

    const pollResponse: PollResponse = {
      jobId: 'poll-job-456',
      status: 200,
      jobStatus: 'SUCCEEDED',
      multiStatusResponse
    }

    mockPerformPoll.mockResolvedValue(pollResponse)

    const destination = new Destination(asyncPollDestination)
    const pollPayload: PollPayload = { jobId: 'poll-job-456', uploadCount: 2 }

    const result = await destination.executeAsyncPoll('asyncPollAction', {
      pollPayload,
      settings: {}
    })

    expect(result.jobStatus).toBe('SUCCEEDED')
    expect(result.jobId).toBe('poll-job-456')
    expect(result.multiStatusResponse).toBeDefined()
    expect(result.multiStatusResponse?.length()).toBe(2)
  })

  test('poll returns FAILED status with a batch-level error', async () => {
    const multiStatusResponse = new MultiStatusResponse()
    multiStatusResponse.pushErrorResponse({ status: 500, errormessage: 'External API failure' })

    const pollResponse: PollResponse = {
      jobId: 'poll-job-789',
      status: 500,
      jobStatus: 'FAILED',
      multiStatusResponse
    }

    mockPerformPoll.mockResolvedValue(pollResponse)

    const destination = new Destination(asyncPollDestination)
    const pollPayload: PollPayload = { jobId: 'poll-job-789', uploadCount: 10 }

    const result = await destination.executeAsyncPoll('asyncPollAction', {
      pollPayload,
      settings: {}
    })

    expect(result.jobStatus).toBe('FAILED')
    expect(result.status).toBe(500)
    const errResponse = result.multiStatusResponse?.getResponseAtIndex(0)
    expect(errResponse?.value().status).toBe(500)
    expect(errResponse instanceof ActionDestinationErrorResponse && errResponse.value().errormessage).toBe(
      'External API failure'
    )
  })

  test('poll returns RETRYABLE_ERROR status on a transient failure', async () => {
    const pollResponse: PollResponse = {
      jobId: 'poll-job-retry',
      status: 429,
      jobStatus: 'RETRYABLE_ERROR'
    }

    mockPerformPoll.mockResolvedValue(pollResponse)

    const destination = new Destination(asyncPollDestination)
    const pollPayload: PollPayload = { jobId: 'poll-job-retry', uploadCount: 10 }

    const result = await destination.executeAsyncPoll('asyncPollAction', {
      pollPayload,
      settings: {}
    })

    expect(result.jobStatus).toBe('RETRYABLE_ERROR')
    expect(result.status).toBe(429)
    expect(result.jobId).toBe('poll-job-retry')
  })

  test('poll passes the poll payload through to performPoll', async () => {
    const pollResponse: PollResponse = {
      jobId: 'poll-job-upload',
      status: 200,
      jobStatus: 'IN_PROGRESS'
    }

    mockPerformPoll.mockResolvedValue(pollResponse)

    const destination = new Destination(asyncPollDestination)
    const pollPayload: PollPayload = { jobId: 'poll-job-upload', uploadCount: 7 }

    await destination.executeAsyncPoll('asyncPollAction', {
      pollPayload,
      settings: {}
    })

    expect(mockPerformPoll).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: { jobId: 'poll-job-upload', uploadCount: 7 }
      })
    )
  })

  test('poll throws error for non-existent action', async () => {
    const destination = new Destination(asyncPollDestination)
    const pollPayload: PollPayload = { jobId: 'poll-job-error', uploadCount: 1 }

    await expect(
      destination.executeAsyncPoll('nonExistentAction', {
        pollPayload,
        settings: {}
      })
    ).rejects.toThrow('Async action nonExistentAction not found or does not support polling.')
  })
})
