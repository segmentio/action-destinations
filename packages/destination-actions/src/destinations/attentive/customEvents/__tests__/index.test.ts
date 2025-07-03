import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'

const settings: Settings = {
  apiKey: 'test-api-key'
}

const validPayload = {
  timestamp,
  event: 'Product Clicked', // <- Used as "type" in Attentive
  messageId: '123e4567-e89b-12d3-a456-426614174000',
  type: 'track',
  userId: 'user-123',
  context: {
    traits: {
      phone: '+3538675765689',
      email: 'test@test.com'
    }
  },
  properties: {
    product_name: 'Product X',
    tracking_url: 'https://tracking-url.com'
  }
} as Partial<SegmentEvent>

const mapping = {
  type: { '@path': '$.event' },
  userIdentifiers: {
    phone: { '@path': '$.context.traits.phone' },
    email: { '@path': '$.context.traits.email' },
    clientUserId: { '@path': '$.userId' }
  },
  properties: { '@path': '$.properties' },
  externalEventId: { '@path': '$.messageId' },
  occurredAt: { '@path': '$.timestamp' }
}

const expectedPayload = {
  type: 'Product Clicked',
  user: {
    phone: '+3538675765689',
    email: 'test@test.com',
    externalIdentifiers: {
      clientUserId: 'user-123'
    }
  },
  properties: {
    product_name: 'Product X',
    tracking_url: 'https://tracking-url.com'
  },
  externalEventId: '123e4567-e89b-12d3-a456-426614174000',
  occurredAt: timestamp
}

beforeEach(() => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
})

describe('Attentive.customEvents', () => {
  it('should send a custom event to Attentive', async () => {
    const event = createTestEvent(validPayload)

    nock('https://api.attentivemobile.com', {
      reqheaders: {
        authorization: 'Bearer test-api-key',
        'content-type': 'application/json'
      }
    })
      .post('/v1/events/custom', expectedPayload)
      .reply(200, {})

    const responses = await testDestination.testAction('customEvents', {
      event,
      settings,
      mapping,
      useDefaultMappings: false
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('throws error if no userIdentifiers provided', async () => {
    const badPayload = {
      ...validPayload,
      context: {
        traits: {}
      },
      userId: undefined
    }

    const event = createTestEvent(badPayload)

    await expect(
      testDestination.testAction('customEvents', {
        event,
        settings,
        mapping,
        useDefaultMappings: false
      })
    ).rejects.toThrowError("At least one user identifier is required.")
  })

  it('throws error if properties contain arrays', async () => {
    const badPayload = {
      ...validPayload,
      properties: {
        someArray: [1, 2, 3]
      }
    }

    const event = createTestEvent(badPayload)

    await expect(
      testDestination.testAction('customEvents', {
        event,
        settings,
        mapping,
        useDefaultMappings: false
      })
    ).rejects.toThrowError("Properties cannot contain arrays.")
  })
})
