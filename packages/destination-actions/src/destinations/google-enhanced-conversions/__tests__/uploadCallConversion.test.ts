import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'
import { API_VERSION, CANARY_API_VERSION, FLAGON_NAME } from '../functions'

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const customerId = '1234'

describe('GoogleEnhancedConversions', () => {
  describe('uploadCallConversion Single Event', () => {
    it('sends an event with default mappings - basic', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadCallConversion', {
        event,
        mapping: { conversion_action: '12345', caller_id: '+1234567890', call_timestamp: timestamp },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"callerId\\":\\"+1234567890\\",\\"callStartDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\"}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('maps custom variables correctly', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:searchStream`)
        .post('')
        .reply(200, [
          {
            results: [
              {
                conversionCustomVariable: {
                  resourceName: 'customers/1234/conversionCustomVariables/123445',
                  id: '123445',
                  name: 'username'
                }
              }
            ]
          }
        ])

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadCallConversion', {
        event,
        mapping: {
          conversion_action: '12345',
          caller_id: '+1234567890',
          call_timestamp: timestamp,
          custom_variables: { username: 'spongebob' }
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[1].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"callerId\\":\\"+1234567890\\",\\"callStartDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"customVariables\\":[{\\"conversionCustomVariable\\":\\"customers/1234/conversionCustomVariables/123445\\",\\"value\\":\\"spongebob\\"}]}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(2)
      expect(responses[1].status).toBe(201)
    })

    it('fails if customerId not set - basic', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}] })

      try {
        await testDestination.testAction('uploadCallConversion', {
          event,
          mapping: { conversion_action: '12345', caller_id: '+1234567890', call_timestamp: timestamp },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe(
          'Customer ID is required for this action. Please set it in destination settings.'
        )
      }
    })

    it('sends an event with default mappings - with enhanced v12 flag', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadCallConversion', {
        event,
        features: { 'google-enhanced-v12': true },
        mapping: { conversion_action: '12345', caller_id: '+1234567890', call_timestamp: timestamp },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"callerId\\":\\"+1234567890\\",\\"callStartDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\"}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('fails if customerId not set - with enhanced v12 flag', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}] })

      try {
        await testDestination.testAction('uploadCallConversion', {
          event,
          features: { 'google-enhanced-v12': true },
          mapping: { conversion_action: '12345', caller_id: '+1234567890', call_timestamp: timestamp },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe(
          'Customer ID is required for this action. Please set it in destination settings.'
        )
      }
    })

    it('uses canary API version if flagon gate is set', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD'
        }
      })

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadCallConversion', {
        event,
        mapping: {
          conversion_action: '12345',
          caller_id: '+1234567890',
          call_timestamp: timestamp,
          ad_user_data_consent_state: 'GRANTED'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        },
        features: {
          [FLAGON_NAME]: true
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"callerId\\":\\"+1234567890\\",\\"callStartDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"consent\\":{\\"adUserData\\":\\"GRANTED\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('Deny User Data and Personalised Consent State', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD'
        }
      })

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadCallConversion', {
        event,
        mapping: {
          conversion_action: '12345',
          caller_id: '+1234567890',
          call_timestamp: timestamp,
          ad_user_data_consent_state: 'DENIED',
          ad_personalization_consent_state: 'DENIED'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        },
        features: {
          [FLAGON_NAME]: true
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"callerId\\":\\"+1234567890\\",\\"callStartDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"consent\\":{\\"adUserData\\":\\"DENIED\\",\\"adPersonalization\\":\\"DENIED\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })
  })

  describe('uploadCallConversion Batch Event', () => {
    it('sends an event with default mappings - basic', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD'
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD'
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadCallConversion', {
        events,
        mapping: { conversion_action: '12345', caller_id: '+1234567890', call_timestamp: timestamp },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"callerId\\":\\"+1234567890\\",\\"callStartDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\"},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"callerId\\":\\"+1234567890\\",\\"callStartDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\"}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('maps custom variables correctly', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD'
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD'
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:searchStream`)
        .post('')
        .reply(200, [
          {
            results: [
              {
                conversionCustomVariable: {
                  resourceName: 'customers/1234/conversionCustomVariables/123445',
                  id: '123445',
                  name: 'username'
                }
              }
            ]
          }
        ])

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadCallConversion', {
        events,
        mapping: {
          conversion_action: '12345',
          caller_id: '+1234567890',
          call_timestamp: timestamp,
          custom_variables: { username: 'spongebob' }
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[1].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"callerId\\":\\"+1234567890\\",\\"callStartDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"customVariables\\":[{\\"conversionCustomVariable\\":\\"customers/1234/conversionCustomVariables/123445\\",\\"value\\":\\"spongebob\\"}]},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"callerId\\":\\"+1234567890\\",\\"callStartDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"customVariables\\":[{\\"conversionCustomVariable\\":\\"customers/1234/conversionCustomVariables/123445\\",\\"value\\":\\"spongebob\\"}]}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(2)
      expect(responses[1].status).toBe(201)
    })

    it('fails if customerId not - basic', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}] })

      try {
        await testDestination.testAction('uploadCallConversion', {
          event,
          mapping: { conversion_action: '12345', caller_id: '+1234567890', call_timestamp: timestamp },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe(
          'Customer ID is required for this action. Please set it in destination settings.'
        )
      }
    })

    it('sends an event with default mappings - with enhanced v12 flag', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD'
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD'
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadCallConversion', {
        events,
        features: { 'google-enhanced-v12': true },
        mapping: { conversion_action: '12345', caller_id: '+1234567890', call_timestamp: timestamp },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"callerId\\":\\"+1234567890\\",\\"callStartDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\"},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"callerId\\":\\"+1234567890\\",\\"callStartDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\"}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('fails if customerId not set - with enhanced v12 flag', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD'
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD'
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}] })

      try {
        await testDestination.testBatchAction('uploadCallConversion', {
          events,
          features: { 'google-enhanced-v12': true },
          mapping: { conversion_action: '12345', caller_id: '+1234567890', call_timestamp: timestamp },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe(
          'Customer ID is required for this action. Please set it in destination settings.'
        )
      }
    })

    it('uses canary API version if flagon gate is set', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD'
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD'
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadCallConversion', {
        events,
        mapping: {
          conversion_action: '12345',
          caller_id: '+1234567890',
          call_timestamp: timestamp,
          ad_user_data_consent_state: 'GRANTED'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        },
        features: {
          [FLAGON_NAME]: true
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"callerId\\":\\"+1234567890\\",\\"callStartDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"consent\\":{\\"adUserData\\":\\"GRANTED\\"}},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"callerId\\":\\"+1234567890\\",\\"callStartDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"consent\\":{\\"adUserData\\":\\"GRANTED\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('Deny User Data and Personalised Consent State', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD'
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD'
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}:uploadCallConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadCallConversion', {
        events,
        mapping: {
          conversion_action: '12345',
          caller_id: '+1234567890',
          call_timestamp: timestamp,
          ad_user_data_consent_state: 'DENIED',
          ad_personalization_consent_state: 'DENIED'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        },
        features: {
          [FLAGON_NAME]: true
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"callerId\\":\\"+1234567890\\",\\"callStartDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"consent\\":{\\"adUserData\\":\\"DENIED\\",\\"adPersonalization\\":\\"DENIED\\"}},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"callerId\\":\\"+1234567890\\",\\"callStartDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"consent\\":{\\"adUserData\\":\\"DENIED\\",\\"adPersonalization\\":\\"DENIED\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })
  })
})
