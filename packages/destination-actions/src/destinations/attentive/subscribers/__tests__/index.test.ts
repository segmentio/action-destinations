import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent, PayloadValidationError } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'

const settings: Settings = {
  apiKey: 'test-api-key'
}

const validPayload = {
  timestamp: timestamp,
  event: 'Identify Event',
  messageId: '123e4567-e89b-12d3-a456-426614174000',
  type: 'track',
  userId: '123e4567-e89b-12d3-a456-426614174000',
  context: {
    traits: {
      phone: '+3538675765689',
      email: 'test@test.com'
    }
  },
  properties: {} // No properties for subscription
} as Partial<SegmentEvent>

const mapping = {
  userIdentifiers: {
    phone: { '@path': '$.context.traits.phone' },
    email: { '@path': '$.context.traits.email' }
  },
  subscriptionType: 'MARKETING',
  locale: { language: 'en', country: 'US' }
}

const expectedPayload = {
  user: {
    phone: '+3538675765689',
    email: 'test@test.com'
  },
  subscriptionType: 'MARKETING',
  locale: {
    language: 'en',
    country: 'US'
  }
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('Attentive.subscribers', () => {
  it('should send a subscription request to Attentive', async () => {
    const event = createTestEvent(validPayload)

    // Mock the correct API endpoint and response for subscriptions
    nock('https://api.attentivemobile.com', {
      reqheaders: {
        authorization: 'Bearer test-api-key',
        'content-type': 'application/json',
        'user-agent': 'Segment (Actions)'
      }
    })
      .post('/v1/subscriptions', expectedPayload)
      .reply(200, {})

    // Test sending the subscription request
    const responses = await testDestination.testAction('subscribers', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should throw error if no user identifiers provided', async () => {
    const badPayload = {
      ...validPayload
    }
    delete badPayload?.context?.traits?.phone
    delete badPayload?.context?.traits?.email

    const event = createTestEvent(badPayload)

    await expect(
      testDestination.testAction('subscribers', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError(new PayloadValidationError('At least one user identifier (phone or email) is required.'))
  })

  it('should not throw error if only one identifier is provided', async () => {
    const partialPayload = {
      ...validPayload,
      context: {
        traits: {
          phone: '+3538675765689'
        }
      }
    }

    const event = createTestEvent(partialPayload)

    // Mock the correct API endpoint and response for subscriptions with only phone
    nock('https://api.attentivemobile.com', {
      reqheaders: {
        authorization: 'Bearer test-api-key',
        'content-type': 'application/json',
        'user-agent': 'Segment (Actions)'
      }
    })
      .post('/v1/subscriptions', {
        user: {
          phone: '+3538675765689'
        },
        subscriptionType: 'MARKETING',
        locale: {
          language: 'en',
          country: 'US'
        }
      })
      .reply(200, {})

    // Test sending the subscription request with only phone
    const responses = await testDestination.testAction('subscribers', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
