import { Analytics, Context } from '@segment/analytics-next'
import hubbleDestination, { destination } from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'track',
    name: 'Track event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      event: {
        '@path': '$.event'
      },
      attributes: {
        '@path': '$.properties'
      }
    }
  }
]

describe('track', () => {
  beforeAll(() => {
    jest.mock('@segment/browser-destination-runtime/load-script', () => ({
      loadScript: (_src: any, _attributes: any) => {}
    }))
    jest.mock('@segment/browser-destination-runtime/resolve-when', () => ({
      resolveWhen: (_fn: any, _timeout: any) => {}
    }))
  })
  test('it maps event parameters correctly to track function', async () => {
    const [track] = await hubbleDestination({
      appID: 'testID',
      subscriptions
    })

    await track.load(Context.system(), {} as Analytics)
    jest.spyOn(destination.actions.track, 'perform')

    await track.track?.(
      new Context({
        type: 'track',
        event: 'event-test',
        properties: {
          prop1: 'something',
          prop2: 'another-thing'
        }
      })
    )

    expect(destination.actions.track.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          event: 'event-test',
          attributes: {
            prop1: 'something',
            prop2: 'another-thing'
          }
        }
      })
    )
  })
})
