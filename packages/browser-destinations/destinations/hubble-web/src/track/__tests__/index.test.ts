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

  let track: any
  const mockTrack: jest.Mock<any, any> = jest.fn()

  beforeEach(async () => {
    const [hubbleTrack] = await hubbleDestination({
      id: 'testID',
      subscriptions
    })

    track = hubbleTrack

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithTrack = {
        id: 'testID',
        initialized: true,
        emitter: { setSource: jest.fn() },
        track: mockTrack,
        identify: jest.fn(),
        setSource: jest.fn()
      }
      return Promise.resolve(mockedWithTrack)
    })
    await track.load(Context.system(), {} as Analytics)
  })

  test('it maps event parameters correctly to track function', async () => {
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
