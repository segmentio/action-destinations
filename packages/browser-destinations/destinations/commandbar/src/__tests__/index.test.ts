import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import commandBarDestination, { destination } from '../index'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'trackEvent',
    name: 'Show',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      event_name: {
        '@path': '$.event'
      },
      event_metadata: {
        '@path': '$.properties'
      }
    }
  }
]

describe('CommandBar initialization', () => {
  test('can load CommandBar with just orgId', async () => {
    const [event] = await commandBarDestination({
      orgId: '05f077f2',
      subscriptions
    })
    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const scripts = window.document.querySelectorAll('script')
    expect(scripts).toMatchInlineSnapshot(`
      NodeList [
        <script>
          // the emptiness
        </script>,
        <script
          src="https://api.commandbar.com/latest/05f077f2?version=2"
          type="text/javascript"
        />,
      ]
    `)
  })
})
