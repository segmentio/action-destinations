import { Analytics, Context } from '@segment/analytics-next'
import * as jsdom from 'jsdom'
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

  const windowSpy = jest.spyOn(global, 'window', 'get')
  const documentSpy = jest.spyOn(global, 'document', 'get')

  windowSpy.mockImplementation(() => {
    return jsd.window as unknown as Window & typeof globalThis
  })

  documentSpy.mockImplementation(() => jsd.window.document as unknown as Document)
  global.document.domain = 'segment.com'
})

test('can load braze', async () => {
  const [trackEvent] = await braze({
    api_key: 'api_key',
    endpoint: 'sdk.iad-01.braze.com',
    subscriptions: example
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
    subscriptions: example
  })

  await trackEvent.load(Context.system(), {} as Analytics)

  const scripts = window.document.querySelectorAll('script')
  // loads the service worker
  expect(scripts).toMatchInlineSnapshot(`
    NodeList [
      <script
        src="https://js.appboycdn.com/web-sdk/3.3/service-worker.js"
        status="loaded"
        type="text/javascript"
      />,
      <script>
        'hi'
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
      subscriptions: example
    })

    await trackEvent.load(Context.system(), {} as Analytics)

    const scripts = window.document.querySelectorAll('script')
    // loads the service worker
    expect(scripts).toMatchInlineSnapshot(`
    NodeList [
      <script
        src="https://js.appboycdn.com/web-sdk/3.0/service-worker.js"
        status="loaded"
        type="text/javascript"
      />,
      <script>
        'hi'
      </script>,
    ]
  `)
  })

  test('3.1', async () => {
    const [trackEvent] = await braze({
      api_key: 'api_key',
      endpoint: 'sdk.iad-01.braze.com',
      sdkVersion: '3.1',
      subscriptions: example
    })

    await trackEvent.load(Context.system(), {} as Analytics)

    const scripts = window.document.querySelectorAll('script')
    // loads the service worker
    expect(scripts).toMatchInlineSnapshot(`
    NodeList [
      <script
        src="https://js.appboycdn.com/web-sdk/3.1/service-worker.js"
        status="loaded"
        type="text/javascript"
      />,
      <script>
        'hi'
      </script>,
    ]
  `)
  })

  test('3.2', async () => {
    const [trackEvent] = await braze({
      api_key: 'api_key',
      endpoint: 'sdk.iad-01.braze.com',
      sdkVersion: '3.2',
      subscriptions: example
    })

    await trackEvent.load(Context.system(), {} as Analytics)

    const scripts = window.document.querySelectorAll('script')
    // loads the service worker
    expect(scripts).toMatchInlineSnapshot(`
    NodeList [
      <script
        src="https://js.appboycdn.com/web-sdk/3.2/service-worker.js"
        status="loaded"
        type="text/javascript"
      />,
      <script>
        'hi'
      </script>,
    ]
  `)
  })

  test('3.3', async () => {
    const [trackEvent] = await braze({
      api_key: 'api_key',
      endpoint: 'sdk.iad-01.braze.com',
      sdkVersion: '3.3',
      subscriptions: example
    })

    await trackEvent.load(Context.system(), {} as Analytics)

    const scripts = window.document.querySelectorAll('script')
    // loads the service worker
    expect(scripts).toMatchInlineSnapshot(`
    NodeList [
      <script
        src="https://js.appboycdn.com/web-sdk/3.3/service-worker.js"
        status="loaded"
        type="text/javascript"
      />,
      <script>
        'hi'
      </script>,
    ]
  `)
  })
})
