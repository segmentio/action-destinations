import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const customerId = '1234'

describe('GoogleEnhancedConversions', () => {
  describe('uploadClickConversion', () => {
    it('should should send an event with default mappings', async () => {
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

      nock(`https://googleads.googleapis.com/v11/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, {})

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
  })
})
