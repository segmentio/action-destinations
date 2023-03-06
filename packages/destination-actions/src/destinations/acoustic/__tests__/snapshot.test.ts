import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'receiveEvents'
const destinationSlug = 'actions-acoustic-campaign-cloud'
const seedName = `${destinationSlug}#${actionSlug}`

const e = {
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
}
console.log(e.context.traits.email)

const event = createTestEvent({
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
})

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]

    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)
    console.log('Required Fields test\n' + eventData)

    // nock(/.*/).persist().get(/.*/).reply(200)
    // nock(/.*/).persist().post(/.*/).reply(200)
    // nock(/.*/).persist().put(/.*/).reply(200)

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: '1d99f8d8-0897-4090-983a-c517cc54032e',
      client_secret: '124bd238-0987-40a2-b8fb-879ddd4d3241',
      'refresh-token': 'rD-7E2r8BynGDaapr13oJV9BxQr20lsYGN9RPkbrtPtAS1'
    })

    const aa = nock('https://api-campaign-us-2.goacoustic.com').post('/oauth/token').query(params).reply(200)
    const ap = nock('https://api-campaign-us-2.goacoustic.com').post('/xmlapi').reply(200)

    aa.isDone
    ap.isDone

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      settings: settingsData,
      auth: undefined,
      useDefaultMappings: true
    })

    const request = responses[0].request
    const rawBody = await request.text()

    //const json = JSON.parse(rawBody)

    expect(rawBody).toContain('<SUCCESS>true</SUCCESS>')
    expect(request.headers).toMatchSnapshot()
    expect(rawBody).toMatchSnapshot()
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    console.log('All Fields test:\n' + eventData)

    //nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    //nock(/.*/).persist().put(/.*/).reply(200)

    // const event = createTestEvent({
    //   properties: eventData
    // })

    const event = createTestEvent({
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
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      useDefaultMappings: true,
      settings: settingsData,
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    const json = JSON.parse(rawBody)
    expect(json).toMatchSnapshot()
  })
})
