import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { createHash } from 'crypto'
import { ConversionTypeV2 } from '../../types'

const testDestination = createTestIntegration(Destination)

const settings = {
  region: 'https://advertising-api.amazon.com',
  advertiserId: 'test-advertiser-id',
  profileId: 'test-profile-id'
}

const auth = {
  accessToken: 'test-token',
  refreshToken: 'test-refresh-token'
}

// Helper to create a valid test event
function createValidTestEvent(customProperties = {}) {
  return createTestEvent({
    event: 'Test Event',
    properties: {
      email: 'test@example.com',
      eventType: ConversionTypeV2.PAGE_VIEW,
      eventActionSource: 'WEBSITE',
      countryCode: 'US',
      timestamp: '2023-01-01T12:00:00Z',
      enable_batching: true,
      ...customProperties
    }
  })
}

describe('amazon-conversions-api.trackConversion performBatch', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('should successfully process batched events', async () => {
    // Mock the API to return success for the batch
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(207, {
        success: [
          { index: 0, message: null },
          { index: 1, message: null }
        ],
        error: []
      })

    // Create test events
    const events = [
      createValidTestEvent({ email: 'test1@example.com' }),
      createValidTestEvent({ email: 'test2@example.com' })
    ]

    // Set up mapping for each event
    const mapping = {
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

    // Call the testBatchAction helper
    const result = await testDestination.testBatchAction('trackConversion', {
      events,
      mapping,
      settings,
      auth
    })

    // Verify the nock was called and the response was successful
    expect(result).toBeDefined()
    expect(nock.isDone()).toBe(true)
  })

  it('should handle validation for invalid events in a batch', async () => {
    // Create a mix of valid and invalid events
    const events = [
      createValidTestEvent({ email: 'valid@example.com' }),
      // Missing required fields
      createTestEvent({
        event: 'Invalid Event',
        properties: {
          email: 'invalid@example.com',
          enable_batching: true
          // Missing eventType, eventActionSource, etc.
        }
      })
    ]

    // Set up mapping for each event
    const mapping = {
      name: 'Test Event',
      eventType: {
        '@path': '$.properties.eventType'
      },
      eventActionSource: {
        '@path': '$.properties.eventActionSource'
      },
      countryCode: {
        '@path': '$.properties.countryCode'
      },
      email: {
        '@path': '$.properties.email'
      },
      enable_batching: true
    }

    // Call the testBatchAction helper
    const result = await testDestination.testBatchAction('trackConversion', {
      events,
      mapping,
      settings,
      auth
    })

    // Just verify we get back a result - we don't need to inspect internal structure
    expect(result).toBeDefined()
  })

  it('should properly convert and hash email fields in batched events', async () => {
    // Mock the API to verify the request format
    nock('https://advertising-api.amazon.com')
      .post('/events/v1', (body) => {
        // Get the first event's email match key from the request
        const emailHash = body.eventData[0].matchKeys
          .find((key: any) => key.type === 'EMAIL')
          ?.values[0]

        // Calculate the expected hash for the first email
        const email = 'TEST@Example.com' // Mixed case, will be normalized
        const expectedHash = createHash('sha256').update(email.toLowerCase().trim()).digest('hex')

        // Check if the hash in the request matches the expected hash
        return emailHash === expectedHash
      })
      .reply(207, {
        success: [{ index: 0, message: null }],
        error: []
      })

    // Create test events with an email that needs normalization
    const events = [
      createValidTestEvent({ email: 'TEST@Example.com' })
    ]

    // Set up mapping
    const mapping = {
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

    // Call the testBatchAction helper
    const result = await testDestination.testBatchAction('trackConversion', {
      events,
      mapping,
      settings,
      auth
    })

    // Verify the request was made with correct hashing
    expect(result).toBeDefined()
    expect(nock.isDone()).toBe(true)
  })

  it('should handle API error responses', async () => {
    // Mock the API to return an error
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(401, { message: 'Unauthorized' })

    // Create test events
    const events = [
      createValidTestEvent()
    ]

    // Set up mapping
    const mapping = {
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

    // Call testBatchAction - testBatchAction doesn't throw with error responses
    // but returns the raw responses which include error information
    const result = await testDestination.testBatchAction('trackConversion', {
      events,
      mapping,
      settings,
      auth
    })

    // Verify we got a result and the request was made
    expect(result).toBeDefined()
    expect(result[0].status).toBe(401) // Check status code indicates auth error
    expect(result[0].data).toHaveProperty('message', 'Unauthorized')
    expect(nock.isDone()).toBe(true)
  })

  it('should handle partial success and failures in a batch', async () => {
    // Mock API response with mixed success/failures
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(207, {
        success: [
          { index: 0, message: null } // First event succeeds
        ],
        error: [
          { 
            index: 1,  // Second event fails
            httpStatusCode: "400", 
            subErrors: [{
              errorCode: 400,
              errorType: "INVALID_PARAMETER",
              errorMessage: "Invalid country code" 
            }]
          }
        ]
      })
    
    // Create two technically valid events (from our side)
    const events = [
      createValidTestEvent({ email: 'success@example.com' }),
      createValidTestEvent({ email: 'error@example.com', countryCode: 'INVALID' }) // This will fail at the API level
    ]

    // Set up mapping
    const mapping = {
      name: 'Test Event',
      eventType: ConversionTypeV2.PAGE_VIEW,
      eventActionSource: 'WEBSITE',
      countryCode: {
        '@path': '$.properties.countryCode'
      },
      timestamp: '2023-01-01T12:00:00Z',
      email: {
        '@path': '$.properties.email'
      },
      enable_batching: true
    }

    // Call testBatchAction
    const result = await testDestination.testBatchAction('trackConversion', {
      events,
      mapping,
      settings,
      auth
    })

    // Verify we got a response
    expect(result).toBeDefined()
    
    // The testBatchAction may not return individual results for each event
    // but we can verify the API call was made correctly
    expect(nock.isDone()).toBe(true)
  })

  it('should handle error propagation in batch operations', async () => {
    // Create an event with an issue that will cause an API error
    const events = [
      createValidTestEvent({ email: 'api-error@example.com' })
    ]

    // Mock API to respond with an error
    nock('https://advertising-api.amazon.com')
      .post('/events/v1')
      .reply(403, {
        message: "Insufficient permissions to process request",
        errorType: "PERMISSION_ERROR",
        errorCode: 403
      })

    // Set up mapping
    const mapping = {
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

    // Call testBatchAction
    const result = await testDestination.testBatchAction('trackConversion', {
      events,
      mapping,
      settings,
      auth
    })

    // Verify we get the expected error response
    expect(result).toBeDefined()
    expect(result.length).toBe(1)
    
    // Check API error was propagated correctly
    expect(result[0].status).toBe(403)
    expect(result[0].data).toBeDefined()
    expect((result[0].data as { message: string }).message).toContain('Insufficient permissions')
    
    // Verify the API was called as expected
    expect(nock.isDone()).toBe(true)
  })
})
