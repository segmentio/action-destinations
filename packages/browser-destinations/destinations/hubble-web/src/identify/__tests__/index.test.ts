import { Analytics, Context } from '@segment/analytics-next'
import hubbleDestination, { destination } from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'identify',
    name: 'Identify User',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      anonymousId: {
        '@path': '$.anonymousId'
      },
      userId: {
        '@path': '$.userId'
      },
      attributes: {
        '@path': '$.traits'
      }
    }
  }
]

describe('identify', () => {
  beforeAll(() => {
    jest.mock('@segment/browser-destination-runtime/load-script', () => ({
      loadScript: (_src: any, _attributes: any) => {}
    }))
    jest.mock('@segment/browser-destination-runtime/resolve-when', () => ({
      resolveWhen: (_fn: any, _timeout: any) => {}
    }))
  })

  let identify: any
  const mockIdentify: jest.Mock<any, any> = jest.fn()

  beforeEach(async () => {
    const [hubbleIdentify] = await hubbleDestination({
      id: 'testID',
      subscriptions
    })

    identify = hubbleIdentify

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithTrack = {
        id: 'testID',
        initialized: true,
        emitter: { setSource: jest.fn() },
        track: mockIdentify,
        identify: jest.fn(),
        setSource: jest.fn()
      }
      return Promise.resolve(mockedWithTrack)
    })
    await identify.load(Context.system(), {} as Analytics)
  })

  test('it maps event parameters correctly to identify function ', async () => {
    jest.spyOn(destination.actions.identify, 'perform')
    await identify.load(Context.system(), {} as Analytics)

    await identify.identify?.(
      new Context({
        type: 'identify',
        anonymousId: 'anon-123',
        userId: 'some-user-123',
        traits: {
          someNumber: 123,
          hello: 'world',
          email: 'this_email@hubble.team'
        }
      })
    )

    expect(destination.actions.identify.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          anonymousId: 'anon-123',
          userId: 'some-user-123',
          attributes: {
            someNumber: 123,
            hello: 'world',
            email: 'this_email@hubble.team'
          }
        }
      })
    )
  })
})
