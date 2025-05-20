import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_URL } from '../../config'

const testDestination = createTestIntegration(Destination)

describe('Dub.trackSale', () => {
  const settings = {
    apiKey: 'test-api-key'
  }

  it('should validate required fields', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {}
    })

    try {
      await testDestination.testAction('trackSale', {
        event,
        settings,
        mapping: {}
      })
    } catch (err) {
      expect(err.message).toContain('missing the required field')
    }
  })

  it('should track a sale successfully', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {
        externalId: 'user-123',
        amount: 5000,
        paymentProcessor: 'stripe',
        eventName: 'Purchase',
        currency: 'usd'
      }
    })

    nock(API_URL).post('/track/sale').matchHeader('Authorization', 'Bearer test-api-key').reply(200, {})

    const responses = await testDestination.testAction('trackSale', {
      event,
      settings,
      mapping: {
        externalId: { '@path': '$.properties.externalId' },
        amount: { '@path': '$.properties.amount' },
        paymentProcessor: { '@path': '$.properties.paymentProcessor' },
        eventName: { '@path': '$.properties.eventName' },
        currency: { '@path': '$.properties.currency' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should track a sale with optional fields', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {
        externalId: 'user-123',
        amount: 5000,
        paymentProcessor: 'stripe',
        leadEventName: 'Sign Up',
        invoiceId: 'inv-123',
        metadata: {
          product: 'premium',
          plan: 'annual'
        }
      }
    })

    nock(API_URL).post('/track/sale').matchHeader('Authorization', 'Bearer test-api-key').reply(200, {})

    const responses = await testDestination.testAction('trackSale', {
      event,
      settings,
      mapping: {
        externalId: { '@path': '$.properties.externalId' },
        amount: { '@path': '$.properties.amount' },
        paymentProcessor: { '@path': '$.properties.paymentProcessor' },
        leadEventName: { '@path': '$.properties.leadEventName' },
        invoiceId: { '@path': '$.properties.invoiceId' },
        metadata: { '@path': '$.properties.metadata' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
