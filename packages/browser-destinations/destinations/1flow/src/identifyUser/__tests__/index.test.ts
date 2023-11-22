import { Analytics, Context } from '@segment/analytics-next'
import _1FlowDestination, { destination } from '../../index'
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
      first_name: {
        '@path': '$.traits.first_name'
      },
      last_name: {
        '@path': '$.traits.last_name'
      },
      phone: {
        '@path': '$.traits.phone'
      },
      email: {
        '@path': '$.traits.email'
      },
      traits: {
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
    const [_1FlowIdentify] = await _1FlowDestination({
      id: 'testID',
      subscriptions
    })

    identify = _1FlowIdentify

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithTrack = {
        id: 'testID',
        initialized: true,
        emitter: { setSource: jest.fn() },
        track: mockIdentify,
        identify: jest.fn(),
        setSource: jest.fn(),
        load:identify 
      }
      return Promise.resolve(mockedWithTrack)
    })
    
  })

  test('it maps event parameters correctly to identify function ', async () => {
    jest.spyOn(destination.actions.identify, 'perform')

    await identify.identify?.(
      new Context({
        type: 'identify',
        anonymousId: 'anon-123',
        userId: 'some-user-123',
        traits: {
          first_name:"john",
          last_name:"ayub",
          phone: 123,
          email: '1flow@gmail.in'
        }
      })
    )
  })
})
