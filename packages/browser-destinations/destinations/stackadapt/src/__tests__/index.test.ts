import { Analytics, Context } from '@segment/analytics-next'
import stackadapt, { destination } from '..'

describe('StackAdapt', () => {
  test('can load stackadapt pixel', async () => {
    const [event] = await stackadapt({
      universalPixelId: 'test',
      subscriptions: [
        {
          enabled: true,
          name: 'Track Event',
          subscribe: 'type = "track"',
          partnerAction: 'trackEvent',
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
    })

    destination.actions.trackEvent.perform = jest.fn()
    jest.spyOn(destination.actions.trackEvent, 'perform')
    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const ctx = await event.track?.(
      new Context({
        type: 'track',
        properties: {
          abc: 'abc'
        }
      })
    )

    expect(destination.actions.trackEvent.perform).toHaveBeenCalled()
    expect(ctx).not.toBeUndefined()

    const scripts = window.document.querySelectorAll('script')
    expect(scripts).toMatchInlineSnapshot(`
      NodeList [
        <script
          src="https://tags.srv.stackadapt.com/events.js"
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
