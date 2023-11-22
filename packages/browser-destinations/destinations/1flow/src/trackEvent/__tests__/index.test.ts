import { Analytics, Context } from '@segment/analytics-next'
import _1flowDestination, { destination } from '../../index'
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
      anonymousId: {
        '@path': '$.anonymousId'
      },
      userId: {
        '@path': '$.userId'
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

  let track: any
  const mockTrack: jest.Mock<any, any> = jest.fn()

  beforeEach(async () => {
    const [_1FlowIdentify] = await _1flowDestination({
      id: 'testID',
      subscriptions
    })

    track = _1FlowIdentify

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithTrack = {
        id: 'testID',
        initialized: true,
        emitter: { setSource: jest.fn() },
        track: mockTrack,
        identify: jest.fn(),
        setSource: jest.fn(),
        load:track 
      }
      return Promise.resolve(mockedWithTrack)
    })
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
