import { Analytics, Context } from '@segment/analytics-next'
import stackadapt, { destination } from '..'

describe('StackAdapt', () => {
  test('can track events', async () => {
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
              '@path': '$.event'
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
    await event.track?.(
      new Context({
        type: 'track',
        event: 'checkout',
        properties: {
          item: 'nike react'
        }
      })
    )

    expect(destination.actions.trackEvent.perform).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        payload: {
          name: 'checkout',
          properties: {
            item: 'nike react'
          }
        }
      })
    )
  })
})
