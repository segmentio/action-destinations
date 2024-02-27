import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination, { destination } from '../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

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
  beforeAll(() => {
    jest.mock('@segment/browser-destination-runtime/load-script', () => ({
      loadScript: (_src: any, _attributes: any) => {}
    }))
  })
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
