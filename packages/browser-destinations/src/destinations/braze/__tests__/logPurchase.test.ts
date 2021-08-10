import appboy from '@braze/web-sdk'
import { Analytics, Context } from '@segment/analytics-next'
import * as jsdom from 'jsdom'
import brazeDestination from '../index'

beforeEach(async () => {
  jest.restoreAllMocks()
  jest.resetAllMocks()

  const html = `
  <!DOCTYPE html>
    <head>
      <script>'hi'</script>
    </head>
    <body>
    </body>
  </html>
  `.trim()

  const jsd = new jsdom.JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'https://segment.com'
  })

  const windowSpy = jest.spyOn(window, 'window', 'get')
  windowSpy.mockImplementation(() => jsd.window as unknown as Window & typeof globalThis)
})

beforeEach(() => {
  // we're not really testing that appboy loads here, so we'll just mock it out
  jest.spyOn(appboy, 'initialize').mockImplementation(() => true)
  jest.spyOn(appboy, 'openSession').mockImplementation(() => true)
})

test('changes the userId when present', async () => {
  const changeUser = jest.spyOn(appboy, 'changeUser').mockImplementationOnce(() => {})

  const [logPurchase] = await brazeDestination({
    api_key: 'b_123',
    endpoint: 'endpoint',
    subscriptions: [
      {
        partnerAction: 'logPurchase',
        name: 'Log Purchase',
        enabled: true,
        subscribe: 'type = "track"',
        mapping: {
          userId: {
            '@path': '$.properties.userId'
          }
        }
      }
    ]
  })

  await logPurchase.load(Context.system(), {} as Analytics)
  await logPurchase.track?.(
    new Context({
      type: 'track',
      properties: {
        userId: 'u_123'
      }
    })
  )

  expect(changeUser).toHaveBeenCalledWith('u_123')
})

test('does not change the userId when not present', async () => {
  const changeUser = jest.spyOn(appboy, 'changeUser').mockImplementationOnce(() => {})

  const [logPurchase] = await brazeDestination({
    api_key: 'b_123',
    endpoint: 'endpoint',
    subscriptions: [
      {
        partnerAction: 'logPurchase',
        name: 'Log Purchase',
        enabled: true,
        subscribe: 'type = "track"',
        mapping: {
          userId: {
            '@path': '$.properties.userId'
          }
        }
      }
    ]
  })

  await logPurchase.load(Context.system(), {} as Analytics)
  await logPurchase.track?.(
    new Context({
      type: 'track',
      properties: {}
    })
  )

  expect(changeUser).not.toHaveBeenCalledWith()
})

test('reports products when present', async () => {
  const brazeLogPurchase = jest.spyOn(appboy, 'logPurchase').mockReturnValue(true)

  const [logPurchase] = await brazeDestination({
    api_key: 'b_123',
    endpoint: 'endpoint',
    subscriptions: [
      {
        partnerAction: 'logPurchase',
        name: 'Log Purchase',
        enabled: true,
        subscribe: 'type = "track"',
        mapping: {
          products: {
            '@path': '$.properties.products'
          }
        }
      }
    ]
  })

  await logPurchase.load(Context.system(), {} as Analytics)
  await logPurchase.track?.(
    new Context({
      type: 'track',
      properties: {
        products: [
          {
            productId: 'p_123',
            price: 399,
            currencyCode: 'BGP',
            quantity: 2,
            purchaseProperties: {
              banana: 'yellow'
            }
          },
          {
            productId: 'p_456',
            price: 0
          }
        ]
      }
    })
  )

  expect(brazeLogPurchase.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      "p_123",
      399,
      "BGP",
      2,
      Object {
        "banana": "yellow",
      },
    ]
  `)

  // applying defaults
  expect(brazeLogPurchase.mock.calls[1]).toMatchInlineSnapshot(`
    Array [
      "p_456",
      0,
      "USD",
      1,
      undefined,
    ]
  `)
})
