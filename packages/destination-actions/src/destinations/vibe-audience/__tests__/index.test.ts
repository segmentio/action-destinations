import nock from 'nock'
import { createTestIntegration, createTestEvent } from '@segment/actions-core'
import Definition from '../index'
import { BASE_URL, API_VERSION } from '../constants'

const testDestination = createTestIntegration(Definition)

describe('Vibe Audience', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const baseUrlParts = new URL(BASE_URL)
      nock(baseUrlParts.origin)
        .post(`/${API_VERSION}/webhooks/twilio/audience/auth`, (body) => body.advertiserId === 'test-advertiser-id')
        .reply(200, { authenticated: true })

      const authData = {
        advertiserId: 'test-advertiser-id',
        authToken: 'test-auth-token'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })

  describe('sync action', () => {
    it('should sync audience data with add and remove emails', async () => {
      const baseUrlParts = new URL(BASE_URL)
      nock(baseUrlParts.origin).post(`/${API_VERSION}/webhooks/twilio/audience/sync`).reply(200, { success: true })

      const settings = {
        advertiserId: 'test-advertiser-id',
        authToken: 'test-auth-token'
      }

      const event = createTestEvent({
        traits: {
          email: 'test@example.com',
          'Test Audience': true
        }
      })

      const mapping = {
        email: 'test@example.com',
        audience_name: 'Test Audience',
        audience_id: 'test-audience-id',
        traits_or_props: {
          'Test Audience': true
        },
        enable_batching: true,
        batch_size: 1000,
        batch_keys: ['audience_id', 'audience_name']
      }

      const responses = await testDestination.testAction('sync', {
        event,
        mapping,
        settings
      })

      expect(responses).toHaveLength(1)
      expect(responses[0].status).toBe(200)

      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody.advertiserId).toBe('test-advertiser-id')
    })

    it('should sync audience data with personal information (first name, last name, phone)', async () => {
      const baseUrlParts = new URL(BASE_URL)
      nock(baseUrlParts.origin).post(`/${API_VERSION}/webhooks/twilio/audience/sync`).reply(200, { success: true })

      const settings = {
        advertiserId: 'test-advertiser-id',
        authToken: 'test-auth-token'
      }

      const event = createTestEvent({
        traits: {
          email: 'john.doe@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone: '+1234567890',
          'Test Audience': true
        }
      })

      const mapping = {
        email: 'john.doe@example.com',
        audience_name: 'Test Audience',
        audience_id: 'test-audience-id',
        traits_or_props: {
          'Test Audience': true
        },
        personal_information: {
          first_name: 'John',
          last_name: 'Doe',
          phone: '+1234567890'
        },
        enable_batching: true,
        batch_size: 1000,
        batch_keys: ['audience_id', 'audience_name']
      }

      const responses = await testDestination.testAction('sync', {
        event,
        mapping,
        settings
      })

      expect(responses).toHaveLength(1)
      expect(responses[0].status).toBe(200)

      // Verify the request body contains personal information and advertiserId
      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody.advertiserId).toBe('test-advertiser-id')
      expect(requestBody.addProfiles).toHaveLength(1)
      expect(requestBody.addProfiles[0]).toEqual({
        email: 'john.doe@example.com',
        profileDetails: {
          first_name: 'John',
          last_name: 'Doe',
          phone: '+1234567890'
        }
      })
    })

    it('should sync audience data with partial personal information (first name only)', async () => {
      const baseUrlParts = new URL(BASE_URL)
      nock(baseUrlParts.origin).post(`/${API_VERSION}/webhooks/twilio/audience/sync`).reply(200, { success: true })

      const settings = {
        advertiserId: 'test-advertiser-id',
        authToken: 'test-auth-token'
      }

      const event = createTestEvent({
        traits: {
          email: 'jane@example.com',
          first_name: 'Jane',
          'Test Audience': true
        }
      })

      const mapping = {
        email: 'jane@example.com',
        audience_name: 'Test Audience',
        audience_id: 'test-audience-id',
        traits_or_props: {
          'Test Audience': true
        },
        personal_information: {
          first_name: 'Jane'
        },
        enable_batching: true,
        batch_size: 1000,
        batch_keys: ['audience_id', 'audience_name']
      }

      const responses = await testDestination.testAction('sync', {
        event,
        mapping,
        settings
      })

      expect(responses).toHaveLength(1)
      expect(responses[0].status).toBe(200)

      // Verify the request body contains only first name
      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody.advertiserId).toBe('test-advertiser-id')
      expect(requestBody.addProfiles).toHaveLength(1)
      expect(requestBody.addProfiles[0]).toEqual({
        email: 'jane@example.com',
        profileDetails: {
          first_name: 'Jane'
        }
      })
    })

    it('should sync audience data with phone number only', async () => {
      const baseUrlParts = new URL(BASE_URL)
      nock(baseUrlParts.origin).post(`/${API_VERSION}/webhooks/twilio/audience/sync`).reply(200, { success: true })

      const settings = {
        advertiserId: 'test-advertiser-id',
        authToken: 'test-auth-token'
      }

      const event = createTestEvent({
        traits: {
          email: 'phone.user@example.com',
          phone: '+1-555-0123',
          'Test Audience': true
        }
      })

      const mapping = {
        email: 'phone.user@example.com',
        audience_name: 'Test Audience',
        audience_id: 'test-audience-id',
        traits_or_props: {
          'Test Audience': true
        },
        personal_information: {
          phone: '+1-555-0123'
        },
        enable_batching: true,
        batch_size: 1000,
        batch_keys: ['audience_id', 'audience_name']
      }

      const responses = await testDestination.testAction('sync', {
        event,
        mapping,
        settings
      })

      expect(responses).toHaveLength(1)
      expect(responses[0].status).toBe(200)

      // Verify the request body contains only phone
      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody.advertiserId).toBe('test-advertiser-id')
      expect(requestBody.addProfiles).toHaveLength(1)
      expect(requestBody.addProfiles[0]).toEqual({
        email: 'phone.user@example.com',
        profileDetails: {
          phone: '+1-555-0123'
        }
      })
    })

    it('should sync audience data with ip_address', async () => {
      const baseUrlParts = new URL(BASE_URL)
      nock(baseUrlParts.origin).post(`/${API_VERSION}/webhooks/twilio/audience/sync`).reply(200, { success: true })

      const settings = {
        advertiserId: 'test-advertiser-id',
        authToken: 'test-auth-token'
      }

      const event = createTestEvent({
        context: { ip: '192.168.1.1' },
        traits: {
          email: 'ip-test@example.com',
          'Test Audience': true
        }
      })

      const mapping = {
        email: 'ip-test@example.com',
        ip_address: '192.168.1.1',
        audience_name: 'Test Audience',
        audience_id: 'test-audience-id',
        traits_or_props: {
          'Test Audience': true
        },
        enable_batching: true,
        batch_size: 1000,
        batch_keys: ['audience_id', 'audience_name']
      }

      const responses = await testDestination.testAction('sync', {
        event,
        mapping,
        settings
      })

      expect(responses).toHaveLength(1)
      expect(responses[0].status).toBe(200)

      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody.addProfiles).toHaveLength(1)
      expect(requestBody.addProfiles[0]).toEqual({
        email: 'ip-test@example.com',
        ip_address: '192.168.1.1'
      })
    })

    it('should handle batch sync with multiple payloads', async () => {
      const baseUrlParts = new URL(BASE_URL)
      nock(baseUrlParts.origin).post(`/${API_VERSION}/webhooks/twilio/audience/sync`).reply(200, { success: true })

      const settings = {
        advertiserId: 'test-advertiser-id',
        authToken: 'test-auth-token'
      }

      const events = [
        createTestEvent({
          traits: {
            email: 'add@example.com',
            'Test Audience': true
          }
        }),
        createTestEvent({
          traits: {
            email: 'remove@example.com',
            'Test Audience': false
          }
        })
      ]

      const mapping = {
        email: {
          '@if': {
            exists: { '@path': '$.traits.email' },
            then: { '@path': '$.traits.email' },
            else: { '@path': '$.properties.email' }
          }
        },
        audience_name: 'Test Audience',
        audience_id: 'test-audience-id',
        traits_or_props: {
          '@if': {
            exists: { '@path': '$.properties' },
            then: { '@path': '$.properties' },
            else: { '@path': '$.traits' }
          }
        },
        enable_batching: true,
        batch_size: 1000,
        batch_keys: ['audience_id', 'audience_name']
      }

      const responses = await testDestination.testBatchAction('sync', {
        events,
        mapping,
        settings
      })

      expect(responses).toHaveLength(1)
      expect(responses[0].status).toBe(200)

      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody.advertiserId).toBe('test-advertiser-id')
    })

    it('should handle batch sync with personal information', async () => {
      const baseUrlParts = new URL(BASE_URL)
      nock(baseUrlParts.origin).post(`/${API_VERSION}/webhooks/twilio/audience/sync`).reply(200, { success: true })

      const settings = {
        advertiserId: 'test-advertiser-id',
        authToken: 'test-auth-token'
      }

      const events = [
        createTestEvent({
          traits: {
            email: 'john.smith@example.com',
            first_name: 'John',
            last_name: 'Smith',
            phone: '+1234567890',
            'Test Audience': true
          }
        }),
        createTestEvent({
          traits: {
            email: 'jane.doe@example.com',
            first_name: 'Jane',
            last_name: 'Doe',
            'Test Audience': false
          }
        }),
        createTestEvent({
          traits: {
            email: 'bob.wilson@example.com',
            phone: '+9876543210',
            'Test Audience': true
          }
        })
      ]

      const mapping = {
        email: {
          '@path': '$.traits.email'
        },
        audience_name: 'Test Audience',
        audience_id: 'test-audience-id',
        traits_or_props: {
          '@path': '$.traits'
        },
        personal_information: {
          first_name: {
            '@path': '$.traits.first_name'
          },
          last_name: {
            '@path': '$.traits.last_name'
          },
          phone: {
            '@path': '$.traits.phone'
          }
        },
        enable_batching: true,
        batch_size: 1000,
        batch_keys: ['audience_id', 'audience_name']
      }

      const responses = await testDestination.testBatchAction('sync', {
        events,
        mapping,
        settings
      })

      expect(responses).toHaveLength(1)
      expect(responses[0].status).toBe(200)

      // Verify the request body contains proper profile details
      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody.advertiserId).toBe('test-advertiser-id')

      // Check add profiles (users with audience = true)
      expect(requestBody.addProfiles).toHaveLength(2)
      expect(requestBody.addProfiles).toEqual([
        {
          email: 'john.smith@example.com',
          profileDetails: {
            first_name: 'John',
            last_name: 'Smith',
            phone: '+1234567890'
          }
        },
        {
          email: 'bob.wilson@example.com',
          profileDetails: {
            phone: '+9876543210'
          }
        }
      ])

      // Check remove profiles (users with audience = false)
      expect(requestBody.removeProfiles).toHaveLength(1)
      expect(requestBody.removeProfiles).toEqual([
        {
          email: 'jane.doe@example.com',
          profileDetails: {
            first_name: 'Jane',
            last_name: 'Doe'
          }
        }
      ])
    })

    it('should handle batch sync with ip_address', async () => {
      const baseUrlParts = new URL(BASE_URL)
      nock(baseUrlParts.origin).post(`/${API_VERSION}/webhooks/twilio/audience/sync`).reply(200, { success: true })

      const settings = {
        advertiserId: 'test-advertiser-id',
        authToken: 'test-auth-token'
      }

      const events = [
        createTestEvent({
          context: { ip: '10.0.0.1' },
          traits: {
            email: 'user1@example.com',
            'Test Audience': true
          }
        }),
        createTestEvent({
          context: { ip: '10.0.0.2' },
          traits: {
            email: 'user2@example.com',
            'Test Audience': false
          }
        }),
        createTestEvent({
          traits: {
            email: 'user3@example.com',
            'Test Audience': true
          }
        })
      ]

      const mapping = {
        email: {
          '@path': '$.traits.email'
        },
        ip_address: {
          '@path': '$.context.ip'
        },
        audience_name: 'Test Audience',
        audience_id: 'test-audience-id',
        traits_or_props: {
          '@path': '$.traits'
        },
        enable_batching: true,
        batch_size: 1000,
        batch_keys: ['audience_id', 'audience_name']
      }

      const responses = await testDestination.testBatchAction('sync', {
        events,
        mapping,
        settings
      })

      expect(responses).toHaveLength(1)
      expect(responses[0].status).toBe(200)

      const requestBody = JSON.parse(responses[0].options.body as string)

      // user1 and user3 are add profiles; user1 has explicit IP, user3 gets default from createTestEvent
      expect(requestBody.addProfiles).toHaveLength(2)
      expect(requestBody.addProfiles[0]).toEqual({
        email: 'user1@example.com',
        ip_address: '10.0.0.1'
      })
      expect(requestBody.addProfiles[1].email).toBe('user3@example.com')

      // user2 (remove) has IP
      expect(requestBody.removeProfiles).toHaveLength(1)
      expect(requestBody.removeProfiles[0]).toEqual({
        email: 'user2@example.com',
        ip_address: '10.0.0.2'
      })
    })
  })
})
