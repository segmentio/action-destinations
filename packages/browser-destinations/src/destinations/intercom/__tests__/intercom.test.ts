import { Analytics, Context } from '@segment/analytics-next'
import * as jsdom from 'jsdom'
import intercomPlugins, { destination } from '..'
import { Subscription } from '../../../lib/browser-destinations'

const example: Subscription[] = [
  {
    partnerAction: 'show',
    name: 'Show',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      user_id: {
        '@path': '$.userId'
      },
      event_type: {
        '@path': '$.event'
      },
      time: {
        '@path': '$.timestamp'
      },
      event_properties: {
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
    // navigate to intercom itself, so we can actually load their app id
    url: 'https://intercom.com'
  })

  const windowSpy = jest.spyOn(window, 'window', 'get')
  windowSpy.mockImplementation(() => jsd.window as unknown as Window & typeof globalThis)
})

test('can load intercom', async () => {
  const [show] = await intercomPlugins({
    // using itercom's app_id from intercom.com
    app_id: 'tx2p130c',
    subscriptions: example
  })

  jest.spyOn(destination.actions.show, 'perform')
  jest.spyOn(destination, 'initialize')

  await show.load(Context.system(), {} as Analytics)
  expect(destination.initialize).toHaveBeenCalled()

  const ctx = await show.track?.(
    new Context({
      type: 'track',
      properties: {
        banana: '📞'
      }
    })
  )

  expect(destination.actions.show.perform).toHaveBeenCalled()
  expect(ctx).not.toBeUndefined()

  const scripts = window.document.querySelectorAll('script')
  expect(scripts).toMatchInlineSnapshot(`
    NodeList [
      <script
        src="https://widget.intercom.io/widget/tx2p130c"
        status="loaded"
        type="text/javascript"
      />,
      <script>
        'hi'
      </script>,
    ]
  `)
})
