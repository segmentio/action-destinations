import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Voucherify from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Voucherify)

const settings: Settings = {
  apiKey: 'voucherifyApiKey',
  secretKey: 'voucherifySecretKey',
  customURL: 'https://us1.api.voucherify.io/segmentio'
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
          source_id: 'test_customer_1'
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
            source_id: {
              '@path': '$.properties.source_id'
            }
          }
        })
      ).rejects.toThrowError(
        `The Custom URL: ${wrongSettings.customURL} is invalid. It probably lacks the HTTP/HTTPS protocol or has an incorrect format.`
      )
    })

    it('should work with the default mapping', async () => {
      nock(settings.customURL).post('/event-processing').reply(200)

      const testEvent = createTestEvent({
        event: 'Test Track Event',
        type: 'track',
        properties: {
          source_id: 'test_customer_1'
        }
      })

      await expect(
        testDestination.testAction('addCustomEvent', {
          event: testEvent,
          settings,
          useDefaultMappings: true
        })
      ).rejects.not.toThrowError("The root value is missing the required field 'source_id'.")
    })

    it('should throw an error if the source_id and email are not specified', async () => {
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
      ).rejects.toThrowError("The root value is missing the required field 'source_id'.")
    })

    it('should throw an error if the type is not specified', async () => {
      nock(settings.customURL).post('/event-processing').reply(200)

      const testEvent = createTestEvent({
        event: 'Test Track Event',
        properties: {
          source_id: 'test_customer_1'
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
            source_id: {
              '@path': '$.properties.source_id'
            }
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'type'.")
    })

    it('should work if the email is supplied instead of the source_id', async () => {
      nock(settings.customURL).post('/event-processing').reply(200)

      const testEvent = createTestEvent({
        event: 'Test Track Event',
        type: 'track',
        properties: {
          email: 'test@voucherify.io'
        }
      })
      await expect(
        testDestination.testAction('addCustomEvent', {
          event: testEvent,
          settings,
          mapping: {
            source_id: {
              '@path': '$.properties.email'
            }
          }
        })
      ).rejects.not.toThrowError("The root value is missing the required field 'source_id'.")
    })
  })
})
