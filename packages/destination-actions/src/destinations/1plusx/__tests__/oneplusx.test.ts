import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import oneplusx from '../index'

const testDestination = createTestIntegration(oneplusx)

const client_id = 'fox'
const use_test_endpoint = true

describe('1plusX', () => {
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
        },
        context: {
          app: {
            version: '1.0'
          },
          page: {
            url: 'https://segment.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
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
        ope_item_uri: 'https://segment.com/',
        ope_event_time_ms: '2021-07-12T23:02:40.563Z',
        ope_user_agent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
        ope_app_version: '1.0',
        assetId: '12345',
        title: 'The Simpsons',
        genre: 'Comedy',
        full_episode: 'true'
      })
    })

    it('should send track with nested properties stringified', async () => {
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
          full_episode: true,
          publisher: {
            id: 'abc',
            network: 'test-network'
          }
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
        ope_event_time_ms: '2021-07-12T23:02:40.563Z',
        assetId: '12345',
        title: 'The Simpsons',
        genre: 'Comedy',
        full_episode: 'true'
      })
    })

    it('should send track with custom mappings', async () => {
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
          full_episode: true,
          platform: 'web',
          opt_out: 1,
          consents: 'Functional'
        }
      })

      const responses = await testDestination.testAction('sendEvent', {
        event,
        settings: {
          client_id,
          use_test_endpoint
        },
        mapping: {
          platform: {
            '@path': '$.properties.platform'
          },
          gdpr: {
            '@path': '$.properties.opt_out'
          },
          gdpr_consent: {
            '@path': '$.properties.consents'
          },
          ope_usp_string: {
            '@path': '$.properties.consents'
          }
        },
        useDefaultMappings: true
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(204)
      expect(responses[0].options.json).toMatchObject({
        ope_user_id: 'ANONYMOUSID:anon-user123',
        ope_event_type: 'Test Event',
        ope_event_time_ms: '2021-07-12T23:02:40.563Z',
        assetId: '12345',
        title: 'The Simpsons',
        genre: 'Comedy',
        full_episode: 'true',
        platform: 'web',
        gdpr: 1,
        gdpr_consent: 'Functional',
        ope_usp_string: 'Functional'
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
          title: 'Segment',
          url: 'https://segment.com/',
          path: '/',
          referrer: 'https://segment.com/warehouses',
          name: 'Homepage'
        },
        context: {
          page: {
            url: 'https://segment.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
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
        ope_item_uri: 'https://segment.com/',
        ope_event_time_ms: '2021-07-12T23:02:40.563Z',
        ope_user_agent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
        title: 'Segment',
        url: 'https://segment.com/',
        path: '/',
        referrer: 'https://segment.com/warehouses',
        name: 'Homepage'
      })
    })

    it('should send page with nested properties stringified', async () => {
      nock('https://tagger-test.opecloud.com').post(`/${client_id}/v2/native/event`).reply(204)
      const event = createTestEvent({
        anonymousId: 'anon-user123',
        userId: 'user123',
        timestamp: '2021-07-12T23:02:40.563Z',
        type: 'page',
        name: 'Homepage',
        properties: {
          title: 'Segment',
          url: 'https://segment.com/',
          path: '/',
          referrer: 'https://segment.com/warehouses',
          name: 'Homepage',
          page_info: {
            page_login_state: 'logged out',
            page_content_id: 'c1234-5678'
          }
        },
        context: {
          page: {
            url: 'https://segment.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
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
        ope_item_uri: 'https://segment.com/',
        ope_event_time_ms: '2021-07-12T23:02:40.563Z',
        title: 'Segment',
        url: 'https://segment.com/',
        path: '/',
        referrer: 'https://segment.com/warehouses',
        name: 'Homepage'
      })
    })

    it('should send page with custom mappings', async () => {
      nock('https://tagger-test.opecloud.com').post(`/${client_id}/v2/native/event`).reply(204)
      const event = createTestEvent({
        anonymousId: 'anon-user123',
        userId: 'user123',
        timestamp: '2021-07-12T23:02:40.563Z',
        type: 'page',
        name: 'Homepage',
        properties: {
          title: 'Segment',
          url: 'https://segment.com/',
          path: '/',
          referrer: 'https://segment.com/warehouses',
          name: 'Homepage',
          platform: 'web',
          opt_out: 1,
          consents: 'Functional'
        },
        context: {
          page: {
            url: 'https://segment.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
        }
      })

      const responses = await testDestination.testAction('sendPageview', {
        event,
        settings: {
          client_id,
          use_test_endpoint
        },
        mapping: {
          platform: {
            '@path': '$.properties.platform'
          },
          gdpr: {
            '@path': '$.properties.opt_out'
          },
          gdpr_consent: {
            '@path': '$.properties.consents'
          },
          ope_usp_string: {
            '@path': '$.properties.consents'
          }
        },
        useDefaultMappings: true
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(204)
      expect(responses[0].options.json).toMatchObject({
        ope_user_id: 'ANONYMOUSID:anon-user123',
        ope_event_type: 'Pageview',
        ope_item_uri: 'https://segment.com/',
        ope_event_time_ms: '2021-07-12T23:02:40.563Z',
        title: 'Segment',
        url: 'https://segment.com/',
        path: '/',
        referrer: 'https://segment.com/warehouses',
        name: 'Homepage',
        platform: 'web',
        gdpr: 1,
        gdpr_consent: 'Functional',
        ope_usp_string: 'Functional'
      })
    })

    it('should send screen with default mappings', async () => {
      nock('https://tagger-test.opecloud.com').post(`/${client_id}/v2/native/event`).reply(204)
      const event = createTestEvent({
        anonymousId: 'anon-user123',
        userId: 'user123',
        timestamp: '2021-07-12T23:02:40.563Z',
        type: 'screen',
        name: 'Home Screen',
        properties: {
          name: 'Home Screen',
          screen_type: 'Main',
          push_enabled: true
        },
        context: {
          app: {
            version: '1.0'
          }
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
        ope_event_time_ms: '2021-07-12T23:02:40.563Z',
        ope_app_version: '1.0',
        name: 'Home Screen',
        screen_type: 'Main',
        push_enabled: 'true'
      })
    })

    it('should send screen with custom mappings', async () => {
      nock('https://tagger-test.opecloud.com').post(`/${client_id}/v2/native/event`).reply(204)
      const event = createTestEvent({
        anonymousId: 'anon-user123',
        userId: 'user123',
        timestamp: '2021-07-12T23:02:40.563Z',
        type: 'screen',
        name: 'Home Screen',
        properties: {
          name: 'Home Screen',
          screen_type: 'Main',
          push_enabled: true,
          platform: 'ios',
          opt_out: 1,
          consents: 'Functional'
        },
        context: {
          app: {
            version: '1.0'
          }
        }
      })

      const responses = await testDestination.testAction('sendPageview', {
        event,
        settings: {
          client_id,
          use_test_endpoint
        },
        mapping: {
          platform: {
            '@path': '$.properties.platform'
          },
          gdpr: {
            '@path': '$.properties.opt_out'
          },
          gdpr_consent: {
            '@path': '$.properties.consents'
          },
          ope_usp_string: {
            '@path': '$.properties.consents'
          }
        },
        useDefaultMappings: true
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(204)
      expect(responses[0].options.json).toMatchObject({
        ope_user_id: 'ANONYMOUSID:anon-user123',
        ope_event_type: 'Pageview',
        ope_event_time_ms: '2021-07-12T23:02:40.563Z',
        ope_app_version: '1.0',
        name: 'Home Screen',
        screen_type: 'Main',
        push_enabled: 'true',
        platform: 'ios',
        gdpr: 1,
        gdpr_consent: 'Functional',
        ope_usp_string: 'Functional'
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
        },
        context: {
          app: {
            version: '1.0'
          },
          page: {
            url: 'https://segment.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
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
        ope_item_uri: 'https://segment.com/',
        ope_event_time_ms: '2021-07-12T23:02:40.563Z',
        ope_user_agent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57',
        ope_app_version: '1.0',
        gender: 'male',
        first_name: 'John',
        last_name: 'Smith',
        age: '40'
      })
    })

    it('should send identify with nested traits stringified', async () => {
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
          age: 40,
          company: {
            name: 'Segment',
            employees: 1000
          }
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
        ope_event_time_ms: '2021-07-12T23:02:40.563Z',
        gender: 'male',
        first_name: 'John',
        last_name: 'Smith',
        age: '40'
      })
    })

    it('should send identify with custom mappings', async () => {
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
          age: 40,
          platform: 'web',
          opt_out: 1,
          consents: 'Functional'
        }
      })

      const responses = await testDestination.testAction('sendUserData', {
        event,
        settings: {
          client_id,
          use_test_endpoint
        },
        mapping: {
          platform: {
            '@path': '$.traits.platform'
          },
          gdpr: {
            '@path': '$.traits.opt_out'
          },
          gdpr_consent: {
            '@path': '$.traits.consents'
          },
          ope_usp_string: {
            '@path': '$.traits.consents'
          }
        },
        useDefaultMappings: true
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(204)
      expect(responses[0].options.json).toMatchObject({
        ope_user_id: 'ANONYMOUSID:anon-user123',
        ope_event_type: 'User Identified',
        ope_event_time_ms: '2021-07-12T23:02:40.563Z',
        gender: 'male',
        first_name: 'John',
        last_name: 'Smith',
        age: '40',
        platform: 'web',
        gdpr: 1,
        gdpr_consent: 'Functional',
        ope_usp_string: 'Functional'
      })
    })
  })
})
