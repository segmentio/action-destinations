import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination, { destination } from '../index'
import { Subscription } from '../../../lib/browser-destinations'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'trackEvent',
    name: 'Track Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      name: {
        '@path': '$.name'
      }
    }
  }
]

describe('Sprig initialization', () => {
  test('can load Sprig', async () => {
    const [event] = await sprigWebDestination({
      envId: 'testEnvId',
      subscriptions
    })

    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const scripts = window.document.querySelectorAll('script')
    expect(scripts).toMatchSnapshot(`
      <script
          src="https://cdn.sprig.com/shim.js?id=testEnvId"
          status="loaded"
          type="text/javascript"
        />,
        <script>
          // the emptiness
        </script>,
    `)
  })
})
