import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Voucherify from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Voucherify)

const settings: Settings = {
  apiKey: 'voucherifyApiKey',
  secretKey: 'voucherifySecretKey',
  customURL: 'https://us1.segmentio.voucherify.io/segmentio'
}

describe('Voucherify', () => {
  describe('addCustomEvent', () => {
    it('should throw error if the custom URL is invalid.', async () => {
      const wrongSettings: Settings = {
        apiKey: 'voucherifyApiKey',
        secretKey: 'voucherifySecretKey',
        customURL: 'wrongURL.com'
      }
      nock(wrongSettings.customURL).post('/event-processing').reply(200)

      const testEvent = createTestEvent({
        event: 'Test Track Event',
        type: 'track',
        properties: {
          customer: {
            source_id: 'test_customer_1'
          }
        }
      })

      await expect(
        testDestination.testAction('addCustomEvent', {
          event: testEvent,
          settings: wrongSettings,
          mapping: {
            event: {
              '@path': '$.event'
            },
            type: {
              '@path': '$.type'
            },
            customer: {
              '@path': '$.properties.customer'
            }
          }
        })
      ).rejects.toThrowError(
        `The Custom URL: ${wrongSettings.customURL} is invalid. It probably lacks the HTTP/HTTPS protocol or has an incorrect format.`
      )
    })

    it('should not throw an error if the customer object with source_id is specified', async () => {
      nock(settings.customURL).post('/event-processing').reply(200)

      const testEvent = createTestEvent({
        event: 'Test Track Event',
        type: 'track',
        properties: {
          customer: {
            source_id: 'test_customer_1'
          }
        }
      })

      await expect(
        testDestination.testAction('addCustomEvent', {
          event: testEvent,
          settings,
          mapping: {
            event: {
              '@path': '$.event'
            },
            type: {
              '@path': '$.type'
            },
            customer: {
              '@path': '$.properties.customer'
            }
          }
        })
      ).rejects.not.toThrowError("Customer Object is missing the required field 'source_id'.")
    })

    it('should throw an error if the source_id field in customer object is not specified', async () => {
      nock(settings.customURL).post('/event-processing').reply(200)

      const testEvent = createTestEvent({
        event: 'Test Track Event',
        type: 'track',
        properties: {
          customer: {
            email: 'test_customer_1@test.com'
          }
        }
      })

      await expect(
        testDestination.testAction('addCustomEvent', {
          event: testEvent,
          settings,
          mapping: {
            event: {
              '@path': '$.event'
            },
            type: {
              '@path': '$.type'
            },
            customer: {
              '@path': '$.properties.customer'
            }
          }
        })
      ).rejects.toThrowError("Customer Object is missing the required field 'source_id'.")
    })

    it('should throw an error if the customer object is not specified', async () => {
      nock(settings.customURL).post('/event-processing').reply(200)

      const testEvent = createTestEvent({
        event: 'Test Track Event',
        type: 'track',
        properties: {
          testProp: 'property'
        }
      })

      await expect(
        testDestination.testAction('addCustomEvent', {
          event: testEvent,
          settings,
          mapping: {
            event: {
              '@path': '$.event'
            },
            type: {
              '@path': '$.type'
            }
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'customer'.")
    })

    it('should throw an error if the type is not specified', async () => {
      nock(settings.customURL).post('/event-processing').reply(200)

      const testEvent = createTestEvent({
        event: 'Test Track Event',
        properties: {
          customer: {
            source_id: 'src_id'
          }
        }
      })
      await expect(
        testDestination.testAction('addCustomEvent', {
          event: testEvent,
          settings,
          mapping: {
            event: {
              '@path': '$.event'
            },
            customer: {
              '@path': '$.properties.customer'
            }
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'type'.")
    })
  })
})
