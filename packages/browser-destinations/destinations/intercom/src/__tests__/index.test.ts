import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import intercomDestination, { destination } from '../index'

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
      },
      revenue: {
        '@path': '$.properties.revenue'
      },
      currency: {
        '@path': '$.properties.currency'
      }
    }
  }
]

describe('Intercom (actions)', () => {
  test('loads Intercom with just appID', async () => {
    const [event] = await intercomDestination({
      appId: 'topSecretKey',
      richLinkProperties: ['article'],
      activator: '#test',
      subscriptions
    })

    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const scripts = window.document.querySelectorAll('script')
    expect(scripts).toMatchInlineSnapshot(`
      NodeList [
        <script
          src="https://widget.intercom.io/widget/topSecretKey"
          type="text/javascript"
        />,
        <script>
          // the emptiness
        </script>,
      ]
    `)
  })
})
