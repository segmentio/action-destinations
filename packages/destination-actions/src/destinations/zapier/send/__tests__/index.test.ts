import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import destination from '../../index'

const testDestination = createTestIntegration(destination)

describe('Zapier', () => {
  describe('send', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      nock.cleanAll()
    })

    it('should send a event payloads to Zapier', async () => {
      const zapier_url = 'https://hooks.zapier.com/hooks/catch/123456/abcdef'

      const event = createTestEvent({
        event: 'Random Event',
        messageId: '234567ugfvbnjhgbnmjhb',
        timestamp: '2025-12-05T12:15:26.104Z',
        receivedAt: '2025-12-05T12:15:26.104Z',
        sentAt: '2025-12-05T12:15:26.104Z',
        type: 'track',
        properties: {
          prop1: 12345,
          prop2: 'some text',
          prop3: false,
          prop4: ['one', 'two', 'three'],
          prop5: { key1: 'value1', key2: 'value2' }
        },
        context: {
          page: {
            url: 'https://segment.com/',
            referrer: 'https://google.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        userId: 'testId123'
      }) as Partial<SegmentEvent>

      const json = {
        anonymousId: 'anonId1234',
        context: {
          page: { url: 'https://segment.com/', referrer: 'https://google.com/' },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
          ip: '0.0.0.0'
        },
        event: 'Random Event',
        messageId: '234567ugfvbnjhgbnmjhb',
        properties: {
          prop1: 12345,
          prop2: 'some text',
          prop3: false,
          prop4: ['one', 'two', 'three'],
          prop5: { key1: 'value1', key2: 'value2' }
        },
        receivedAt: '2025-12-05T12:15:26.104Z',
        sentAt: '2025-12-05T12:15:26.104Z',
        timestamp: '2025-12-05T12:15:26.104Z',
        traits: {},
        type: 'track',
        userId: 'testId123'
      }

      nock('https://hooks.zapier.com').post('/hooks/catch/123456/abcdef', json).reply(200)

      const responses = await testDestination.testAction('send', {
        event,
        useDefaultMappings: true,
        mapping: {
          data: { '@path': '$.' },
          zapSubscriptionUrl: zapier_url
        }
      })
      expect(responses.length).toBe(1)
    })
  })
})
