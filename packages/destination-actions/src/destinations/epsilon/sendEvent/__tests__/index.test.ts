import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)
const settings: Settings = {
  dtm_cid: 'test_cid'
}

const domain = 'https://login.dotomi.com'
const path = '/tags'

const payload = {
  event: 'Application Installed',
  type: 'track',
  messageId: 'msg_123',
  userId: 'user_id_1',
  context: {
    device: {
      id: 'device_id_1',
      advertisingId: 'advertising_id_1',
      type: 'ios'
    },
    app: {
      namespace: 'com.test.app',
      version: '1.0.0'
    },
    userAgent: 'dtm_user_agent_1',
    ip: '8.8.8.8'
  },
  properties: {
    dtm_fid: 'test_fid',
    promo_id: 'test_promo_id',
    dtm_event: 'firstOpen',
    customEventName: null,
    phone: '+12345678765432',
    email: 'test@test.com',
    department: 'Test Product Department',
    category: 'test_product_category_1',
    sub_category: 'test_product_sub_category_1',
    product_id: 'test_product_id_1',
    brand: 'test_product_brand_1',
    upc: 'test_upc_1',
    mpn: 'test_mpn_1',
    order_id: 'test_order_id_1',
    total: 100.0,
    products: [
      {
        product_id: 'test_product_id_1',
        quantity: 1,
        discount: 20,
        price: 100.0
      }
    ],
    currency: 'USD',
    order_type: 'test_order_type_1',
    store_location: 'test_store_location_1'
  }
} as Partial<SegmentEvent>

const mapping = {
  dtm_fid: { '@path': '$.properties.dtm_fid' },
  promo_id: { '@path': '$.properties.promo_id' },
  dtm_event: { '@path': '$.properties.dtm_event' },
  customEventName: { '@path': '$.event' },
  identifiers: {
    deviceID: { '@path': '$.context.device.id' },
    advertisingId: { '@path': '$.context.device.advertisingId' },
    dtm_user_agent: { '@path': '$.context.userAgent' },
    dtm_user_ip: { '@path': '$.context.ip' },
    dtm_email_hash: { '@path': '$.properties.email' },
    dtm_mobile_hash: { '@path': '$.properties.phone' },
    dtm_user_id: { '@path': '$.userId' }
  },
  dtmc_department: { '@path': '$.properties.department' },
  dtmc_category: { '@path': '$.properties.category' },
  dtmc_sub_category: { '@path': '$.properties.sub_category' },
  dtmc_product_id: { '@path': '$.properties.product_id' },
  dtmc_brand: { '@path': '$.properties.brand' },
  dtmc_upc: { '@path': '$.properties.upc' },
  dtmc_mpn: { '@path': '$.properties.mpn' },
  dtmc_transaction_id: { '@path': '$.properties.order_id' },
  dtm_conv_val: { '@path': '$.properties.total' },
  dtm_items: {
    '@arrayPath': [
      '$.properties.products',
      {
        product_id: { '@path': '$.product_id' },
        item_amount: { '@path': '$.price' },
        item_quantity: { '@path': '$.quantity' },
        item_discount: { '@path': '$.discount' }
      }
    ]
  },
  dtm_conv_curr: { '@path': '$.properties.currency' },
  dtmc_conv_type: { '@path': '$.properties.order_type' },
  dtmc_conv_store_location: { '@path': '$.properties.store_location' },
  id: { '@path': '$.messageId' },
  appId: { '@path': '$.context.app.namespace' },
  version: { '@path': '$.context.app.version' },
  deviceType: { '@path': '$.context.device.type' }
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('Epsilon.send', () => {
  it('Should send firstOpen event correctly', async () => {
    const event = createTestEvent(payload)

    const requestBody = {
      id: 'msg_123',
      jsonrpc: '2.0',
      method: 'syncEvent',
      params: {
        appId: 'com.test.app',
        dtm_event: 'firstOpen',
        version: '1.0.0',
        eventData: {
          dtmc_tms: 9,
          dtm_cid: 'test_cid',
          dtm_cmagic: 'c4b91e',
          dtm_fid: 'test_fid',
          dtm_promo_id: 'test_promo_id',
          idfa: 'advertising_id_1',
          idfv: 'device_id_1',
          dtm_user_agent: 'dtm_user_agent_1',
          dtm_user_ip: '8.8.8.8',
          dtm_email_hash: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
          dtm_mobile_hash: '4cc4f148d2a6e6d5def6cf6e1205b5b4701f7ff63e298ce5104e0cd6b86b97aa',
          dtm_user_id: 'user_id_1'
        }
      }
    }

    nock(domain).post(path, requestBody).reply(200)

    const response = await testDestination.testAction('sendEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(response.length).toBe(1)
    expect(response[0].status).toBe(200)
  })

  it('Should send department event correctly', async () => {
    const payload2 = {
      ...payload,
      event: 'Shop Department View',
      properties: {
        ...payload.properties,
        dtm_event: 'department'
      }
    }

    const event = createTestEvent(payload2)

    const requestBody = {
      id: 'msg_123',
      jsonrpc: '2.0',
      method: 'syncEvent',
      params: {
        appId: 'com.test.app',
        dtm_event: 'department',
        version: '1.0.0',
        eventData: {
          dtmc_tms: 9,
          dtm_cid: 'test_cid',
          dtm_cmagic: 'c4b91e',
          dtm_fid: 'test_fid',
          dtm_promo_id: 'test_promo_id',
          idfa: 'advertising_id_1',
          idfv: 'device_id_1',
          dtm_user_agent: 'dtm_user_agent_1',
          dtm_user_ip: '8.8.8.8',
          dtm_email_hash: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
          dtm_mobile_hash: '4cc4f148d2a6e6d5def6cf6e1205b5b4701f7ff63e298ce5104e0cd6b86b97aa',
          dtm_user_id: 'user_id_1',
          dtmc_department: 'Test Product Department'
        }
      }
    }

    nock(domain).post(path, requestBody).reply(200)

    const response = await testDestination.testAction('sendEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(response.length).toBe(1)
    expect(response[0].status).toBe(200)
  })

  it('Should send product event correctly', async () => {
    const payload2 = {
      ...payload,
      event: 'Shop Product View',
      properties: {
        ...payload.properties,
        dtm_event: 'product'
      }
    }

    const event = createTestEvent(payload2)

    const requestBody = {
      id: 'msg_123',
      jsonrpc: '2.0',
      method: 'syncEvent',
      params: {
        appId: 'com.test.app',
        dtm_event: 'product',
        version: '1.0.0',
        eventData: {
          dtmc_tms: 9,
          dtm_cid: 'test_cid',
          dtm_cmagic: 'c4b91e',
          dtm_fid: 'test_fid',
          dtm_promo_id: 'test_promo_id',
          idfa: 'advertising_id_1',
          idfv: 'device_id_1',
          dtm_user_agent: 'dtm_user_agent_1',
          dtm_user_ip: '8.8.8.8',
          dtm_email_hash: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
          dtm_mobile_hash: '4cc4f148d2a6e6d5def6cf6e1205b5b4701f7ff63e298ce5104e0cd6b86b97aa',
          dtm_user_id: 'user_id_1',
          dtmc_department: 'Test Product Department',
          dtmc_category: 'test_product_category_1',
          dtmc_sub_category: 'test_product_sub_category_1',
          dtmc_product_id: 'test_product_id_1',
          dtmc_brand: 'test_product_brand_1',
          dtmc_upc: 'test_upc_1',
          dtmc_mpn: 'test_mpn_1'
        }
      }
    }

    nock(domain).post(path, requestBody).reply(200)

    const response = await testDestination.testAction('sendEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(response.length).toBe(1)
    expect(response[0].status).toBe(200)
  })

  it('Should send custom event correctly', async () => {
    const payload2 = {
      ...payload,
      event: 'Custom Event 1',
      properties: {
        ...payload.properties,
        dtm_event: 'custom'
      }
    }

    const event = createTestEvent(payload2)

    const requestBody = {
      id: 'msg_123',
      jsonrpc: '2.0',
      method: 'syncEvent',
      params: {
        appId: 'com.test.app',
        dtm_event: 'Custom Event 1',
        version: '1.0.0',
        eventData: {
          dtmc_tms: 9,
          dtm_cid: 'test_cid',
          dtm_cmagic: 'c4b91e',
          dtm_fid: 'test_fid',
          dtm_promo_id: 'test_promo_id',
          idfa: 'advertising_id_1',
          idfv: 'device_id_1',
          dtm_user_agent: 'dtm_user_agent_1',
          dtm_user_ip: '8.8.8.8',
          dtm_email_hash: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
          dtm_mobile_hash: '4cc4f148d2a6e6d5def6cf6e1205b5b4701f7ff63e298ce5104e0cd6b86b97aa',
          dtm_user_id: 'user_id_1',
          dtmc_department: 'Test Product Department',
          dtmc_category: 'test_product_category_1',
          dtmc_sub_category: 'test_product_sub_category_1',
          dtmc_product_id: 'test_product_id_1',
          dtmc_brand: 'test_product_brand_1',
          dtmc_upc: 'test_upc_1',
          dtmc_mpn: 'test_mpn_1',
          dtmc_transaction_id: 'test_order_id_1',
          dtm_conv_val: 100,
          dtm_items: [
            {
              product_id: 'test_product_id_1',
              item_amount: 100,
              item_quantity: 1,
              item_discount: 20
            }
          ],
          dtm_conv_curr: 'USD',
          dtmc_conv_type: 'test_order_type_1',
          dtmc_conv_store_location: 'test_store_location_1'
        }
      }
    }

    nock(domain).post(path, requestBody).reply(200)

    const response = await testDestination.testAction('sendEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(response.length).toBe(1)
    expect(response[0].status).toBe(200)
  })

  it('Should send signIn event correctly - for Android', async () => {
    const payload2 = {
      ...payload,
      event: 'Signed In',
      properties: {
        ...payload.properties,
        dtm_event: 'signIn'
      },
      context: {
        ...payload.context,
        device: {
          ...payload.context?.device,
          type: 'android'
        }
      }
    }

    const event = createTestEvent(payload2)

    const requestBody = {
      id: 'msg_123',
      jsonrpc: '2.0',
      method: 'syncEvent',
      params: {
        appId: 'com.test.app',
        dtm_event: 'signIn',
        version: '1.0.0',
        eventData: {
          dtmc_tms: 9,
          dtm_cid: 'test_cid',
          dtm_cmagic: 'c4b91e',
          dtm_fid: 'test_fid',
          dtm_promo_id: 'test_promo_id',
          google_play_id: 'advertising_id_1',
          google_app_set_id: 'device_id_1',
          dtm_user_agent: 'dtm_user_agent_1',
          dtm_user_ip: '8.8.8.8',
          dtm_email_hash: 'f660ab912ec121d1b1e928a0bb4bc61b15f5ad44d5efdc4e1c92a25e99b8e44a',
          dtm_mobile_hash: '4cc4f148d2a6e6d5def6cf6e1205b5b4701f7ff63e298ce5104e0cd6b86b97aa',
          dtm_user_id: 'user_id_1'
        }
      }
    }

    nock(domain).post(path, requestBody).reply(200)

    const response = await testDestination.testAction('sendEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(response.length).toBe(1)
    expect(response[0].status).toBe(200)
  })
})
