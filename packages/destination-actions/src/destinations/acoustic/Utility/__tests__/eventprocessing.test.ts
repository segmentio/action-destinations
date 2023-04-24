import { parseSections, addUpdateEvents } from '../eventprocessing'

jest.mock('@segment/actions-core')
jest.mock('lodash/flatten')
jest.mock('lodash/get')
jest.mock('../../generated-types')
jest.mock('../../receiveEvents/generated-types')
jest.mock('../tablemaintutilities')

describe('parseSections', () => {
  it('parseSections should be present', () => {
    //const parseResults: { [key: string]: string } = {}
    expect(parseSections).toBeDefined()
  })

  it('parseSections should return a complete, non-empty KV result', () => {
    //const parseResults: { [key: string]: string } = {}

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
    } as object as { [key: string]: string }

    const outcome = {
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
      'products.0.brand': 'Pura',
      'products.0.category': 'Fragrance',
      'products.0.image_url':
        'https://cdn.shopify.com/s/files/1/0023/0021/5405/products/SimplyLavender_Prod_1.jpg?v=1649347142',
      'products.0.name': 'Simply Lavender',
      'products.0.presentment_amount': '12.99',
      'products.0.presentment_currency': 'USD',
      'products.0.price': 12.99,
      'products.0.product_id': '1542783500397',
      'products.0.quantity': 1,
      'products.0.shopify_product_id': '1542783500397',
      'products.0.shopify_variant_id': '14369408221293',
      'products.0.sku': 'NGL',
      'products.0.url': 'https://pura-scents.myshopify.com/products/simply-lavender',
      'products.0.variant': 'Simply Lavender',
      'products.1.brand': 'NEST New York',
      'products.1.category': 'Fragrance',
      'products.1.image_url':
        'https://cdn.shopify.com/s/files/1/0023/0021/5405/products/Grapefruit_Prod_1.jpg?v=1649344617',
      'products.1.name': 'Grapefruit',
      'products.1.presentment_amount': '18.99',
      'products.1.presentment_currency': 'USD',
      'products.1.price': 18.99,
      'products.1.product_id': '3979374755949',
      'products.1.quantity': 1,
      'products.1.shopify_product_id': '3979374755949',
      'products.1.shopify_variant_id': '29660017000557',
      'products.1.sku': 'MXV',
      'products.1.url': 'https://pura-scents.myshopify.com/products/grapefruit',
      'products.1.variant': 'Grapefruit',
      sent_from: 'Littledata app',
      shipping_method: 'Standard Shipping (5-7 days)',
      source_name: 'web',
      step: 2
    }

    expect(parseSections(section, 0)).toEqual(outcome)
  })

  it('parseSections should match correct outcome', () => {
    //const parseResults: { [key: string]: string } = {}

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
    } as object as { [key: string]: string }

    expect(parseSections(section, 0)).toMatchSnapshot()
  })
})

describe('addUpdateEvents', () => {
  it('should be present', () => {
    expect(addUpdateEvents).toBeDefined()
  })

  it('addUpdateEvents should return expected output', async () => {
    // const retValue = await addUpdateEvents(request,payload,settings,auth,email);

    const payload = {
      email: 'jhaltiw99@gmail.com',
      type: 'track',
      timestamp: '2023-02-12T15:07:21.381Z',
      context: {
        integration: {
          name: 'shopify_littledata',
          version: '9.1'
        },
        library: {
          name: 'analytics-node',
          version: '3.5.0'
        },
        traits: {
          address: {
            city: 'greenville',
            country: 'us',
            postalCode: '29609',
            state: 'sc'
          },
          email: 'jhaltiw@gmail.com',
          firstName: 'james',
          lastName: 'haltiwanger'
        }
      },
      properties: {
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
            image_url:
              'https://cdn.shopify.com/s/files/1/0023/0021/5405/products/SimplyLavender_Prod_1.jpg?v=1649347142',
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
    }

    expect(addUpdateEvents(payload, 'jhaltiw@gmail.com', 100)).toMatchSnapshot()
  })
})
