import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination, { API_URL } from '../../index'

const testDestination = createTestIntegration(Destination)

describe('ActablePredictive.sendTransactionEvent', () => {
  function setUpTest() {
    // nockAuth()
    const nockRequests: any[] /* (typeof nock.ReplyFnContext.req)[] */ = []
    nock(API_URL)
      .post('')
      .reply(200, function (_uri, _requestBody) {
        nockRequests.push(this.req)
        return {}
      })
  }
  test('testTransactionEvent', async () => {
    setUpTest()

    const event = createTestEvent({
      userId: 'peterpan',
      type: 'track',
      timestamp: '2021-10-05T15:30:35Z',
      properties: {
        checkout_id: 'fksdjfsdjfisjf9sdfjsd9f',
        order_id: '50314b8e9bcf000000000000',
        affiliation: 'Google Store',
        total: 27.5,
        subtotal: 22.5,
        revenue: 25.0,
        shipping: 3,
        tax: 2,
        discount: 2.5,
        coupon: 'hasbros',
        currency: 'USD',
        products: [
          {
            product_id: '507f1f77bcf86cd799439011',
            sku: '45790-32',
            name: 'Monopoly: 3rd Edition',
            price: 19,
            quantity: 1,
            category: 'Games',
            url: 'https://www.example.com/product/path',
            image_url: 'https:///www.example.com/product/path.jpg',
            coupon: 'FALLSALE20'
          },
          {
            product_id: '505bd76785ebb509fc183733',
            sku: '46493-32',
            name: 'Uno Card Game',
            price: 3,
            quantity: 2,
            category: 'Games'
          }
        ]
      }
    })

    const r = await testDestination.testAction('sendTransactionEvent', {
      event,
      settings: { client_id: 'foo', client_secret: 'bar' },
      useDefaultMappings: true
    })

    const recievedEvent = r[0].options.json as any
    expect(r.length).toBe(1)
    expect(recievedEvent.data[0]).toMatchObject({
      customer_id: 'peterpan',
      purchase_datetime: 1633447835,
      stream_key: 'transaction',
      product_column: '507f1f77bcf86cd799439011|505bd76785ebb509fc183733',
      discount_code: 'FALLSALE20'
    })
  })
})
