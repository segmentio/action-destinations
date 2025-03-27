import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('TalonOne.updateCustomerSessionV2', () => {
  it('misses request body', async () => {
    try {
      await testDestination.testAction('updateCustomerSessionV2', {
        settings: {
          apiKey: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        }
      })
    } catch (err) {
      expect(err.message).toContain("The root value is missing the required field 'customerSessionId'.")
    }
  })

  it('misses customer session ID', async () => {
    try {
      await testDestination.testAction('updateCustomerSessionV2', {
        settings: {
          apiKey: 'some_api_key',
          deployment: 'https://something.europe-west1.talon.one'
        },
        mapping: {
          customerSession: {},
          sessionAttributesInfo: [],
          cartItemAttributesInfo: []
        }
      })
    } catch (err) {
      expect(err.message).toContain("The root value is missing the required field 'customerSessionId'.")
    }
  })

  it('should work', async () => {
    nock('https://integration.talon.one')
      .put(`/segment/v2/customer_sessions/session123abc?skipNonExistingAttributes=true`, {
        state: 'open',
        attributes: {
          testAttribute1: 'value',
          testAttribute2: 'value'
        },
        cartItems: [
          {
            name: 'a_name',
            sku: '123sku',
            quantity: 1,
            price: 1000
          }
        ]
      })
      .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
      .matchHeader('destination-hostname', 'https://something.europe-west1.talon.one')
      .matchHeader('X-Callback-Destination-URI', 'http://mydomain.com/api/callback_here')
      .matchHeader('X-Callback-API-Key', 'X-API-Key 123456789123456789123456789123456789')
      .matchHeader('X-Content-Fields', 'effects')
      .matchHeader('X-Correlation-ID', '123')
      .reply(200)

    await testDestination.testAction('updateCustomerSessionV2', {
      settings: {
        apiKey: 'some_api_key',
        deployment: 'https://something.europe-west1.talon.one'
      },
      mapping: {
        customerSessionId: 'session123abc',
        callbackDestination: 'http://mydomain.com/api/callback_here',
        callbackAPIKey: 'X-API-Key 123456789123456789123456789123456789',
        contentFields: 'effects',
        callbackCorrelationId: '123',
        state: 'open',
        attributes: {
          testAttribute1: 'value',
          testAttribute2: 'value'
        },
        cartItems: [
          {
            name: 'a_name',
            sku: '123sku',
            quantity: 1,
            price: 1000
          }
        ],
        skipNonExistingAttributes: true
      }
    })
  })
})
