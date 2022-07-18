import { initialize, openSession, logPurchase } from '@braze/web-sdk'
import { Analytics, Context } from '@segment/analytics-next'
import brazeDestination from '../index'

const spyMethods = { initialize, openSession, logPurchase }

beforeEach(() => {
  // we're not really testing that braze loads here, so we'll just mock it out
  jest.spyOn(spyMethods, 'initialize').mockImplementation(() => true)
  jest.spyOn(spyMethods, 'openSession').mockImplementation(() => true)
})

test('reports products when present', async () => {
  const brazeLogPurchase = jest.spyOn(spyMethods, 'logPurchase').mockReturnValue(true)

  const [trackPurchase] = await brazeDestination({
    api_key: 'b_123',
    endpoint: 'endpoint',
    sdkVersion: '3.5',
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

  await trackPurchase.load(Context.system(), {} as Analytics)
  await trackPurchase.track?.(
    new Context({
      type: 'track',
      properties: {
        banana: 'yellow',
        purchaseProperties: {
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
      }
    })
  )

  expect(brazeLogPurchase.mock.calls[0]).toMatchInlineSnapshot(`undefined`)

  // applying defaults
  expect(brazeLogPurchase.mock.calls[1]).toMatchInlineSnapshot(`undefined`)
})
