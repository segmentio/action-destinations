import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import oneplusx from '../index'

const testDestination = createTestIntegration(oneplusx)

const client_id = 'fox'
const use_test_endpoint = true

describe('1PlusX', () => {
  describe('sendEvent', () => {
    it('should send track with default mappings', async () => {
      nock('https://tagger-test.opecloud.com').post(`/${client_id}/v2/native/event`).reply(204)
      const event = createTestEvent({
        anonymousId: 'anon-user123',
        userId: 'user123',
        timestamp: '2021-07-12T23:02:40.563Z',
        event: 'Test Event',
        type: 'track',
        properties: {
          assetId: '12345',
          title: 'The Simpsons',
          genre: 'Comedy',
          full_episode: true
        }
      })

      const responses = await testDestination.testAction('sendEvent', {
        event,
        settings: {
          client_id,
          use_test_endpoint
        },
        useDefaultMappings: true
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(204)
      expect(responses[0].options.json).toMatchObject({
        ope_user_id: 'ANONYMOUSID:anon-user123',
        ope_event_type: 'Test Event',
        ope_item_uri: 'https://segment.com/academy/',
        ope_event_time_ms: '2021-07-12T23:02:40.563Z',
        ope_user_agent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
        assetId: '"12345"',
        title: '"The Simpsons"',
        genre: '"Comedy"',
        full_episode: 'true'
      })
    })
  })

  describe('sendPageview', () => {
    it('should send page with default mappings', async () => {
      nock('https://tagger-test.opecloud.com').post(`/${client_id}/v2/native/event`).reply(204)
      const event = createTestEvent({
        anonymousId: 'anon-user123',
        userId: 'user123',
        timestamp: '2021-07-12T23:02:40.563Z',
        type: 'page',
        name: 'Homepage',
        properties: {
          title: 'Segment Academy',
          url: 'https://segment.com/academy',
          path: '/academy',
          referrer: 'https://segment.com/warehouses'
        }
      })

      const responses = await testDestination.testAction('sendPageview', {
        event,
        settings: {
          client_id,
          use_test_endpoint
        },
        useDefaultMappings: true
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(204)
      expect(responses[0].options.json).toMatchObject({
        ope_user_id: 'ANONYMOUSID:anon-user123',
        ope_event_type: 'Pageview',
        ope_item_uri: 'https://segment.com/academy/',
        ope_event_time_ms: '2021-07-12T23:02:40.563Z',
        ope_user_agent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
        title: '"Segment Academy"',
        url: '"https://segment.com/academy"',
        path: '"/academy"',
        referrer: '"https://segment.com/warehouses"'
      })
    })
  })

  describe('sendUserData', () => {
    it('should send identify with default mappings', async () => {
      nock('https://tagger-test.opecloud.com').post(`/${client_id}/v2/native/event`).reply(204)
      const event = createTestEvent({
        anonymousId: 'anon-user123',
        userId: 'user123',
        timestamp: '2021-07-12T23:02:40.563Z',
        type: 'identify',
        traits: {
          gender: 'male',
          first_name: 'John',
          last_name: 'Smith',
          age: 40
        }
      })

      const responses = await testDestination.testAction('sendUserData', {
        event,
        settings: {
          client_id,
          use_test_endpoint
        },
        useDefaultMappings: true
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(204)
      expect(responses[0].options.json).toMatchObject({
        ope_user_id: 'ANONYMOUSID:anon-user123',
        ope_event_type: 'User Identified',
        ope_item_uri: 'https://segment.com/academy/',
        ope_event_time_ms: '2021-07-12T23:02:40.563Z',
        ope_user_agent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
        gender: '"male"',
        first_name: '"John"',
        last_name: '"Smith"',
        age: '40'
      })
    })
  })
})
