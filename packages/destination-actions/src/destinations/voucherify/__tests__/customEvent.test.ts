import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Voucherify from '../index'
import { Settings } from '../generated-types'
import { AccountRegion } from '../utils'
import { trackApiEndpoint } from '../utils'

const testDestination = createTestIntegration(Voucherify)

const settings: Settings = {
  apiKey: 'voucherifyApiKey',
  secretKey: 'voucherifySecretKey',
  apiEndpoint: AccountRegion.EU
}

describe('Voucherify', () => {
  describe('trackEvent', () => {
    it('should throw error if apiEndpoint is not EU, US or AS', async () => {
      const wrongSettings: Settings = {
        apiKey: 'voucherifyApiKey',
        secretKey: 'voucherifySecretKey',
        apiEndpoint: 'Wrong endpoint'
      }
      nock(`${trackApiEndpoint(settings.apiEndpoint)}/segmentio`)
        .post('/event-processing')
        .reply(200)

      await expect(testDestination.testAuthentication(wrongSettings)).rejects.toThrowError(
        // eslint-disable-next-line no-useless-escape
        `Api Endpoint must be one of: \"EU\", \"US\", or \"AS\".`
      )
    })

    it('should work when source_id, type and event are supplied', async () => {
      nock(`${trackApiEndpoint(settings.apiEndpoint)}/segmentio`)
        .post('/event-processing')
        .reply(200)
      const testEvent = createTestEvent({
        event: 'Test Track Event',
        properties: {
          source_id: 'test_customer_1'
        },
        type: 'track'
      })

      const responses = await testDestination.testAction('trackEvent', {
        event: testEvent,
        settings,
        mapping: {
          source_id: {
            '@path': '$.properties.source_id'
          },
          event: {
            '@path': '$.event'
          },
          type: {
            '@path': '$.type'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should throw an error if the source_id and email are not specified', async () => {
      nock(`${trackApiEndpoint(settings.apiEndpoint)}/segmentio`)
        .post('/event-processing')
        .reply(200)

      const testEvent = createTestEvent({
        event: 'Test Track Event',
        type: 'track',
        properties: {
          testProp: 'property'
        }
      })
      await expect(
        testDestination.testAction('trackEvent', {
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
      nock(`${trackApiEndpoint(settings.apiEndpoint)}/segmentio`)
        .post('/event-processing')
        .reply(200)

      const testEvent = createTestEvent({
        event: 'Test Track Event',
        properties: {
          source_id: 'test_customer_1'
        }
      })
      await expect(
        testDestination.testAction('trackEvent', {
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
      nock(`${trackApiEndpoint(settings.apiEndpoint)}/segmentio`)
        .post('/event-processing')
        .reply(200)

      const testEvent = createTestEvent({
        event: 'Test Track Event',
        type: 'track',
        properties: {
          email: 'test@voucherify.io'
        }
      })
      await expect(
        testDestination.testAction('trackEvent', {
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
  describe('pageEvent', () => {
    it('should throw an error when the name is not provided using page event', async () => {
      nock(`${trackApiEndpoint(settings.apiEndpoint)}/segmentio`)
        .post('/event-processing')
        .reply(200)
      const testEvent = createTestEvent({
        event: 'Test Page Event',
        properties: {
          source_id: 'test_customer_1'
        },
        type: 'page'
      })

      await expect(
        testDestination.testAction('pageEvent', {
          event: testEvent,
          settings,
          mapping: {
            source_id: {
              '@path': '$.properties.source_id'
            },
            event: {
              '@path': '$.event'
            },
            type: {
              '@path': '$.type'
            }
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'name'.")
    })
  })
})
