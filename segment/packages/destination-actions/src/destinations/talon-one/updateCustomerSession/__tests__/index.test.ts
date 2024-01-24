import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(Destination)

describe('TalonOne.updateCustomerSession', () => {
  it('misses request body', async () => {
    try {
      await testDestination.testAction('updateCustomerSession', {
        settings: {
          apiKey: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        }
      })
    } catch (err) {
      expect(err.message).toContain("The root value is missing the required field 'customerSessionId'.")
    }
  })

  it('misses customerSession', async () => {
    try {
      await testDestination.testAction('updateCustomerSession', {
        settings: {
          apiKey: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        },
        mapping: {
          customerSessionId: 'session123abc'
        }
      })
    } catch (err) {
      expect(err.message).toContain("The root value is missing the required field 'customerSession'.")
    }
  })

  it('misses customer session ID', async () => {
    try {
      await testDestination.testAction('updateCustomerSession', {
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
      .put(`/segment/customer_sessions/session123abc`, {
        customerSession: {
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
        },
        sessionAttributesInfo: [
          {
            name: 'testAttribute1',
            type: 'string'
          },
          {
            name: 'testAttribute2',
            type: 'string'
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

    await testDestination.testAction('updateCustomerSession', {
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
        customerSession: {
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
        },
        sessionAttributesInfo: [
          {
            name: 'testAttribute1',
            type: 'string'
          },
          {
            name: 'testAttribute2',
            type: 'string'
          }
        ]
      }
    })
  })
})
