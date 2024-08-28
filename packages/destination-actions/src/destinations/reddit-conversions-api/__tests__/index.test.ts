import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'
const settings: Settings = {
  ad_account_id: 'ad_account_id_1',
  conversion_token: 'conversion_token_1',
  test_mode: false
}

describe('Reddit Conversions Api', () => {
  describe('testCustomEvent', () => {
    it('should send a Custom event', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Some Custom Event Name',
        messageId: 'test-message-id-contact',
        type: 'track',
        userId: 'user_id_1',
        properties: {
          click_id: 'click_id_1',
          conversion_id: 'conversion_id_1',
          currency: 'USD',
          quantity: 10,
          total: 100,
          opt_out: false,
          uuid: 'uuid_1',
          products: [
            { product_id: 'product_id_1', category: 'category_1', name: 'name_1' },
            { product_id: 'product_id_2', category: 'category_2', name: 'name_2' }
          ],
          email: 'test@test.com'
        },
        context: {
          userAgent: 'test-user-agent',
          ip: '111.111.111.111',
          device: {
            advertisingId: 'advertising_id_1'
          }
        }
      })

      nock('https://ads-api.reddit.com').post('/api/v2.0/conversions/events/ad_account_id_1').reply(200, {})
      const responses = await testDestination.testAction('customEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          custom_event_name: 'Some Custom Event Name'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        data: {
          events: [
            {
              click_id: 'click_id_1',
              event_at: '2024-01-08T13:52:50.212Z',
              event_metadata: {
                conversion_id: 'conversion_id_1',
                currency: 'USD',
                item_count: 10,
                products: [
                  {
                    category: 'category_1',
                    id: 'product_id_1',
                    name: 'name_1'
                  },
                  {
                    category: 'category_2',
                    id: 'product_id_2',
                    name: 'name_2'
                  }
                ],
                value_decimal: 100
              },
              event_type: {
                custom_event_name: 'Some Custom Event Name',
                tracking_type: 'Custom'
              },
              user: {
                email: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
                external_id: '3482ae91c8ec52c06e19d618d400b3985814bf705e00947a302ec849a6575c4c',
                ip_address: '5feaf188de296cd3b17f7c66fd3a2aec9b694815f2b1180631f7b52f57029777',
                opt_out: false,
                user_agent: 'test-user-agent',
                uuid: 'uuid_1'
              }
            }
          ],
          partner: 'SEGMENT',
          test_mode: false
        }
      })
    })
  })

  describe('testStandardEvent', () => {
    it('should send a Purchase Standard event', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Order Completed',
        messageId: 'test-message-id-contact',
        type: 'track',
        userId: 'user_id_1',
        properties: {
          click_id: 'click_id_1',
          conversion_id: 'conversion_id_1',
          currency: 'USD',
          quantity: 10,
          total: 100,
          opt_out: false,
          uuid: 'uuid_1',
          products: [
            { product_id: 'product_id_1', category: 'category_1', name: 'name_1' },
            { product_id: 'product_id_2', category: 'category_2', name: 'name_2' }
          ],
          email: 'test@test.com'
        },
        context: {
          userAgent: 'test-user-agent',
          ip: '111.111.111.111',
          device: {
            advertisingId: 'advertising_id_1'
          }
        }
      })

      nock('https://ads-api.reddit.com').post('/api/v2.0/conversions/events/ad_account_id_1').reply(200, {})
      const responses = await testDestination.testAction('standardEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          tracking_type: 'Purchase'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        data: {
          events: [
            {
              click_id: 'click_id_1',
              event_at: '2024-01-08T13:52:50.212Z',
              event_metadata: {
                conversion_id: 'conversion_id_1',
                currency: 'USD',
                item_count: 10,
                products: [
                  {
                    category: 'category_1',
                    id: 'product_id_1',
                    name: 'name_1'
                  },
                  {
                    category: 'category_2',
                    id: 'product_id_2',
                    name: 'name_2'
                  }
                ],
                value_decimal: 100
              },
              event_type: {
                tracking_type: 'Purchase'
              },
              user: {
                email: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
                external_id: '3482ae91c8ec52c06e19d618d400b3985814bf705e00947a302ec849a6575c4c',
                ip_address: '5feaf188de296cd3b17f7c66fd3a2aec9b694815f2b1180631f7b52f57029777',
                opt_out: false,
                user_agent: 'test-user-agent',
                uuid: 'uuid_1'
              }
            }
          ],
          partner: 'SEGMENT',
          test_mode: false
        }
      })
    })

    it('should send a Lead Standard event', async () => {
      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Lead Generated',
        messageId: 'test-message-id-contact',
        type: 'track',
        userId: 'user_id_1',
        properties: {
          click_id: 'click_id_1',
          conversion_id: 'conversion_id_1',
          currency: 'USD',
          total: 100,
          opt_out: false,
          uuid: 'uuid_1',
          products: [
            { product_id: 'product_id_1', category: 'category_1', name: 'name_1' },
            { product_id: 'product_id_2', category: 'category_2', name: 'name_2' }
          ],
          email: 'test@test.com'
        },
        context: {
          userAgent: 'test-user-agent',
          ip: '111.111.111.111',
          device: {
            advertisingId: 'advertising_id_1'
          }
        }
      })

      nock('https://ads-api.reddit.com').post('/api/v2.0/conversions/events/ad_account_id_1').reply(200, {})
      const responses = await testDestination.testAction('standardEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          tracking_type: 'Lead'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        data: {
          events: [
            {
              click_id: 'click_id_1',
              event_at: '2024-01-08T13:52:50.212Z',
              event_metadata: {
                conversion_id: 'conversion_id_1',
                currency: 'USD',
                products: [
                  {
                    category: 'category_1',
                    id: 'product_id_1',
                    name: 'name_1'
                  },
                  {
                    category: 'category_2',
                    id: 'product_id_2',
                    name: 'name_2'
                  }
                ],
                value_decimal: 100
              },
              event_type: {
                tracking_type: 'Lead'
              },
              user: {
                email: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
                external_id: '3482ae91c8ec52c06e19d618d400b3985814bf705e00947a302ec849a6575c4c',
                ip_address: '5feaf188de296cd3b17f7c66fd3a2aec9b694815f2b1180631f7b52f57029777',
                opt_out: false,
                user_agent: 'test-user-agent',
                uuid: 'uuid_1'
              }
            }
          ],
          partner: 'SEGMENT',
          test_mode: false
        }
      })
    })
  })
})
