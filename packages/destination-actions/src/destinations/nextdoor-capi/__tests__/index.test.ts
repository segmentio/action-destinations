import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)
const settings: Settings = {
  apiKey: 'fake_api_key',
  client_id: 'client_id_1',
  pixel_id: 'pixel_id_1'
}

describe('Nextdoor Conversions Api', () => {
  describe('sendConversion', () => {
    it('should send a Conversion event', async () => {
      const event = createTestEvent({
        timestamp: '2024-01-08T13:52:50.212Z',
        event: 'Some Custom Event Name',
        messageId: 'test-message-id-contact',
        type: 'track',
        userId: 'user_id_1',
        properties: {
          event_id: 'event_id_1',
          delivery_optimization: true,
          test_event: false,
          email: 'test@test.com',
          phone: '1234567890',
          first_name: 'Billybob',
          last_name: 'Thornton',
          birthday: '1984-10-19',
          address: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            country: 'US',
            postal_code: '94105'
          },
          click_id: 'click_id_1',
          total: 100,
          products: [
            { product_id: 'product_id_1', quantity: 1, price: 40 },
            { product_id: 'product_id_2', quantity: 2, price: 30 }
          ]
        },
        context: {
          app: {
            name: 'test-app',
            type: 'ios',
            version: '1.0.0'
          },
          page: {
            url: 'https://example.com'
          },
          ip: '111.111.111.111'
        }
      })

      nock('https://ads.nextdoor.com').post('/v2/api/conversions/track').reply(200, {})
      const responses = await testDestination.testAction('sendConversion', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          event_name: 'custom_conversion_1',
          action_source: 'website',
          event_id: 'test_event_id',
          event_timezone: 'America/Los_Angeles',
          custom: {
            delivery_category: 'in_store',
            order_id: 'order_id_1',
            order_value: 100,
            currency: 'USD'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        action_source: 'website',
        action_source_url: 'https://example.com',
        app: {
          app_id: 'test-app',
          app_version: '1.0.0',
          platform: 'ios'
        },
        client_id: 'client_id_1',
        custom: {
          product_context: [
            {
              id: 'product_id_1',
              item_price: 40,
              quantity: 1
            },
            {
              id: 'product_id_2',
              item_price: 30,
              quantity: 2
            }
          ],
          delivery_category: 'in_store',
          order_id: 'order_id_1',
          order_value: 'USD100'
        },
        customer: {
          city: '5aa34886f7f3741de8460690b636f4c8b7c2044df88e2e8adbb4f7e6f8534931',
          click_id: 'click_id_1',
          client_ip_address: '5feaf188de296cd3b17f7c66fd3a2aec9b694815f2b1180631f7b52f57029777',
          country: '9b202ecbc6d45c6d8901d989a918878397a3eb9d00e8f48022fc051b19d21a1d',
          date_of_birth: '109b73865ffbc15a9e11c6e050b64082138cb757748d9012013a5cfccde4b01d',
          email: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
          first_name: '9a95cb2a52640927a118d8ee7259658681ea23be58cdec4411240d89cb36b390',
          last_name: 'd7034215823c40c12ec0c7aaff96db94a0e3d9b176f68296eb9d4ca7195c958e',
          phone_number: 'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646',
          pixel_id: 'pixel_id_1',
          state: '4b650e5c4785025dee7bd65e3c5c527356717d7a1c0bfef5b4ada8ca1e9cbe17',
          street_address: '948595bd0490ff9590917af8a8e7f12121e2eb021e3bb17bade16b60d80b9072',
          zip_code: 'e73ac16e69f060ee98b0fda5f66f48c4648ee26950e9bab3a097389853fd859e'
        },
        delivery_optimization: true,
        event_id: 'test_event_id',
        event_name: 'custom_conversion_1',
        event_time: '2024-01-08T13:52:50.212Z',
        event_timezone: 'America/Los_Angeles',
        partner_id: 'segment',
        test_event: 'false'
      })
    })
  })
})
