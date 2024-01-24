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
