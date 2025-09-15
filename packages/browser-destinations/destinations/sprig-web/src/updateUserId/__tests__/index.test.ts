import { Analytics, Context } from '@segment/analytics-next'
import sprigWebDestination, { destination } from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'updateUserId',
    name: 'Update User ID',
    enabled: true,
    subscribe: 'type = "alias"',
    mapping: {
      anonymousId: {
        '@path': '$.anonymousId'
      },
      userId: {
        '@path': '$.userId'
      }
    }
  }
]

describe('updateUserId', () => {
  beforeAll(() => {
    jest.mock('@segment/browser-destination-runtime/load-script', () => ({
      loadScript: (_src: any, _attributes: any) => {}
    }))
  })
  test('it maps event parameters correctly to alias function with user id', async () => {
    const [aliasEvent] = await sprigWebDestination({
      envId: 'testEnvId',
      subscriptions
    })

    destination.actions.updateUserId.perform = jest.fn()
    jest.spyOn(destination.actions.updateUserId, 'perform')
    await aliasEvent.load(Context.system(), {} as Analytics)

    await aliasEvent.alias?.(
      new Context({
        type: 'alias',
        userId: 'user-id-1'
      })
    )

    expect(destination.actions.updateUserId.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          userId: 'user-id-1'
        }
      })
    )
  })

  test('it maps event parameters correctly to alias function with anonymous id', async () => {
    const [aliasEvent] = await sprigWebDestination({
      envId: 'testEnvId',
      subscriptions
    })

    destination.actions.updateUserId.perform = jest.fn()
    jest.spyOn(destination.actions.updateUserId, 'perform')
    await aliasEvent.load(Context.system(), {} as Analytics)

    await aliasEvent.alias?.(
      new Context({
        type: 'alias',
        anonymousId: 'anonymous-id-0'
      })
    )

    expect(destination.actions.updateUserId.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          anonymousId: 'anonymous-id-0'
        }
      })
    )
  })
})
