import nock from 'nock'
import { createTestEvent, createTestIntegration, JSONValue, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import { flattenObject, embededObject } from '../../__tests__/flat.test'
import { HEAP_SEGMENT_CLOUD_LIBRARY_NAME } from '../../constants'

describe('Heap.trackEvent', () => {
  const testDestination = createTestIntegration(Destination)
  const timestamp = '2021-08-17T15:21:15.449Z'
  const HEAP_TEST_APP_ID = '11'
  const userId = 'foo@example.org'
  const messageId = '123'
  const eventName = 'Test Event'
  const heapURL = 'https://heapanalytics.com'
  const integrationsTrackURI = '/api/integrations/track'
  type heapEvent = {
    event: string
    idempotency_key: string
    timestamp: string
    properties?: {
      [k: string]: string | null | boolean | number
    }
    custom_properties?: {
      [k: string]: string | null | boolean | number
    }
    user_identifier?: {
      [k: string]: string
    }
  }
  let body: {
    app_id: string
    events: Array<heapEvent>
    library: string
  }
  beforeEach(() => {
    body = {
      app_id: HEAP_TEST_APP_ID,
      events: [
        {
          event: eventName,
          custom_properties: {},
          properties: {
            segment_library: HEAP_SEGMENT_CLOUD_LIBRARY_NAME
          },
          idempotency_key: messageId,
          timestamp
        }
      ],
      library: 'Segment'
    }
  })

  afterEach((done) => {
    const allNockIsCalled = nock.isDone()
    nock.cleanAll()
    if (allNockIsCalled) {
      done()
    } else {
      done.fail(new Error('Not all nock interceptors were used!'))
    }
  })

  it('should validate action fields for identified users', async () => {
    const anonId = '5a41f0df-b69a-4a99-b656-79506a86c3f8'
    const event: Partial<SegmentEvent> = createTestEvent({
      timestamp,
      event: eventName,
      userId,
      messageId,
      anonymousId: anonId
    })
    body.events[0].user_identifier = {
      anonymous_id: anonId
    }
    nock(heapURL).post(integrationsTrackURI, body).reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        appId: HEAP_TEST_APP_ID
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
  })

  it('should validate action fields for anonymous users', async () => {
    const testTimestampValue = '2021-08-17T15:21:15.449Z'
    const anonId = '5a41f0df-b69a-4a99-b656-79506a86c3f8'
    const event = createTestEvent({
      timestamp: testTimestampValue,
      event: 'Test Event',
      anonymousId: '5a41f0df-b69a-4a99-b656-79506a86c3f8',
      userId: null,
      messageId: '123'
    })

    body.events[0].user_identifier = {
      anonymous_id: anonId
    }

    nock(heapURL).post(integrationsTrackURI, body).reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        appId: HEAP_TEST_APP_ID
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
  })

  it('should validate action fields for a complex user', async () => {
    const testTimestampValue = '2021-08-17T15:21:15.449Z'
    const properties = embededObject() as unknown as {
      [k: string]: JSONValue
    }
    const anonId = '5a41f0df-b69a-4a99-b656-79506a86c3f8'
    const event = createTestEvent({
      timestamp: testTimestampValue,
      event: 'Test Event',
      anonymousId: anonId,
      userId: null,
      messageId: '123',
      properties
    })

    body.events[0].user_identifier = {
      anonymous_id: anonId
    }
    body.events[0].custom_properties = {
      ...flattenObject()
    }
    nock(heapURL).post(integrationsTrackURI, body).reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        appId: HEAP_TEST_APP_ID
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
  })

  it('should get event field for different event type', async () => {
    const anonId = '5a41f0df-b69a-4a99-b656-79506a86c3f8'
    const event: Partial<SegmentEvent> = createTestEvent({
      timestamp,
      event: undefined,
      userId,
      messageId,
      name: 'Home Page',
      type: 'page',
      anonymousId: anonId
    })
    body.events[0].user_identifier = {
      anonymous_id: anonId
    }
    body.events[0].event = 'Home Page page viewed'
    nock(heapURL).post(integrationsTrackURI, body).reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        appId: HEAP_TEST_APP_ID
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
