import { Analytics, Context } from '@segment/analytics-next'
import iterateDestination, { destination } from '../index'
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

describe('Iterate initialization', () => {
  test('can load Iterate', async () => {
    const [event] = await iterateDestination({
      apiKey: 'abc123',
      subscriptions
    })

    jest.spyOn(destination.actions.trackEvent, 'perform')
    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const ctx = await event.track?.(
      new Context({
        type: 'track',
        name: 'example-event'
      })
    )

    expect(destination.actions.trackEvent.perform).toHaveBeenCalled()
    expect(ctx).not.toBeUndefined()

    const scripts = window.document.querySelectorAll('script')
    scripts[0].src = scripts[0].src.replace(/match-prod-.*.js/, 'match-prod.js')
    expect(scripts).toMatchInlineSnapshot(`
      NodeList [
        <script
          id="iterate-script"
          src="https://platform.iteratehq.com/match-prod.js"
          type="text/javascript"
        />,
        <script
          src="https://platform.iteratehq.com/loader.js"
          status="loaded"
          type="text/javascript"
        />,
        <script>
          // the emptiness
        </script>,
      ]
    `)
  })
})
