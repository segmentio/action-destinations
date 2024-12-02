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
  event: 'Event Type 1',
  messageId: '123e4567-e89b-12d3-a456-426614174000',
  type: 'track',
  userId: '123e4567-e89b-12d3-a456-426614174000',
  context: {
    traits: {
      phone: '+3538675765689',
      email: 'test@test.com'
    }
  },
  properties: {
    tracking_url: 'https://tracking-url.com',
    product_name: 'Product X'
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
  type: 'Event Type 1',
  properties: {
    tracking_url: 'https://tracking-url.com',
    product_name: 'Product X'
  },
  externalEventId: '123e4567-e89b-12d3-a456-426614174000',
  occurredAt: '2024-01-08T13:52:50.212Z',
  user: {
    phone: '+3538675765689',
    email: 'test@test.com',
    externalIdentifiers: {
      clientUserId: '123e4567-e89b-12d3-a456-426614174000'
    }
  }
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('Attentive.customEvents', () => {
  it('should send a custom event to Attentive', async () => {
    const event = createTestEvent(validPayload)

    nock('https://api.attentivemobile.com').post('/v1/events/custom', expectedPayload).reply(200, {})

    const responses = await testDestination.testAction('customEvents', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should throw error if no identifiers provided', async () => {
    const badPayload = {
      ...validPayload
    }
    delete badPayload?.context?.traits?.phone
    delete badPayload?.context?.traits?.email
    badPayload.userId = undefined

    const event = createTestEvent(badPayload)

    await expect(
      testDestination.testAction('customEvents', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError(new PayloadValidationError('At least one user identifier is required.'))
  })
})
