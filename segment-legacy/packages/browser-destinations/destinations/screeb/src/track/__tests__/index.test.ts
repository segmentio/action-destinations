import { Analytics, Context } from '@segment/analytics-next'
import screebDestination, { destination } from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'track',
    name: 'Track',
    enabled: true,
    subscribe: 'type = "track"',
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
    const [track] = await screebDestination({
      websiteId: 'fake-website-id',
      subscriptions
    })

    jest.spyOn(destination.actions.track, 'perform')
    await track.load(Context.system(), {} as Analytics)

    await track.track?.(
      new Context({
        type: 'track',
        event: 'event-name',
        properties: {
          prop1: 1,
          prop2: 'pickle sandwish'
        }
      })
    )

    expect(destination.actions.track.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          name: 'event-name',
          properties: {
            prop1: 1,
            prop2: 'pickle sandwish'
          }
        }
      })
    )

    expect(window.$screeb.q).toStrictEqual([
      ['init', 'fake-website-id'],
      ['event.track', 'event-name', { prop1: 1, prop2: 'pickle sandwish' }]
    ])
  })
})
