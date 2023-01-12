import { createTestEvent, createTestIntegration, JSONObject, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'
import { apiBaseUrl } from '../../api'

describe('SalesWings', () => {
  describe('.submitEvent', () => {
    it('should submit event on Track event', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered',
        properties: {
          plan: 'Pro Annual',
          accountType: 'Facebook'
        },
        context: {
          userAgent,
          page: {
            url: 'https://example.com',
            referrer: 'https://example.com/other'
          }
        }
      })
      const request = await testAction(event)
      expect(request).toMatchObject({
        type: 'tracking',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId }
        ],
        kind: 'Track',
        data: 'User Registered',
        url: 'https://example.com',
        referrerUrl: 'https://example.com/other',
        userAgent,
        timestamp: expectedTs(event.timestamp),
        values: {
          plan: 'Pro Annual',
          accountType: 'Facebook'
        }
      })
    })

    it('should submit event on Track event with all optional fields omitted', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered'
      })
      const request = await testAction(event)
      expect(request).toMatchObject({
        type: 'tracking',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId }
        ],
        kind: 'Track',
        data: 'User Registered',
        timestamp: expectedTs(event.timestamp),
        values: {}
      })
    })

    it('should submit event on Track event with email in properties', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered',
        properties: {
          email: 'peter@example.com'
        }
      })
      const request = await testAction(event)
      expect(request).toMatchObject({
        type: 'tracking',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId },
          { type: 'email', value: 'peter@example.com' }
        ],
        kind: 'Track',
        data: 'User Registered',
        timestamp: expectedTs(event.timestamp),
        values: {}
      })
    })

    it('should use custom event property mapping', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered',
        properties: {
          plan: 'Pro Annual',
          accountType: 'Facebook'
        }
      })
      const customEventPropertyMapping = {
        'Some Irrelevant Event': 'foo',
        'User Registered': 'accountType'
      }
      const mapping = { customEventPropertyMapping, ...minRequiredMapping }
      const request = await testAction(event, mapping)
      expect(request).toMatchObject({
        type: 'tracking',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId }
        ],
        kind: 'User Registered',
        data: 'Facebook',
        timestamp: expectedTs(event.timestamp),
        values: {
          plan: 'Pro Annual',
          accountType: 'Facebook'
        }
      })
    })

    it('should not skip an event with userId only', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered',
        anonymousId: undefined
      })
      const request = await testAction(event)
      expect(request).toMatchObject({
        type: 'tracking',
        leadRefs: [{ type: 'client-id', value: event.userId }],
        kind: 'Track',
        data: 'User Registered',
        timestamp: expectedTs(event.timestamp),
        values: {}
      })
    })

    it('should not skip an event with anonymousID only', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered',
        userId: undefined
      })
      const request = await testAction(event)
      expect(request).toMatchObject({
        type: 'tracking',
        leadRefs: [{ type: 'client-id', value: event.anonymousId }],
        kind: 'Track',
        data: 'User Registered',
        timestamp: expectedTs(event.timestamp),
        values: {}
      })
    })

    it('should submit event on Page event', async () => {
      const event = createTestEvent({
        type: 'page',
        properties: {
          url: 'https://example.com',
          referrer: 'https://example.com/other'
        },
        context: {
          userAgent
        }
      })
      const request = await testAction(event)
      expect(request).toMatchObject({
        type: 'page-visit',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId }
        ],
        url: 'https://example.com',
        referrerUrl: 'https://example.com/other',
        userAgent,
        timestamp: expectedTs(event.timestamp)
      })
    })

    it('should submit event on Page event with all optional fields omitted', async () => {
      const event = createTestEvent({
        type: 'page',
        properties: {
          url: 'https://example.com'
        }
      })
      const request = await testAction(event)
      expect(request).toMatchObject({
        type: 'page-visit',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId }
        ],
        url: 'https://example.com',
        timestamp: expectedTs(event.timestamp)
      })
    })

    it('should skip Page event if url not specified', async () => {
      const event = createTestEvent({
        type: 'page',
        properties: {}
      })
      await testActionWithSkippedEvent(event)
    })

    it('should submit event on Identify event', async () => {
      const event = createTestEvent({
        type: 'identify',
        traits: {
          name: 'Peter Gibbons',
          email: 'peter@example.com',
          plan: 'premium',
          logins: 5
        },
        context: {
          userAgent,
          page: {
            url: 'https://example.com',
            referrer: 'https://example.com/other'
          }
        }
      })
      const request = await testAction(event)
      expect(request).toMatchObject({
        type: 'tracking',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId },
          { type: 'email', value: event.traits?.email }
        ],
        kind: 'Identify',
        data: 'peter@example.com',
        url: 'https://example.com',
        referrerUrl: 'https://example.com/other',
        userAgent,
        timestamp: expectedTs(event.timestamp),
        values: {
          name: 'Peter Gibbons',
          plan: 'premium',
          logins: 5
        }
      })
    })

    it('should submit event on Identify event with all optional fields omitted', async () => {
      const event = createTestEvent({
        type: 'identify',
        traits: {
          email: 'peter@example.com'
        }
      })
      const request = await testAction(event)
      expect(request).toMatchObject({
        type: 'tracking',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId },
          { type: 'email', value: event.traits?.email }
        ],
        kind: 'Identify',
        data: 'peter@example.com',
        timestamp: expectedTs(event.timestamp),
        values: {}
      })
    })

    it('should skip Identify event if email not specified', async () => {
      const event = createTestEvent({
        type: 'identify',
        traits: {}
      })
      await testActionWithSkippedEvent(event)
    })

    it('should submit event on Screen event', async () => {
      const event = createTestEvent({
        type: 'screen',
        name: 'Home',
        properties: {
          'Feed Type': 'private'
        },
        context: {
          userAgent,
          page: {
            url: 'https://example.com',
            referrer: 'https://example.com/other'
          }
        }
      })
      const request = await testAction(event)
      expect(request).toMatchObject({
        type: 'tracking',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId }
        ],
        kind: 'Screen',
        data: 'Home',
        url: 'https://example.com',
        referrerUrl: 'https://example.com/other',
        userAgent,
        timestamp: expectedTs(event.timestamp),
        values: {
          'Feed Type': 'private'
        }
      })
    })

    it('should submit event on Screen event with all optional fields omitted', async () => {
      const event = createTestEvent({
        type: 'screen',
        name: 'Home'
      })
      const request = await testAction(event)
      expect(request).toMatchObject({
        type: 'tracking',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId }
        ],
        kind: 'Screen',
        data: 'Home',
        timestamp: expectedTs(event.timestamp),
        values: {}
      })
    })

    it('should skip Screen event if name not specified', async () => {
      const event = createTestEvent({
        type: 'screen'
      })
      await testActionWithSkippedEvent(event)
    })

    it('should submit event batch', async () => {
      const events = [
        createTestEvent({
          type: 'track',
          event: 'User Registered'
        }),
        createTestEvent({
          type: 'page',
          properties: {
            url: 'https://example.com'
          }
        }),
        createTestEvent({
          type: 'identify',
          traits: {
            email: 'peter@example.com'
          }
        }),
        createTestEvent({
          type: 'screen',
          name: 'Home'
        })
      ]
      const request = await testBatchAction(events)
      expect(request).toMatchObject({
        events: [
          {
            type: 'tracking',
            leadRefs: [
              { type: 'client-id', value: events[0].userId },
              { type: 'client-id', value: events[0].anonymousId }
            ],
            kind: 'Track',
            data: 'User Registered',
            timestamp: expectedTs(events[0].timestamp),
            values: {}
          },
          {
            type: 'page-visit',
            leadRefs: [
              { type: 'client-id', value: events[1].userId },
              { type: 'client-id', value: events[1].anonymousId }
            ],
            url: 'https://example.com',
            timestamp: expectedTs(events[1].timestamp)
          },
          {
            type: 'tracking',
            leadRefs: [
              { type: 'client-id', value: events[2].userId },
              { type: 'client-id', value: events[2].anonymousId },
              { type: 'email', value: events[2].traits?.email }
            ],
            kind: 'Identify',
            data: 'peter@example.com',
            timestamp: expectedTs(events[2].timestamp),
            values: {}
          },
          {
            type: 'tracking',
            leadRefs: [
              { type: 'client-id', value: events[3].userId },
              { type: 'client-id', value: events[3].anonymousId }
            ],
            kind: 'Screen',
            data: 'Home',
            timestamp: expectedTs(events[3].timestamp),
            values: {}
          }
        ]
      })
    })

    it('should not include skippable events into a batch', async () => {
      const events = [
        createTestEvent({
          type: 'track',
          event: 'User Registered'
        }),
        createTestEvent({
          type: 'page'
        }),
        createTestEvent({
          type: 'identify',
          traits: {
            email: 'peter@example.com'
          }
        }),
        createTestEvent({
          type: 'screen'
        }),
        createTestEvent({
          type: 'group'
        })
      ]
      const request = await testBatchAction(events)
      expect(request).toMatchObject({
        events: [
          {
            type: 'tracking',
            leadRefs: [
              { type: 'client-id', value: events[0].userId },
              { type: 'client-id', value: events[0].anonymousId }
            ],
            kind: 'Track',
            data: 'User Registered',
            timestamp: expectedTs(events[0].timestamp),
            values: {}
          },
          {
            type: 'tracking',
            leadRefs: [
              { type: 'client-id', value: events[2].userId },
              { type: 'client-id', value: events[2].anonymousId },
              { type: 'email', value: events[2].traits?.email }
            ],
            kind: 'Identify',
            data: 'peter@example.com',
            timestamp: expectedTs(events[2].timestamp),
            values: {}
          }
        ]
      })
    })

    it('should not submit a batch if all the events are skippable', async () => {
      const events = [
        createTestEvent({
          type: 'track',
          event: undefined
        }),
        createTestEvent({
          type: 'page'
        }),
        createTestEvent({
          type: 'identify'
        }),
        createTestEvent({
          type: 'screen'
        }),
        createTestEvent({
          type: 'group'
        })
      ]
      const responses = await testDestination.testBatchAction('submitEvent', {
        events,
        settings,
        useDefaultMappings: true
      })
      expect(responses.length).toBe(0)
    })
  })
})

const testDestination = createTestIntegration(Destination)

const settings = { apiKey: 'TEST_API_KEY' }

const testAction = async (event: SegmentEvent, mapping: JSONObject | undefined = undefined): Promise<any> => {
  nock(apiBaseUrl).post('/events').reply(200, {})
  const input = { event, settings, mapping, useDefaultMappings: mapping === undefined }
  const responses = await testDestination.testAction('submitEvent', input)
  expect(responses.length).toBe(1)
  const request = responses[0].request
  expect(request.headers.get('Authorization')).toBe(`Bearer ${settings.apiKey}`)
  const rawBody = await request.text()
  return JSON.parse(rawBody)
}

const testBatchAction = async (events: SegmentEvent[]): Promise<any> => {
  nock(apiBaseUrl).post('/events/batches').reply(200, {})
  const input = { events, settings, useDefaultMappings: true }
  const responses = await testDestination.testBatchAction('submitEvent', input)
  expect(responses.length).toBe(1)
  const request = responses[0].request
  expect(request.headers.get('Authorization')).toBe(`Bearer ${settings.apiKey}`)
  const rawBody = await request.text()
  return JSON.parse(rawBody)
}

const testActionWithSkippedEvent = async (event: SegmentEvent): Promise<void> => {
  const responses = await testDestination.testAction('submitEvent', { event, settings, useDefaultMappings: true })
  expect(responses.length).toBe(0)
}

const expectedTs = (segmentEventTs: string | Date | undefined): number => {
  if (segmentEventTs === undefined) throw new Error('Unexpected state: test event created without a timestamp')
  else if (typeof segmentEventTs === 'string') return Date.parse(segmentEventTs)
  else return segmentEventTs.valueOf()
}

const userAgent =
  '"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'

const minRequiredMapping = {
  type: { '@path': '$.type' },
  userId: { '@path': '$.userId' },
  anonymousId: { '@path': '$.anonymousId' },
  eventName: { '@path': '$.event' },
  properties: { '@path': '$.properties' },
  timestamp: { '@path': '$.timestamp' }
}
