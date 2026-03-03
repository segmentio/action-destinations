/**
 * Identify User Action Tests
 *
 * Tests the identifyUser action for creating/updating contacts in Collab Travel CRM
 */

import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const COLLAB_CRM_BASE_URL = 'https://wvjaseexkfrcahmzfxkl.supabase.co/functions/v1'

describe('identifyUser', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should send identify event with all fields', async () => {
    nock(COLLAB_CRM_BASE_URL)
      .post('/segment-destination', (body) => {
        expect(body.type).toBe('identify')
        expect(body.userId).toBe('user-123')
        expect(body.traits.email).toBe('john.doe@example.com')
        expect(body.traits.firstName).toBe('John')
        expect(body.traits.lastName).toBe('Doe')
        expect(body.traits.phone).toBe('+1-555-0100')
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      userId: 'user-123',
      traits: {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-0100'
      }
    })

    const responses = await testDestination.testAction('identifyUser', {
      event,
      settings: { apiKey: 'test-api-key' },
      mapping: {
        email: { '@path': '$.traits.email' },
        firstName: { '@path': '$.traits.firstName' },
        lastName: { '@path': '$.traits.lastName' },
        phone: { '@path': '$.traits.phone' },
        userId: { '@path': '$.userId' },
        traits: { '@path': '$.traits' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should send identify event with only required email field', async () => {
    nock(COLLAB_CRM_BASE_URL)
      .post('/segment-destination', (body) => {
        expect(body.type).toBe('identify')
        expect(body.traits.email).toBe('minimal@example.com')
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      traits: {
        email: 'minimal@example.com'
      }
    })

    const responses = await testDestination.testAction('identifyUser', {
      event,
      settings: { apiKey: 'test-api-key' },
      mapping: {
        email: 'minimal@example.com'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should fail when email is missing', async () => {
    const event = createTestEvent({
      type: 'identify',
      traits: {
        firstName: 'John',
        lastName: 'Doe'
      }
    })

    await expect(
      testDestination.testAction('identifyUser', {
        event,
        settings: { apiKey: 'test-api-key' },
        mapping: {
          firstName: { '@path': '$.traits.firstName' },
          lastName: { '@path': '$.traits.lastName' }
        }
      })
    ).rejects.toThrow()
  })

  it('should merge additional traits correctly', async () => {
    const additionalTraits = {
      email: 'traveler@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      company: 'Acme Travel',
      preferredDestinations: ['Europe', 'Caribbean'],
      lifetimeValue: 25000
    }

    nock(COLLAB_CRM_BASE_URL)
      .post('/segment-destination', (body) => {
        expect(body.traits.email).toBe('traveler@example.com')
        expect(body.traits.firstName).toBe('Jane')
        expect(body.traits.lastName).toBe('Smith')
        expect(body.traits.company).toBe('Acme Travel')
        expect(body.traits.preferredDestinations).toEqual(['Europe', 'Caribbean'])
        expect(body.traits.lifetimeValue).toBe(25000)
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      traits: additionalTraits
    })

    const responses = await testDestination.testAction('identifyUser', {
      event,
      settings: { apiKey: 'test-api-key' },
      mapping: {
        email: { '@path': '$.traits.email' },
        firstName: { '@path': '$.traits.firstName' },
        lastName: { '@path': '$.traits.lastName' },
        traits: { '@path': '$.traits' }
      }
    })

    expect(responses[0].status).toBe(200)
  })

  it('should include Authorization header in request', async () => {
    nock(COLLAB_CRM_BASE_URL)
      .post('/segment-destination')
      .matchHeader('Authorization', 'Bearer secure-api-key')
      .matchHeader('Content-Type', 'application/json')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      traits: {
        email: 'test@example.com'
      }
    })

    const responses = await testDestination.testAction('identifyUser', {
      event,
      settings: { apiKey: 'secure-api-key' },
      mapping: {
        email: 'test@example.com'
      }
    })

    expect(responses[0].status).toBe(200)
  })

  it('should handle server errors gracefully', async () => {
    nock(COLLAB_CRM_BASE_URL).post('/segment-destination').reply(500, { error: 'Internal Server Error' })

    const event = createTestEvent({
      type: 'identify',
      traits: {
        email: 'error@example.com'
      }
    })

    await expect(
      testDestination.testAction('identifyUser', {
        event,
        settings: { apiKey: 'test-api-key' },
        mapping: {
          email: 'error@example.com'
        }
      })
    ).rejects.toThrow()
  })

  it('should handle 401 unauthorized errors', async () => {
    nock(COLLAB_CRM_BASE_URL).post('/segment-destination').reply(401, { error: 'Unauthorized' })

    const event = createTestEvent({
      type: 'identify',
      traits: {
        email: 'unauthorized@example.com'
      }
    })

    await expect(
      testDestination.testAction('identifyUser', {
        event,
        settings: { apiKey: 'invalid-key' },
        mapping: {
          email: 'unauthorized@example.com'
        }
      })
    ).rejects.toThrow()
  })

  it('should send correct endpoint URL', async () => {
    nock(COLLAB_CRM_BASE_URL).post('/segment-destination').reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      traits: {
        email: 'url-test@example.com'
      }
    })

    const responses = await testDestination.testAction('identifyUser', {
      event,
      settings: { apiKey: 'test-api-key' },
      mapping: {
        email: 'url-test@example.com'
      }
    })

    expect(responses[0].url).toBe(`${COLLAB_CRM_BASE_URL}/segment-destination`)
  })

  it('should handle complex nested traits', async () => {
    const complexTraits = {
      email: 'complex@example.com',
      firstName: 'Complex',
      lastName: 'User',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA'
      },
      preferences: {
        travelStyle: ['luxury', 'adventure'],
        dietaryRestrictions: ['vegetarian'],
        seatPreference: 'window'
      }
    }

    nock(COLLAB_CRM_BASE_URL)
      .post('/segment-destination', (body) => {
        expect(body.traits.address).toMatchObject(complexTraits.address)
        expect(body.traits.preferences).toMatchObject(complexTraits.preferences)
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      traits: complexTraits
    })

    const responses = await testDestination.testAction('identifyUser', {
      event,
      settings: { apiKey: 'test-api-key' },
      mapping: {
        email: { '@path': '$.traits.email' },
        firstName: { '@path': '$.traits.firstName' },
        lastName: { '@path': '$.traits.lastName' },
        traits: { '@path': '$.traits' }
      }
    })

    expect(responses[0].status).toBe(200)
  })

  it('should handle email validation format', async () => {
    nock(COLLAB_CRM_BASE_URL).post('/segment-destination').reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      traits: {
        email: 'valid.email+tag@subdomain.example.com'
      }
    })

    const responses = await testDestination.testAction('identifyUser', {
      event,
      settings: { apiKey: 'test-api-key' },
      mapping: {
        email: { '@path': '$.traits.email' }
      }
    })

    expect(responses[0].status).toBe(200)
  })
})
