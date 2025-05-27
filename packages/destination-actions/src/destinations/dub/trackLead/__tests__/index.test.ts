import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_URL } from '../../config'

const testDestination = createTestIntegration(Destination)

describe('Dub.trackLead', () => {
  const settings = {
    apiKey: 'test-api-key'
  }

  it('should validate required fields', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {}
    })

    try {
      await testDestination.testAction('trackLead', {
        event,
        settings,
        mapping: {}
      })
    } catch (err) {
      expect(err.message).toContain('missing the required field')
    }
  })

  it('should track a lead successfully', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {
        clickId: 'test-click-id',
        eventName: 'Sign Up',
        externalId: 'user-123',
        customerName: 'John Doe',
        customerEmail: 'john@example.com'
      }
    })

    nock(API_URL).post('/track/lead').matchHeader('Authorization', 'Bearer test-api-key').reply(200, {})

    const responses = await testDestination.testAction('trackLead', {
      event,
      settings,
      mapping: {
        clickId: { '@path': '$.properties.clickId' },
        eventName: { '@path': '$.properties.eventName' },
        externalId: { '@path': '$.properties.externalId' },
        customerName: { '@path': '$.properties.customerName' },
        customerEmail: { '@path': '$.properties.customerEmail' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should track a lead with optional fields', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {
        clickId: 'test-click-id',
        eventName: 'Sign Up',
        externalId: 'user-123',
        eventQuantity: 1,
        customerAvatar: 'https://example.com/avatar.jpg',
        metadata: {
          source: 'web',
          campaign: 'summer-sale'
        }
      }
    })

    nock(API_URL).post('/track/lead').matchHeader('Authorization', 'Bearer test-api-key').reply(200, {})

    const responses = await testDestination.testAction('trackLead', {
      event,
      settings,
      mapping: {
        clickId: { '@path': '$.properties.clickId' },
        eventName: { '@path': '$.properties.eventName' },
        externalId: { '@path': '$.properties.externalId' },
        eventQuantity: { '@path': '$.properties.eventQuantity' },
        customerAvatar: { '@path': '$.properties.customerAvatar' },
        metadata: { '@path': '$.properties.metadata' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
