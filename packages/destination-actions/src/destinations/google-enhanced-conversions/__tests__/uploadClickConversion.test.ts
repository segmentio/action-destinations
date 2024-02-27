import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'
import { API_VERSION, CANARY_API_VERSION, FLAGON_NAME } from '../functions'

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const customerId = '1234'

describe('GoogleEnhancedConversions', () => {
  describe('uploadClickConversion', () => {
    it('sends an event with default mappings', async () => {
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

      const responses = await testDestination.testAction('uploadClickConversion', {
        event,
        mapping: { conversion_action: '12345' },
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

    it('sends email and phone user_identifiers', async () => {
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

      const responses = await testDestination.testAction('uploadClickConversion', {
        event,
        mapping: { conversion_action: '12345' },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"1dba01a96da19f6df771cff07e0a8d822126709b82ae7adc6a3839b3aaa68a16\\"}]}],\\"partialFailure\\":true}"`
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

      const responses = await testDestination.testAction('uploadClickConversion', {
        event,
        mapping: { conversion_action: '12345', custom_variables: { username: 'spongebob' } },
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
        await testDestination.testAction('uploadClickConversion', {
          event,
          mapping: { conversion_action: '12345' },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe('Customer ID is required for this action. Please set it in destination settings.')
      }
    })

    it('sends an event with default mappings', async () => {
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

      const responses = await testDestination.testAction('uploadClickConversion', {
        event,
        features: { 'google-enhanced-v12': true },
        mapping: { conversion_action: '12345' },
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

    it('sends email and phone user_identifiers', async () => {
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

      const responses = await testDestination.testAction('uploadClickConversion', {
        event,
        features: { 'google-enhanced-v12': true },
        mapping: { conversion_action: '12345' },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"1dba01a96da19f6df771cff07e0a8d822126709b82ae7adc6a3839b3aaa68a16\\"}]}],\\"partialFailure\\":true}"`
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
        await testDestination.testAction('uploadClickConversion', {
          event,
          features: { 'google-enhanced-v12': true },
          mapping: { conversion_action: '12345' },
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

      const responses = await testDestination.testAction('uploadClickConversion', {
        event,
        mapping: { conversion_action: '12345' },
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

    it('hashed email', async () => {
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

      const responses = await testDestination.testAction('uploadClickConversion', {
        event,
        mapping: { conversion_action: '12345' },
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
        await testDestination.testAction('uploadClickConversion', {
          event,
          features: { 'google-enhanced-v12': true },
          mapping: { conversion_action: '12345' },
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
  })
})
