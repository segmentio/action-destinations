import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination, { destination } from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'identifyUser',
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
      traits: {
        '@path': '$.traits'
      }
    }
  }
]

describe('identifyUser', () => {
  beforeAll(() => {
    jest.mock('@segment/browser-destination-runtime/load-script', () => ({
      loadScript: (_src: any, _attributes: any) => {}
    }))
  })
  test('it maps event parameters correctly to identify function ', async () => {
    const [identifyEvent] = await sprigWebDestination({
      envId: 'testEnvId',
      subscriptions
    })

    destination.actions.identifyUser.perform = jest.fn()
    jest.spyOn(destination.actions.identifyUser, 'perform')
    await identifyEvent.load(Context.system(), {} as Analytics)

    await identifyEvent.identify?.(
      new Context({
        type: 'identify',
        anonymousId: 'anonymous-id-0',
        userId: 'user-id-1',
        traits: {
          email: 'test-email-2@gmail.com'
        }
      })
    )

    expect(destination.actions.identifyUser.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          anonymousId: 'anonymous-id-0',
          userId: 'user-id-1',
          traits: {
            email: 'test-email-2@gmail.com'
          }
        }
      })
    )
  })
})
