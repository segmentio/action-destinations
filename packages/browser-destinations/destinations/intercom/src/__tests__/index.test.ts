import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import intercomDestination, { destination } from '../index'
import nock from 'nock'

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
  beforeEach(() => {
    nock('https://api-iam.intercom.io').get('/').reply(200)
  })

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

    expect(window.intercomSettings).toBeDefined()
    expect(window.intercomSettings.app_id).toEqual('topSecretKey')
    expect(window.intercomSettings.installation_type).toEqual('s')

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
