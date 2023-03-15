// import { DestinationDefinition } from '@segment/actions-core'
// import { Settings } from '../generated-types'
// import receiveEvents from '../receiveEvents'
import { createTestIntegration } from '@segment/actions-core'
import { SegmentEvent } from '@segment/actions-core'
import Destination from '../index'
import nock from 'nock'

jest.mock('@segment/actions-core')
jest.mock('../generated-types')
jest.mock('../receiveEvents')

console.log(Destination.slug + '   -   ' + Destination.actions)

const testDestination = createTestIntegration(Destination)
const actionSlug = 'receiveEvents'
const destinationSlug = Destination.slug
const seedName = `${destinationSlug}#${actionSlug}`
const action = Destination.actions[actionSlug]
seedName.length
action

const settings = {
  a_pod: '',
  a_region: '',
  a_client_id: '',
  a_client_secret: '',
  a_refresh_token: ''
}

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
} as SegmentEvent
payload.anonymousId

describe('destination', () => {
  it('extendRequest should be present', () => {
    // const retValue = testDestination.extendRequest();
    expect(Destination.extendRequest).toBeDefined()
  })
})

describe('Destination ', () => {
  describe('receiveEvents', () => {
    it('should validate action fields', async () => {
      try {
        await testDestination.testAction('receiveEvents', {
          settings: settings,
          useDefaultMappings: true
        })
      } catch (err) {
        expect(err).toBeDefined()
      }

      const spy = jest.spyOn(Destination.actions.receiveEvents, 'perform')

      expect(spy).not.toHaveBeenCalled()
      //expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(
        expect.anything() //,
        // expect.objectContaining({
        //   payload: expect.arrayContaining([{ email: 'jhaltiw99@gmail.com' }])
        // })
      )

      it('receiveEvents should match correct, complete output', async () => {
        nock('https://api.getripe.com/core-backend').post('/identify').reply(200, {})

        const responses = await testDestination.testAction('recieveEvents', {
          mapping: { anonymousId: 'my-id', traits: {} },
          settings: { ...settings }
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
        expect(responses[0].data).toMatchObject({})
        expect(responses[0].options.body).toContain('my-id')
        expect(responses[0].options.body).toContain('traits')
      })
    })
  })
})
