import { Analytics, Context } from '@segment/analytics-next'
import braze, { destination } from '..'
import type { Subscription } from '../../../lib/browser-destinations'

const example: Subscription[] = [
  {
    partnerAction: 'trackEvent',
    name: 'Log Custom Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      name: {
        '@path': '$.name'
      },
      properties: {
        '@path': '$.properties'
      }
    }
  }
]

test('can load braze', async () => {
  const [trackEvent] = await braze({
    api_key: 'api_key',
    endpoint: 'sdk.iad-01.braze.com',
    subscriptions: example,
    doNotLoadFontAwesome: true,
    sdkVersion: '3.3'
  })

  jest.spyOn(destination.actions.trackEvent, 'perform')
  jest.spyOn(destination, 'initialize')

  await trackEvent.load(Context.system(), {} as Analytics)
  expect(destination.initialize).toHaveBeenCalled()

  const ctx = await trackEvent.track?.(
    new Context({
      type: 'track',
      properties: {
        banana: '📞'
      }
    })
  )

  expect(destination.actions.trackEvent.perform).toHaveBeenCalled()
  expect(ctx).not.toBeUndefined()
})

test('loads the braze service worker', async () => {
  const [trackEvent] = await braze({
    api_key: 'api_key',
    endpoint: 'sdk.iad-01.braze.com',
    subscriptions: example,
    doNotLoadFontAwesome: true,
    sdkVersion: '3.3'
  })

  await trackEvent.load(Context.system(), {} as Analytics)

  const scripts = window.document.querySelectorAll('script')
  // loads the service worker
  expect(scripts).toMatchInlineSnapshot(`
    NodeList [
      <script>
        // the emptyness
      </script>,
    ]
  `)
})

describe('loads different versions of braze service worker', () => {
  test('3.0', async () => {
    const [trackEvent] = await braze({
      api_key: 'api_key',
      endpoint: 'sdk.iad-01.braze.com',
      sdkVersion: '3.0',
      doNotLoadFontAwesome: true,
      subscriptions: example
    })

    await trackEvent.load(Context.system(), {} as Analytics)

    const scripts = window.document.querySelectorAll('script')
    // loads the service worker
    expect(scripts).toMatchInlineSnapshot(`
      NodeList [
        <script>
          // the emptyness
        </script>,
      ]
    `)
  })

  test('3.1', async () => {
    const [trackEvent] = await braze({
      api_key: 'api_key',
      endpoint: 'sdk.iad-01.braze.com',
      sdkVersion: '3.1',
      doNotLoadFontAwesome: true,
      subscriptions: example
    })

    await trackEvent.load(Context.system(), {} as Analytics)

    const scripts = window.document.querySelectorAll('script')
    // loads the service worker
    expect(scripts).toMatchInlineSnapshot(`
      NodeList [
        <script>
          // the emptyness
        </script>,
      ]
    `)
  })

  test('3.2', async () => {
    const [trackEvent] = await braze({
      api_key: 'api_key',
      endpoint: 'sdk.iad-01.braze.com',
      sdkVersion: '3.2',
      doNotLoadFontAwesome: true,
      subscriptions: example
    })

    await trackEvent.load(Context.system(), {} as Analytics)

    const scripts = window.document.querySelectorAll('script')
    // loads the service worker
    expect(scripts).toMatchInlineSnapshot(`
      NodeList [
        <script>
          // the emptyness
        </script>,
      ]
    `)
  })

  test('3.3', async () => {
    const [trackEvent] = await braze({
      api_key: 'api_key',
      endpoint: 'sdk.iad-01.braze.com',
      sdkVersion: '3.3',
      doNotLoadFontAwesome: true,
      subscriptions: example
    })

    await trackEvent.load(Context.system(), {} as Analytics)

    const scripts = window.document.querySelectorAll('script')

    expect(scripts).toMatchInlineSnapshot(`
      NodeList [
        <script>
          // the emptyness
        </script>,
      ]
    `)
  })
})
