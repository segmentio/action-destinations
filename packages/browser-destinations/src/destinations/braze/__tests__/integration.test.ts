import { Analytics, Context } from '@segment/analytics-next'
import * as jsdom from 'jsdom'
import braze, { destination } from '..'
import { Subscription } from '../../../lib/browser-destinations'

const example: Subscription[] = [
  {
    partnerAction: 'logCustomEvent',
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
  const [logCustomEvent] = await braze({
    api_key: 'api_key',
    endpoint: 'sdk.iad-01.braze.com',
    subscriptions: example
  })

  jest.spyOn(destination.actions.logCustomEvent, 'perform')
  jest.spyOn(destination, 'initialize')

  await logCustomEvent.load(Context.system(), {} as Analytics)
  expect(destination.initialize).toHaveBeenCalled()

  const ctx = await logCustomEvent.track?.(
    new Context({
      type: 'track',
      properties: {
        banana: '📞'
      }
    })
  )

  expect(destination.actions.logCustomEvent.perform).toHaveBeenCalled()
  expect(ctx).not.toBeUndefined()
})

test('loads the braze service worker', async () => {
  const [logCustomEvent] = await braze({
    api_key: 'api_key',
    endpoint: 'sdk.iad-01.braze.com',
    subscriptions: example
  })

  await logCustomEvent.load(Context.system(), {} as Analytics)

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
