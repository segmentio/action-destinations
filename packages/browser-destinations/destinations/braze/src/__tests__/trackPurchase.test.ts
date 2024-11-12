import { Analytics, Context } from '@segment/analytics-next'
import brazeDestination, { destination } from '../index'

const testSdkVersions = ['3.5', '4.1']

testSdkVersions.forEach((sdkVersion) => {
  test(`reports products when present (v${sdkVersion})`, async () => {
    const initializeSpy = jest.spyOn(destination, 'initialize')

    const [trackPurchase] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      sdkVersion,
      doNotLoadFontAwesome: true,
      subscriptions: [
        {
          partnerAction: 'trackPurchase',
          name: 'Log Purchase',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {
            purchaseProperties: {
              '@path': '$.properties'
            },
            products: {
              '@path': '$.properties.products'
            }
          }
        }
      ]
    })

    await trackPurchase.load(Context.system(), new Analytics({ writeKey: '123' }))

    // Spy on the braze APIs now that braze has been loaded.
    const { instance: braze } = await initializeSpy.mock.results[0].value
    const brazeLogPurchase = jest.spyOn(braze, 'logPurchase').mockReturnValue(true)

    await trackPurchase.track?.(
      new Context({
        type: 'track',
        properties: {
          banana: 'yellow',
          products: [
            {
              product_id: 'p_123',
              price: 399,
              currency: 'BGP',
              quantity: 2
            },
            {
              product_id: 'p_456',
              price: 0
            }
          ]
        }
      })
    )

    expect(brazeLogPurchase.mock.calls[0]).toMatchSnapshot()

    // applying defaults
    expect(brazeLogPurchase.mock.calls[1]).toMatchSnapshot()
  })
})

describe('trackPurchase', () => {
  const defaultMapping = {
    purchaseProperties: {
      '@path': '$.properties'
    },
    products: [
      {
        product_id: {
          '@path': '$.properties.products.0.sku'
        },
        price: {
          '@path': '$.properties.products.0.price'
        },
        currency: {
          '@path': '$.properties.products.0.currency'
        },
        quantity: {
          '@path': '$.properties.products.0.quantity'
        }
      }
    ]
  }

  it('TrackPurchase with default mapping', async () => {
    const initializeSpy = jest.spyOn(destination, 'initialize')
    const [trackPurchase] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      sdkVersion: '5.4',
      doNotLoadFontAwesome: true,
      subscriptions: [
        {
          partnerAction: 'trackPurchase',
          name: 'Log Purchase',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {
            purchaseProperties: {
              '@path': '$.properties'
            },
            products: {
              '@path': '$.properties.products'
            }
          }
        }
      ]
    })

    await trackPurchase.load(Context.system(), new Analytics({ writeKey: '123' }))

    const { instance: braze } = await initializeSpy.mock.results[0].value
    const brazeLogPurchase = jest.spyOn(braze, 'logPurchase').mockReturnValue(true)

    const productProperties = {
      banana: 'yellow',
      products: [
        {
          product_id: 'p_123',
          price: 100
        },
        {
          product_id: 'p_456',
          price: 488,
          currency: 'USD',
          quantity: 3
        }
      ]
    }

    await trackPurchase.track?.(
      new Context({
        type: 'track',
        name: 'Order Completed',
        properties: productProperties
      })
    )

    expect(brazeLogPurchase).toHaveBeenCalledTimes(2)
    expect(brazeLogPurchase).toHaveBeenCalledWith('p_123', 100, 'USD', 1, productProperties)
    expect(brazeLogPurchase).toHaveBeenCalledWith('p_456', 488, 'USD', 3, productProperties)
  })

  it('Should map product properties', async () => {
    const initializeSpy = jest.spyOn(destination, 'initialize')
    const [trackPurchase] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      sdkVersion: '5.4',
      doNotLoadFontAwesome: true,
      subscriptions: [
        {
          partnerAction: 'trackPurchase',
          name: 'Log Purchase',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: defaultMapping
        }
      ]
    })

    await trackPurchase.load(Context.system(), new Analytics({ writeKey: '123' }))

    const { instance: braze } = await initializeSpy.mock.results[0].value
    const brazeLogPurchase = jest.spyOn(braze, 'logPurchase').mockReturnValue(true)

    await trackPurchase.track?.(
      new Context({
        type: 'track',
        name: 'Order Completed',
        properties: {
          banana: 'yellow',
          products: [
            {
              sku: 'sku_123',
              price: 399,
              currency: 'BGP',
              quantity: 2
            }
          ]
        }
      })
    )

    expect(brazeLogPurchase).toHaveBeenCalledTimes(1)
    expect(brazeLogPurchase).toHaveBeenCalledWith('sku_123', 399, 'BGP', 2, {
      banana: 'yellow',
      products: [{ sku: 'sku_123', price: 399, currency: 'BGP', quantity: 2 }]
    })
  })

  it('TrackPurchase with only product required properties', async () => {
    const initializeSpy = jest.spyOn(destination, 'initialize')
    const [trackPurchase] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      sdkVersion: '5.4',
      doNotLoadFontAwesome: true,
      subscriptions: [
        {
          partnerAction: 'trackPurchase',
          name: 'Log Purchase',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: defaultMapping
        }
      ]
    })

    await trackPurchase.load(Context.system(), new Analytics({ writeKey: '123' }))

    const { instance: braze } = await initializeSpy.mock.results[0].value
    const brazeLogPurchase = jest.spyOn(braze, 'logPurchase').mockReturnValue(true)

    await trackPurchase.track?.(
      new Context({
        type: 'track',
        name: 'Order Completed',
        properties: {
          banana: 'yellow',
          products: [
            {
              sku: 'sku_123',
              price: 100
            }
          ]
        }
      })
    )

    expect(brazeLogPurchase).toHaveBeenCalledTimes(1)
    expect(brazeLogPurchase).toHaveBeenCalledWith('sku_123', 100, 'USD', 1, {
      banana: 'yellow',
      products: [{ sku: 'sku_123', price: 100 }]
    })
  })
})
