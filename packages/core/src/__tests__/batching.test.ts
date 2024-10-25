import { Destination, DestinationDefinition } from '../destination-kit'
import type { JSONObject } from '../json-object'
import type { SegmentEvent } from '../segment-event'
import { createTestEvent } from '../create-test-event'
import {
  MultiStatusResponse,
  ActionDestinationSuccessResponse,
  ActionDestinationErrorResponse
} from '../destination-kit/action'
import { ErrorCodes } from '../errors'

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
  })
})
