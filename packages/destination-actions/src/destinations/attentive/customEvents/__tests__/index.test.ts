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
  timestamp: timestamp,
  event: 'Event Type 1',
  messageId: 'message_id_1',
  type: 'track',
  userId: 'user_id_1',
  context: {
    traits: {
      phone: '+3538675765689',
      email: 'test@test.com',
      clientUserId: '123e4567-e89b-12d3-a456-426614174000'
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
    clientUserId: { '@path': '$.context.traits.clientUserId' }
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
  externalEventId: 'message_id_1',
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

  it('should throw error if invalid parameter in request query or body', async () => {
    const badPayload = {
      ...validPayload,
      extraParameterKey: 'extraParameterValue'
    }
    const event = createTestEvent(badPayload)

    nock('https://api.attentivemobile.com').post('/v1/events/custom', expectedPayload).reply(400, {})

    await expect(
      testDestination.testAction('customEvents', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError(new PayloadValidationError('Invalid parameter in request query or body'))
  })
})
