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
  timestamp,
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
  properties: {}
} as Partial<SegmentEvent>

const mapping = {
  userIdentifiers: {
    phone: { '@path': '$.context.traits.phone' },
    email: { '@path': '$.context.traits.email' }
  },
  subscriptionType: 'MARKETING',
  signUpSourceId: 'WEB',
  singleOptIn: false,
  locale: 'en-US'
}

beforeEach(() => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
})

describe('Attentive.subscribeUser', () => {
  it('should send a subscription request to Attentive', async () => {
    const event = createTestEvent(validPayload)

    // Use a function to loosely match the body instead of exact object
    nock('https://api.attentivemobile.com', {
      reqheaders: {
        authorization: 'Bearer test-api-key',
        'content-type': 'application/json',
        'user-agent': 'Segment (Actions)'
      }
    })
      .post('/v1/subscriptions', (body) => {
        // Verify essential fields exist
        return (
          body &&
          body.externalEventId === event.messageId &&
          body.subscriptionType === 'MARKETING' &&
          body.signUpSourceId === 'WEB' &&
          body.singleOptIn === false &&
          (body.locale === 'en-US' || (body.locale.language === 'en' && body.locale.country === 'US')) && // support either format
          body.user &&
          body.user.phone === '+3538675765689' &&
          body.user.email === 'test@test.com'
        )
      })
      .reply(200, {})

    const responses = await testDestination.testAction('subscribeUser', {
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
      ...validPayload,
      context: {
        traits: {}
      }
    }

    const event = createTestEvent(badPayload)

    await expect(
      testDestination.testAction('subscribeUser', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError(new PayloadValidationError('At least one user identifier is required.'))
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

    nock('https://api.attentivemobile.com', {
      reqheaders: {
        authorization: 'Bearer test-api-key',
        'content-type': 'application/json',
        'user-agent': 'Segment (Actions)'
      }
    })
      .post('/v1/subscriptions', (body) => {
        return (
          body &&
          body.externalEventId === event.messageId &&
          body.subscriptionType === 'MARKETING' &&
          body.signUpSourceId === 'WEB' &&
          body.singleOptIn === false &&
          (body.locale === 'en-US' || (body.locale.language === 'en' && body.locale.country === 'US')) &&
          body.user &&
          body.user.phone === '+3538675765689' &&
          !body.user.email
        )
      })
      .reply(200, {})

    const responses = await testDestination.testAction('subscribeUser', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
