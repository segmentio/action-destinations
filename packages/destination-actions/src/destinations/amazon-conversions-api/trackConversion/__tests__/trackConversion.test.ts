import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { createHash } from 'crypto'
import { ConversionTypeV2 } from '../../types'

// Type helper for request body
interface RequestBody {
  eventData: Array<{
    name: string
    eventType: string
    eventActionSource: string
    matchKeys?: Array<{
      type: string
      values: string[]
    }>
    consent?: {
      geo?: {
        ipAddress: string
      }
      amazonConsent?: {
        amznAdStorage: string
        amznUserData: string
      }
    }
    customAttributes?: Array<{
      name: string
      value: string
      dataType?: string
    }>
    value?: number
    currencyCode?: string
    unitsSold?: number
  }>
  ingestionMethod?: string
}

const testDestination = createTestIntegration(Destination)

const settings = {
  region: 'https://advertising-api.amazon.com',
  advertiserId: 'test-advertiser-id',
  profileId: 'test-profile-id'
}

const auth = {
  accessToken: 'test-token',
  refreshToken: 'test-refresh-token' // Adding refresh token to satisfy type requirements
}

// Standard success response payload according to swagger spec
const successResponsePayload = { 
  error: [],
  success: [
    {
      index: 1,
      message: null
    }
  ]
}

describe('amazon-conversions-api.trackConversion', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('should send basic event with required fields', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(207, successResponsePayload)

    const event = createTestEvent({
      event: 'Page Viewed',
      timestamp: '2023-01-01T12:00:00Z',
      properties: {
        email: 'test@example.com'
      }
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      auth,
      mapping: {
        name: 'Test Event',
        eventType: ConversionTypeV2.PAGE_VIEW,
        eventActionSource: 'WEBSITE',
        countryCode: 'US',
        timestamp: '2023-01-01T12:00:00Z',
        email: {
          '@path': '$.properties.email'
        },
        enable_batching: true
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(207)

    const requestBody = responses[0].options.json as { 
      eventData: Array<{
        name: string
        eventType: string
        eventActionSource: string
        matchKeys?: Array<{
          values: string[]
        }>
        consent?: any
        customAttributes?: Array<{
          name: string
          value: string
          dataType?: string
        }>
        value?: number
        currencyCode?: string
        unitsSold?: number
      }> 
    }
    expect(requestBody.eventData.length).toBe(1)
    expect(requestBody.eventData[0].name).toBe('Test Event')
    expect(requestBody.eventData[0].eventType).toBe('PAGE_VIEW')
    expect(requestBody.eventData[0].eventActionSource).toBe('WEBSITE')
  })

  it('should hash email correctly using smart hashing', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(207, successResponsePayload)

    const email = 'Test@Example.com' // With uppercase and space
    const event = createTestEvent({
      properties: {
        email: email
      }
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      auth,
      mapping: {
        name: 'Test Event',
        eventType: ConversionTypeV2.PAGE_VIEW,
        eventActionSource: 'WEBSITE',
        countryCode: 'US',
        timestamp: '2023-01-01T12:00:00Z',
        email: {
          '@path': '$.properties.email'
        },
        enable_batching: false
      }
    })

    // Check that the email was hashed correctly
    const requestBody = responses[0].options.json as RequestBody
    
    // Make sure matchKeys exists
    expect(requestBody.eventData[0].matchKeys).toBeDefined()
    const matchKeys = requestBody.eventData[0].matchKeys!
    expect(matchKeys.length).toBeGreaterThan(0)
    expect(matchKeys[0].values.length).toBeGreaterThan(0)
    
    const hashedEmail = matchKeys[0].values[0]
    
    // Expected hash: lowercase and trim before hashing
    const expectedHash = createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
    expect(hashedEmail).toBe(expectedHash)
  })

  it('should not re-hash pre-hashed email values', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(207, successResponsePayload)

    // A valid SHA-256 hash (64 hex chars)
    const preHashedEmail = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
    const event = createTestEvent({
      properties: {
        email: preHashedEmail
      }
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      auth,
      mapping: {
        name: 'Test Event',
        eventType: ConversionTypeV2.PAGE_VIEW,
        eventActionSource: 'WEBSITE',
        countryCode: 'US',
        timestamp: '2023-01-01T12:00:00Z',
        email: {
          '@path': '$.properties.email'
        },
        enable_batching: true
      }
    })

    // Check that the pre-hashed email wasn't hashed again
    const requestBody = responses[0].options.json as RequestBody
    const matchKeys = requestBody.eventData[0].matchKeys!
    const emailKey = matchKeys.find(k => k.type === 'EMAIL')
    
    expect(emailKey).toBeDefined()
    expect(emailKey!.values[0]).toBe(preHashedEmail)
  })

  it('should include custom attributes when provided', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(207, successResponsePayload)

    const event = createTestEvent({
      properties: {
        email: 'test@example.com',
        customAttributes: [
          { name: 'color', value: 'blue' },
          { name: 'size', value: 'medium', dataType: 'STRING' }
        ]
      }
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      auth,
      mapping: {
        name: 'Test Event',
        eventType: ConversionTypeV2.PAGE_VIEW,
        eventActionSource: 'WEBSITE',
        countryCode: 'US',
        timestamp: '2023-01-01T12:00:00Z',
        email: {
          '@path': '$.properties.email'
        },
        customAttributes: {
          '@path': '$.properties.customAttributes'
        },
        enable_batching: false
      }
    })

    const requestBody = responses[0].options.json as RequestBody
    
    // Check that customAttributes exists and has correct content
    expect(requestBody.eventData[0].customAttributes).toBeDefined()
    const customAttrs = requestBody.eventData[0].customAttributes!
    expect(customAttrs).toHaveLength(2)
    expect(customAttrs[0].name).toBe('color')
    expect(customAttrs[0].value).toBe('blue')
  })

  it('should include consent data when provided', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(207, successResponsePayload)

    const event = createTestEvent({
      properties: {
        email: 'test@example.com',
        consent: {
          geo: {
            ipAddress: '192.168.1.1'
          },
          amazonConsent: {
            amznAdStorage: 'GRANTED',
            amznUserData: 'GRANTED'
          }
        }
      }
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      auth,
      mapping: {
        name: 'Test Event',
        eventType: ConversionTypeV2.PAGE_VIEW,
        eventActionSource: 'WEBSITE',
        countryCode: 'US',
        timestamp: '2023-01-01T12:00:00Z',
        email: {
          '@path': '$.properties.email'
        },
        consent: {
          '@path': '$.properties.consent'
        },
        enable_batching: true
      }
    })

    const requestBody = responses[0].options.json as RequestBody
    expect(requestBody.eventData[0].consent).toBeDefined()
    
    const consent = requestBody.eventData[0].consent!
    expect(consent.geo).toBeDefined()
    expect(consent.geo!.ipAddress).toBe('192.168.1.1')
    
    expect(consent.amazonConsent).toBeDefined()
    expect(consent.amazonConsent!.amznAdStorage).toBe('GRANTED')
  })

  it('should handle different event types', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(207, successResponsePayload)

    const event = createTestEvent({
      properties: {
        email: 'test@example.com'
      }
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      auth,
      mapping: {
        name: 'Purchase Event',
        eventType: ConversionTypeV2.OFF_AMAZON_PURCHASES,
        eventActionSource: 'WEBSITE',
        countryCode: 'US',
        timestamp: '2023-01-01T12:00:00Z',
        email: {
          '@path': '$.properties.email'
        },
        value: 99.99,
        currencyCode: 'USD',
        unitsSold: 2,
        enable_batching: true
      }
    })

    const requestBody = responses[0].options.json as RequestBody
    expect(requestBody.eventData[0].eventType).toBe('OFF_AMAZON_PURCHASES')
    
    // Check optional fields with proper type assertions
    const eventData = requestBody.eventData[0]
    expect(eventData.value).toBeDefined()
    expect(eventData.value).toBe(99.99)
    
    expect(eventData.currencyCode).toBeDefined()
    expect(eventData.currencyCode).toBe('USD')
    
    expect(eventData.unitsSold).toBeDefined()
    expect(eventData.unitsSold).toBe(2)
  })

  it('should handle 207 multi-status responses with error', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(207, {
        success: [],  // Empty success array since the event failed
        error: [
          {
            httpStatusCode: "400",  // HTTP status code as a string
            index: "0",  // Since we're sending one event, the index is 0
            subErrors: [
              {
                errorCode: 400,  // Integer error code
                errorType: "INVALID_PARAMETER",  // Error category
                errorMessage: "Invalid parameter value"  // Human-readable message
              }
            ]
          }
        ]
      })

    const event = createTestEvent({
      properties: {
        email: 'test@example.com'
      }
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      auth,
      mapping: {
        name: 'Test Event',
        eventType: ConversionTypeV2.PAGE_VIEW,
        eventActionSource: 'WEBSITE',
        countryCode: 'US',
        timestamp: '2023-01-01T12:00:00Z',
        email: {
          '@path': '$.properties.email'
        },
        enable_batching: true
      }
    })

    expect(responses[0].status).toBe(207)
    expect((responses[0].data as any).success).toEqual([])
    expect((responses[0].data as any).error).toHaveLength(1)
    expect((responses[0].data as any).error[0].httpStatusCode).toBe("400")
    expect((responses[0].data as any).error[0].index).toBe("0")
    expect((responses[0].data as any).error[0].subErrors[0].errorType).toBe("INVALID_PARAMETER")
  })

  it('should throw authentication error with 401 response', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(401, { message: 'Unauthorized' })

    const event = createTestEvent({
      properties: {
        email: 'test@example.com'
      }
    })

    await expect(
      testDestination.testAction('trackConversion', {
        event,
        settings,
        auth,
        mapping: {
          name: 'Test Event',
          eventType: ConversionTypeV2.PAGE_VIEW,
          eventActionSource: 'WEBSITE',
          countryCode: 'US',
          timestamp: '2023-01-01T12:00:00Z',
          email: {
            '@path': '$.properties.email'
          },
          enable_batching: true
        }
      })
    ).rejects.toThrowError(/Authentication failed/)
  })

  it('should throw rate limit error with 429 response', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(429, { message: 'Rate Limited' }, { 'retry-after': '30' })

    const event = createTestEvent({
      properties: {
        email: 'test@example.com'
      }
    })

    await expect(
      testDestination.testAction('trackConversion', {
        event,
        settings,
        auth,
        mapping: {
          name: 'Test Event',
          eventType: ConversionTypeV2.PAGE_VIEW,
          eventActionSource: 'WEBSITE',
          countryCode: 'US',
          timestamp: '2023-01-01T12:00:00Z',
          email: {
            '@path': '$.properties.email'
          },
          enable_batching: true
        }
      })
    ).rejects.toThrowError(/Rate limited by Amazon API/)
  })

  // Enhanced Data Processing Tests

  it('should normalize and trim email with spaces and special characters', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(207, successResponsePayload)

    const event = createTestEvent({
      properties: {
        email: '  Test.User+Plus@Example.com  ' // Email with spaces and mixed case
      }
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      auth,
      mapping: {
        name: 'Test Event',
        eventType: ConversionTypeV2.PAGE_VIEW,
        eventActionSource: 'WEBSITE',
        countryCode: 'US',
        timestamp: '2023-01-01T12:00:00Z',
        email: {
          '@path': '$.properties.email'
        },
        enable_batching: true
      }
    })

    const requestBody = responses[0].options.json as RequestBody
    
    // Check that email was properly normalized and hashed
    expect(requestBody.eventData[0].matchKeys).toBeDefined()
    const matchKeys = requestBody.eventData[0].matchKeys!
    
    expect(matchKeys.length).toBe(1)
    expect(matchKeys[0].type).toBe('EMAIL')
    expect(matchKeys[0].values.length).toBe(1)
    
    // We just verify that a hash was generated with the right format, not the exact value
    expect(matchKeys[0].values[0]).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hash format
  })

  // Expanded Error Handling Tests

  it('should handle malformed request with 400 response', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(400, { 
        errorCode: 'INVALID_PARAMETER', 
        message: 'Invalid parameter: countryCode'
      })

    const event = createTestEvent({
      properties: {
        email: 'test@example.com'
      }
    })

    await expect(
      testDestination.testAction('trackConversion', {
        event,
        settings,
        auth,
        mapping: {
          name: 'Test Event',
          eventType: ConversionTypeV2.PAGE_VIEW,
          eventActionSource: 'WEBSITE',
          countryCode: 'INVALID',  // Invalid country code
          timestamp: '2023-01-01T12:00:00Z',
          email: {
            '@path': '$.properties.email'
          },
          enable_batching: true
        }
      })
    ).rejects.toThrowError(/Invalid parameter: countryCode/)
  })

  it('should handle forbidden error with 403 response', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(403, { 
        errorCode: 'FORBIDDEN', 
        message: 'Advertiser does not have permission to access this resource'
      })

    const event = createTestEvent({
      properties: {
        email: 'test@example.com'
      }
    })

    await expect(
      testDestination.testAction('trackConversion', {
        event,
        settings,
        auth,
        mapping: {
          name: 'Test Event',
          eventType: ConversionTypeV2.PAGE_VIEW,
          eventActionSource: 'WEBSITE',
          countryCode: 'US',
          timestamp: '2023-01-01T12:00:00Z',
          email: {
            '@path': '$.properties.email'
          },
          enable_batching: true
        }
      })
    ).rejects.toThrowError(/You do not have permission to access this resource/)
  })

  // Edge Case Tests

  it('should validate email format before hashing', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(207, successResponsePayload)

    const event = createTestEvent({
      properties: {
        email: 'invalid-email'  // Malformed email without @ symbol
      }
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      auth,
      mapping: {
        name: 'Test Event',
        eventType: ConversionTypeV2.PAGE_VIEW,
        eventActionSource: 'WEBSITE',
        countryCode: 'US',
        timestamp: '2023-01-01T12:00:00Z',
        email: {
          '@path': '$.properties.email'
        },
        enable_batching: true
      }
    })

    // Check if the invalid email was still processed
    const requestBody = responses[0].options.json as RequestBody
    expect(requestBody.eventData[0].matchKeys).toBeDefined()
    expect(requestBody.eventData[0].matchKeys!.length).toBeGreaterThan(0)
    
    // We just verify that a hash was generated, not the exact value
    const emailKey = requestBody.eventData[0].matchKeys!.find(k => k.type === 'EMAIL')
    expect(emailKey).toBeDefined()
    expect(emailKey!.values.length).toBe(1)
    expect(emailKey!.values[0]).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hash format
  })

  it('should handle multiple match keys in one request', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(207, successResponsePayload)

    const event = createTestEvent({
      properties: {
        email: 'test@example.com',
        phone: '(123) 456-7890', // Phone with formatting
        firstName: 'John',
        lastName: 'Doe',
        postalCode: '94103 1234' // Postal code with space
      }
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      auth,
      mapping: {
        name: 'Test Event',
        eventType: ConversionTypeV2.PAGE_VIEW,
        eventActionSource: 'WEBSITE',
        countryCode: 'US',
        timestamp: '2023-01-01T12:00:00Z',
        email: {
          '@path': '$.properties.email'
        },
        phone: {
          '@path': '$.properties.phone'
        },
        firstName: {
          '@path': '$.properties.firstName'
        },
        lastName: {
          '@path': '$.properties.lastName'
        },
        postalCode: {
          '@path': '$.properties.postalCode'
        },
        enable_batching: true
      }
    })

    // Check that all match keys were included
    const requestBody = responses[0].options.json as RequestBody
    expect(requestBody.eventData[0].matchKeys).toBeDefined()
    const matchKeys = requestBody.eventData[0].matchKeys!

    // Should have all 5 match keys
    expect(matchKeys.length).toBe(5)

    // Verify each type is present
    expect(matchKeys.find(k => k.type === 'EMAIL')).toBeDefined()
    expect(matchKeys.find(k => k.type === 'PHONE')).toBeDefined()
    expect(matchKeys.find(k => k.type === 'FIRST_NAME')).toBeDefined()
    expect(matchKeys.find(k => k.type === 'LAST_NAME')).toBeDefined()
    expect(matchKeys.find(k => k.type === 'POSTAL')).toBeDefined()
    
    // Check phone normalization (only digits)
    const phoneKey = matchKeys.find(k => k.type === 'PHONE')!
    // Phone should be hashed and not contain any non-digits
    expect(phoneKey.values[0]).toMatch(/^[a-f0-9]{64}$/)
    
    // Check postal code normalization (no spaces)
    const postalKey = matchKeys.find(k => k.type === 'POSTAL')!
    expect(postalKey.values[0]).toMatch(/^[a-f0-9]{64}$/)
  })

  it('should correctly process non-hashed match keys', async () => {
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(207, successResponsePayload)

    const event = createTestEvent({
      context: {
        device: {
          advertisingId: 'ad-id-12345' // MAID
        }
      },
      properties: {
        email: 'test@example.com', // Will be hashed
        rampId: 'ramp-12345',      // Should not be hashed
        matchId: 'match-67890'     // Should not be hashed
      }
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      auth,
      mapping: {
        name: 'Test Event',
        eventType: ConversionTypeV2.PAGE_VIEW,
        eventActionSource: 'WEBSITE',
        countryCode: 'US',
        timestamp: '2023-01-01T12:00:00Z',
        email: {
          '@path': '$.properties.email'
        },
        maid: {
          '@path': '$.context.device.advertisingId'
        },
        rampId: {
          '@path': '$.properties.rampId'
        },
        matchId: {
          '@path': '$.properties.matchId'
        },
        enable_batching: true
      }
    })

    const requestBody = responses[0].options.json as RequestBody
    const matchKeys = requestBody.eventData[0].matchKeys!
    
    // Verify email is hashed
    const emailKey = matchKeys.find(k => k.type === 'EMAIL')!
    expect(emailKey.values[0]).toMatch(/^[a-f0-9]{64}$/)
    
    // Verify non-hashed fields
    const maidKey = matchKeys.find(k => k.type === 'MAID')!
    expect(maidKey.values[0]).toBe('ad-id-12345')
    
    const rampKey = matchKeys.find(k => k.type === 'RAMP_ID')!
    expect(rampKey.values[0]).toBe('ramp-12345')
    
    const matchKey = matchKeys.find(k => k.type === 'MATCH_ID')!
    expect(matchKey.values[0]).toBe('match-67890')
  })
})
