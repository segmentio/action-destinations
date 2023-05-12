import { Analytics, Context } from '@segment/analytics-next'
import screebDestination, { destination } from '../../index'
import { Subscription } from '../../../../lib/browser-destinations'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'alias',
    name: 'Alias',
    enabled: true,
    subscribe: 'type = "alias"',
    mapping: {
      userId: {
        '@path': '$.userId'
      },
      anonymousId: {
        '@path': '$.anonymousId'
      }
    }
  }
]

describe('alias', () => {
  beforeAll(() => {
    jest.mock('../../../../runtime/load-script', () => ({
      loadScript: (_src: any, _attributes: any) => {}
    }))
  })
  test('it maps event parameters correctly to alias function', async () => {
    const [alias] = await screebDestination({
      websiteId: 'fake-website-id',
      subscriptions
    })

    jest.spyOn(destination.actions.alias, 'perform')
    await alias.load(Context.system(), {} as Analytics)

    await alias.alias?.(
      new Context({
        type: 'alias',
        userId: 'user-id',
        anonymousId: 'anonymous-id'
      })
    )

    expect(destination.actions.alias.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          userId: 'user-id',
          anonymousId: 'anonymous-id'
        }
      })
    )

    expect(window.$screeb.q).toStrictEqual([
      ['init', 'fake-website-id'],
      ['identity', 'user-id']
    ])
  })
  test('it maps event parameters correctly to alias function without user id but anonymous id', async () => {
    const [alias] = await screebDestination({
      websiteId: 'fake-website-id',
      subscriptions
    })

    jest.spyOn(destination.actions.alias, 'perform')
    await alias.load(Context.system(), {} as Analytics)

    await alias.alias?.(
      new Context({
        type: 'alias',
        anonymousId: 'anonymous-id'
      })
    )

    expect(destination.actions.alias.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          anonymousId: 'anonymous-id'
        }
      })
    )

    expect(window.$screeb.q).toStrictEqual([
      ['init', 'fake-website-id'],
      ['identity', 'anonymous-id']
    ])
  })
})
