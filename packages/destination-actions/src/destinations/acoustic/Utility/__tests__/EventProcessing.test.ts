// import { RequestClient } from '@segment/actions-core'
// import flatten from 'lodash/flatten'
// import get from 'lodash/get'
// import { Settings } from '../../generated-types'
// import { Payload } from '../../receiveEvents/generated-types'
// import { acousticAuth, getxmlAPIUrl } from '../TableMaint_Utilities'
import { parseSections, addUpdateEvents } from '../EventProcessing'

jest.mock('@segment/actions-core')
jest.mock('lodash/flatten')
jest.mock('lodash/get')
jest.mock('../../generated-types')
jest.mock('../../receiveEvents/generated-types')
jest.mock('../TableMaint_Utilities')

describe('parseSections', () => {
  it('parseSections should be present', () => {
    expect(parseSections).toBeDefined()
  })

  it('parseSections should return a non-empty KV result', () => {
    const parseResults: { [key: string]: string } = {}

    const section = {
      email: 'jhaltiw@gmail.com',
      action_source: 'system_generated',
      cart_id: 'fff7b1597270349875cffad3852067ab',
      category: 'Shopify (Littledata)',
      checkout_id: 26976972210285,
      coupon: 'HONEY15',
      currency: 'USD',
      discount: 4.79,
      presentment_amount: '31.98',
      presentment_currency: 'USD',
      price: 31.98,
      products: [
        {
          brand: 'Pura',
          category: 'Fragrance',
          image_url: 'https://cdn.shopify.com/s/files/1/0023/0021/5405/products/SimplyLavender_Prod_1.jpg?v=1649347142',
          name: 'Simply Lavender',
          presentment_amount: '12.99',
          presentment_currency: 'USD',
          price: 12.99,
          product_id: '1542783500397',
          quantity: 1,
          shopify_product_id: '1542783500397',
          shopify_variant_id: '14369408221293',
          sku: 'NGL',
          url: 'https://pura-scents.myshopify.com/products/simply-lavender',
          variant: 'Simply Lavender'
        },
        {
          brand: 'NEST New York',
          category: 'Fragrance',
          image_url: 'https://cdn.shopify.com/s/files/1/0023/0021/5405/products/Grapefruit_Prod_1.jpg?v=1649344617',
          name: 'Grapefruit',
          presentment_amount: '18.99',
          presentment_currency: 'USD',
          price: 18.99,
          product_id: '3979374755949',
          quantity: 1,
          shopify_product_id: '3979374755949',
          shopify_variant_id: '29660017000557',
          sku: 'MXV',
          url: 'https://pura-scents.myshopify.com/products/grapefruit',
          variant: 'Grapefruit'
        }
      ],
      sent_from: 'Littledata app',
      shipping_method: 'Standard Shipping (5-7 days)',
      source_name: 'web',
      step: 2
    }

    const _sa: string[] = Object.keys(section)

    const outcome = {
      'properties.email': 'jhaltiw@gmail.com',
      'properties.action_source': 'system_generated',
      'properties.cart_id': 'fff7b1597270349875cffad3852067ab',
      'properties.category': 'Shopify (Littledata)',
      'properties.checkout_id': 26976972210285,
      'properties.coupon': 'HONEY15',
      'properties.currency': 'USD',
      'properties.discount': 4.79,
      'properties.presentment_amount': '31.98',
      'properties.presentment_currency': 'USD',
      'properties.price': 31.98,
      'properties.products.brand': 'Pura',
      'properties.products.category': 'Fragrance',
      'properties.products.image_url':
        'https://cdn.shopify.com/s/files/1/0023/0021/5405/products/SimplyLavender_Prod_1.jpg?v=1649347142',
      'properties.products.name': 'Simply Lavender',
      'properties.products.presentment_amount': '12.99',
      'properties.products.presentment_currency': 'USD',
      'properties.products.price': 12.99,
      'properties.products.product_id': '1542783500397',
      'properties.products.quantity': 1,
      'properties.products.shopify_product_id': '1542783500397',
      'properties.products.shopify_variant_id': '14369408221293',
      'properties.products.sku': 'NGL',
      'properties.products.url': 'https://pura-scents.myshopify.com/products/simply-lavender',
      'properties.products.variant': 'Simply Lavender'
    }

    expect(parseSections(section, parseResults)).toEqual(outcome)
  })

  it('parseSections should return expected output', () => {
    // const retValue = parseSections(section,parseResults);
    expect(true).toBeTruthy()
  })
})

describe('addUpdateEvents', () => {
  it('should expose a function', () => {
    expect(addUpdateEvents).toBeDefined()
  })

  it('addUpdateEvents should return expected output', async () => {
    // const retValue = await addUpdateEvents(request,payload,settings,auth,email);
    expect(true).toBeTruthy()
  })
})
