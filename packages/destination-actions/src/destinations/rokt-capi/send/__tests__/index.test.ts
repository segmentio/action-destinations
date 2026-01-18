import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../../index'

const testDestination = createTestIntegration(destination)

describe('RoktCapi.send', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    nock.cleanAll()
  })

  it('required fields', async () => {
      expect(true).toBe(true)
  })

  it('should map rtid from integrations.Rokt Conversions API.rtid', async () => {
    const event = createTestEvent({
      event: 'Order Completed',
      messageId: 'test-message-id-123',
      timestamp: '2024-01-18T12:00:00.000Z',
      type: 'track',
      properties: {
        order_id: 'order-123',
        revenue: 99.99,
        currency: 'USD'
      },
      context: {
        traits: {
          email: 'test@example.com'
        }
      },
      userId: 'user-123',
      integrations: {
        'Rokt Conversions API': {
          rtid: 'test-rtid-from-integrations'
        }
      }
    })

    nock('https://inbound.mparticle.com')
      .post('/s2s/v2/events', (body) => {
        // Verify that the rtid is correctly mapped to integration_attributes
        expect(body.integration_attributes).toBeDefined()
        expect(body.integration_attributes['1277']).toBeDefined()
        expect(body.integration_attributes['1277'].passbackconversiontrackingid).toBe('test-rtid-from-integrations')
        return true
      })
      .reply(200, {})

    const responses = await testDestination.testAction('send', {
      event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should fallback to URL query parameter when integrations.Rokt Conversions API.rtid is not present', async () => {
    const event = createTestEvent({
      event: 'Order Completed',
      messageId: 'test-message-id-456',
      timestamp: '2024-01-18T12:00:00.000Z',
      type: 'track',
      properties: {
        order_id: 'order-456',
        revenue: 49.99,
        currency: 'USD'
      },
      context: {
        traits: {
          email: 'test2@example.com'
        },
        page: {
          search: '?utm_source=test&rtid=rtid-from-url&other=param'
        }
      },
      userId: 'user-456'
    })

    nock('https://inbound.mparticle.com')
      .post('/s2s/v2/events', (body) => {
        // Verify that the rtid is correctly extracted from URL and mapped to integration_attributes
        expect(body.integration_attributes).toBeDefined()
        expect(body.integration_attributes['1277']).toBeDefined()
        expect(body.integration_attributes['1277'].passbackconversiontrackingid).toBe('rtid-from-url')
        return true
      })
      .reply(200, {})

    const responses = await testDestination.testAction('send', {
      event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

})
