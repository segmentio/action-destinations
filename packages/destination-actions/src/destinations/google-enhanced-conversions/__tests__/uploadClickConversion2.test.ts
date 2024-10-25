import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'
import { API_VERSION, CANARY_API_VERSION, FLAGON_NAME } from '../functions'
import { SegmentEvent } from '@segment/actions-core/*'

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const customerId = '1234'

describe('GoogleEnhancedConversions', () => {
  describe('uploadClickConversion2 Single Event', () => {
    it('sends an event with default mappings - basic', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD',
          products: [
            {
              product_id: '1234',
              quantity: 3,
              price: 10.99
            }
          ]
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadClickConversion2', {
        event,
        mapping: {
          conversion_action: '12345',
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"}]}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('sends email and phone user_identifiers - basic', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          phone: '6161729102',
          orderId: '1234',
          total: '200',
          currency: 'USD',
          products: [
            {
              product_id: '1234',
              quantity: 3,
              price: 10.99
            }
          ]
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadClickConversion2', {
        event,
        mapping: {
          conversion_action: '12345',
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"e63a1ca2fcb2a9d4c7db0dfae9e63d86c7cdbb7cfdba742848f50f38d460a5ec\\"}]}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('sends email and phone user_identifiers - with "+"', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          phone: '+6161729102',
          orderId: '1234',
          total: '200',
          currency: 'USD',
          products: [
            {
              product_id: '1234',
              quantity: 3,
              price: 10.99
            }
          ]
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadClickConversion2', {
        event,
        mapping: {
          conversion_action: '12345',
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"e63a1ca2fcb2a9d4c7db0dfae9e63d86c7cdbb7cfdba742848f50f38d460a5ec\\"}]}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('correctly maps custom variables', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          orderId: '1234',
          total: '200',
          currency: 'USD',
          products: [
            {
              product_id: '1234',
              quantity: 3,
              price: 10.99
            }
          ]
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

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadClickConversion2', {
        event,
        mapping: {
          conversion_action: '12345',
          custom_variables: { username: 'spongebob' },
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[1].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[],\\"customVariables\\":[{\\"conversionCustomVariable\\":\\"customers/1234/conversionCustomVariables/123445\\",\\"value\\":\\"spongebob\\"}]}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(2)
      expect(responses[1].status).toBe(201)
    })

    it('fails if customerId not set', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD',
          products: [
            {
              product_id: '1234',
              quantity: 3,
              price: 10.99
            }
          ]
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, {})

      try {
        await testDestination.testAction('uploadClickConversion2', {
          event,
          mapping: {
            conversion_action: '12345',
            __segment_internal_sync_mode: 'add'
          },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe('Customer ID is required for this action. Please set it in destination settings.')
      }
    })

    it('sends an event with default mappings - with enhanced v12 flag', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD',
          products: [
            {
              product_id: '1234',
              quantity: 3,
              price: 10.99
            }
          ]
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadClickConversion2', {
        event,
        features: { 'google-enhanced-v12': true },
        mapping: {
          conversion_action: '12345',
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"}]}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('sends email and phone user_identifiers - with enhanced v12 flag', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          phone: '6161729102',
          orderId: '1234',
          total: '200',
          currency: 'USD',
          products: [
            {
              product_id: '1234',
              quantity: 3,
              price: 10.99
            }
          ]
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadClickConversion2', {
        event,
        features: { 'google-enhanced-v12': true },
        mapping: {
          conversion_action: '12345',
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"e63a1ca2fcb2a9d4c7db0dfae9e63d86c7cdbb7cfdba742848f50f38d460a5ec\\"}]}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('fails if customerId not set', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD',
          products: [
            {
              product_id: '1234',
              quantity: 3,
              price: 10.99
            }
          ]
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, {})

      try {
        await testDestination.testAction('uploadClickConversion2', {
          event,
          features: { 'google-enhanced-v12': true },
          mapping: {
            conversion_action: '12345',
            __segment_internal_sync_mode: 'add'
          },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe('Customer ID is required for this action. Please set it in destination settings.')
      }
    })

    it('uses canary API version if flagon gate is set', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD',
          products: [
            {
              product_id: '1234',
              quantity: 3,
              price: 10.99
            }
          ]
        }
      })

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadClickConversion2', {
        event,
        mapping: {
          conversion_action: '12345',
          __segment_internal_sync_mode: 'add'
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
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"}]}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('hashed email and phone', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674', //'test@gmail.com'
          phone: '1dba01a96da19f6df771cff07e0a8d822126709b82ae7adc6a3839b3aaa68a16', // '6161729102'
          orderId: '1234',
          total: '200',
          currency: 'USD',
          products: [
            {
              product_id: '1234',
              quantity: 3,
              price: 10.99
            }
          ]
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadClickConversion2', {
        event,
        mapping: {
          conversion_action: '12345',
          ad_personalization_consent_state: 'GRANTED',
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"1dba01a96da19f6df771cff07e0a8d822126709b82ae7adc6a3839b3aaa68a16\\"}],\\"consent\\":{\\"adPersonalization\\":\\"GRANTED\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('fails if email is invalid', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'anything',
          orderId: '1234',
          total: '200',
          currency: 'USD',
          products: [
            {
              product_id: '1234',
              quantity: 3,
              price: 10.99
            }
          ]
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, {})

      try {
        await testDestination.testAction('uploadClickConversion2', {
          event,
          features: { 'google-enhanced-v12': true },
          mapping: {
            conversion_action: '12345',
            __segment_internal_sync_mode: 'add'
          },
          useDefaultMappings: true,
          settings: {
            customerId
          }
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe("Email provided doesn't seem to be in a valid format.")
      }
    })

    it('Deny User Data and Personalised Consent State', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674', //'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD',
          products: [
            {
              product_id: '1234',
              quantity: 3,
              price: 10.99
            }
          ]
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadClickConversion2', {
        event,
        mapping: {
          conversion_action: '12345',
          ad_user_data_consent_state: 'DENIED',
          ad_personalization_consent_state: 'DENIED',
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"}],\\"consent\\":{\\"adUserData\\":\\"DENIED\\",\\"adPersonalization\\":\\"DENIED\\"}}],\\"partialFailure\\":true}"`
      )
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('fails if sync mode is not supported', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          orderId: '1234',
          total: '200',
          currency: 'USD',
          products: [
            {
              product_id: '1234',
              quantity: 3,
              price: 10.99
            }
          ]
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, {})

      try {
        await testDestination.testAction('uploadClickConversion2', {
          event,
          mapping: {
            conversion_action: '12345',
            __segment_internal_sync_mode: 'upsert'
          },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe('Unsupported Sync Mode "upsert"')
      }
    })
  })

  describe('uploadClickConversion2 Batch Event', () => {
    it('sends an event with default mappings - basic', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'test1@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'test2@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadClickConversion2', {
        events,
        mapping: {
          conversion_action: '12345',
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9\\"}]},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47\\"}]}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('sends email and phone user_identifiers - basic', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'test1@gmail.com',
            phone: '6161729102',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'test2@gmail.com',
            phone: '6161729102',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadClickConversion2', {
        events,
        mapping: {
          conversion_action: '12345',
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9\\"},{\\"hashedPhoneNumber\\":\\"e63a1ca2fcb2a9d4c7db0dfae9e63d86c7cdbb7cfdba742848f50f38d460a5ec\\"}]},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47\\"},{\\"hashedPhoneNumber\\":\\"e63a1ca2fcb2a9d4c7db0dfae9e63d86c7cdbb7cfdba742848f50f38d460a5ec\\"}]}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('sends email and phone user_identifiers - with "+"', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'test1@gmail.com',
            phone: '+6161729101',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        }),

        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'test2@gmail.com',
            phone: '+6161729102',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadClickConversion2', {
        events,
        mapping: {
          conversion_action: '12345',
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9\\"},{\\"hashedPhoneNumber\\":\\"ef873ef70d75ae19678b2bacbddd956cccda7b619b4ffc7af2b60e570d27b095\\"}]},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47\\"},{\\"hashedPhoneNumber\\":\\"e63a1ca2fcb2a9d4c7db0dfae9e63d86c7cdbb7cfdba742848f50f38d460a5ec\\"}]}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('correctly maps custom variables', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
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

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadClickConversion2', {
        events,
        mapping: {
          conversion_action: '12345',
          custom_variables: { username: 'spongebob' },
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[1].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[],\\"customVariables\\":[{\\"conversionCustomVariable\\":\\"customers/1234/conversionCustomVariables/123445\\",\\"value\\":\\"spongebob\\"}]},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[],\\"customVariables\\":[{\\"conversionCustomVariable\\":\\"customers/1234/conversionCustomVariables/123445\\",\\"value\\":\\"spongebob\\"}]}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(2)
      expect(responses[1].status).toBe(201)
    })

    it('fails if customerId not set - basic', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, {})

      try {
        await testDestination.testBatchAction('uploadClickConversion2', {
          events,
          mapping: {
            conversion_action: '12345',
            __segment_internal_sync_mode: 'add'
          },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe('Customer ID is required for this action. Please set it in destination settings.')
      }
    })

    it('sends an event with default mappings - with enhanced v12 flag', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'test1@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'test2@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadClickConversion2', {
        events,
        features: { 'google-enhanced-v12': true },
        mapping: {
          conversion_action: '12345',
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9\\"}]},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47\\"}]}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('sends email and phone user_identifiers - with enhanced v12 flag', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'test1@gmail.com',
            phone: '6161729101',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'test2@gmail.com',
            phone: '6161729102',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadClickConversion2', {
        events,
        features: { 'google-enhanced-v12': true },
        mapping: {
          conversion_action: '12345',
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9\\"},{\\"hashedPhoneNumber\\":\\"ef873ef70d75ae19678b2bacbddd956cccda7b619b4ffc7af2b60e570d27b095\\"}]},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47\\"},{\\"hashedPhoneNumber\\":\\"e63a1ca2fcb2a9d4c7db0dfae9e63d86c7cdbb7cfdba742848f50f38d460a5ec\\"}]}],\\"partialFailure\\":true}"`
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
            gclid: '54321',
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, {})

      try {
        await testDestination.testBatchAction('uploadClickConversion2', {
          events,
          features: { 'google-enhanced-v12': true },
          mapping: {
            conversion_action: '12345',
            __segment_internal_sync_mode: 'add'
          },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe('Customer ID is required for this action. Please set it in destination settings.')
      }
    })

    it('uses canary API version if flagon gate is set', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadClickConversion2', {
        events,
        mapping: {
          conversion_action: '12345',
          __segment_internal_sync_mode: 'add'
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
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"}]},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"}]}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('hashed email and phone', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9', //'test1@gmail.com'
            phone: '64eab4e4d9e8e4f801e34d4f9043494ac3ccf778fb428dcbb555e632bb29d84b', // '6161729101'
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47', //'test2@gmail.com'
            phone: '1dba01a96da19f6df771cff07e0a8d822126709b82ae7adc6a3839b3aaa68a16', // '6161729102'
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadClickConversion2', {
        events,
        mapping: {
          conversion_action: '12345',
          ad_personalization_consent_state: 'GRANTED',
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9\\"},{\\"hashedPhoneNumber\\":\\"64eab4e4d9e8e4f801e34d4f9043494ac3ccf778fb428dcbb555e632bb29d84b\\"}],\\"consent\\":{\\"adPersonalization\\":\\"GRANTED\\"}},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47\\"},{\\"hashedPhoneNumber\\":\\"1dba01a96da19f6df771cff07e0a8d822126709b82ae7adc6a3839b3aaa68a16\\"}],\\"consent\\":{\\"adPersonalization\\":\\"GRANTED\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('fails if email is invalid', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'anything',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'anything',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, {})

      try {
        await testDestination.testBatchAction('uploadClickConversion2', {
          events,
          features: { 'google-enhanced-v12': true },
          mapping: {
            conversion_action: '12345',
            __segment_internal_sync_mode: 'add'
          },
          useDefaultMappings: true,
          settings: {
            customerId
          }
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe("Email provided doesn't seem to be in a valid format.")
      }
    })

    it('Deny User Data and Personalised Consent State', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event',
          properties: {
            gclid: '54321',
            email: '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674', //'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event',
          properties: {
            gclid: '54321',
            email: '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674', //'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadClickConversion2', {
        events,
        mapping: {
          conversion_action: '12345',
          ad_user_data_consent_state: 'DENIED',
          ad_personalization_consent_state: 'DENIED',
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"}],\\"consent\\":{\\"adUserData\\":\\"DENIED\\",\\"adPersonalization\\":\\"DENIED\\"}},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"}],\\"consent\\":{\\"adUserData\\":\\"DENIED\\",\\"adPersonalization\\":\\"DENIED\\"}}],\\"partialFailure\\":true}"`
      )
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('fails if sync mode is not supported', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'test@gmail.com',
            orderId: '1234',
            total: '200',
            currency: 'USD',
            products: [
              {
                product_id: '1234',
                quantity: 3,
                price: 10.99
              }
            ]
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, {})

      try {
        await testDestination.testBatchAction('uploadClickConversion2', {
          events,
          mapping: {
            conversion_action: '12345',
            __segment_internal_sync_mode: 'upsert'
          },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe('Unsupported Sync Mode "upsert"')
      }
    })
  })
})
