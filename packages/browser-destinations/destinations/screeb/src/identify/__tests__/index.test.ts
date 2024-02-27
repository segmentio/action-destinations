import { Analytics, Context } from '@segment/analytics-next'
import screebDestination, { destination } from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'identify',
    name: 'Identify',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      userId: {
        '@path': '$.userId'
      },
      anonymousId: {
        '@path': '$.anonymousId'
      },
      properties: {
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
  test('it maps event parameters correctly to identify function without user id but anonymous id', async () => {
    const [identify] = await screebDestination({
      websiteId: 'fake-website-id',
      subscriptions
    })

    jest.spyOn(destination.actions.identify, 'perform')
    await identify.load(Context.system(), {} as Analytics)

    await identify.identify?.(
      new Context({
        type: 'identify',
        userId: 'user-id',
        anonymousId: 'anonymous-id',
        traits: {
          firstname: 'Frida',
          lastname: 'Khalo',
          email: 'frida.khalo@screeb.app'
        }
      })
    )

    expect(destination.actions.identify.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          userId: 'user-id',
          anonymousId: 'anonymous-id',
          properties: {
            firstname: 'Frida',
            lastname: 'Khalo',
            email: 'frida.khalo@screeb.app'
          }
        }
      })
    )

    expect(window.$screeb.q).toStrictEqual([
      ['init', 'fake-website-id'],
      ['identity', 'user-id', { firstname: 'Frida', lastname: 'Khalo', email: 'frida.khalo@screeb.app' }]
    ])
  })
  test('it maps event parameters correctly to identify function ', async () => {
    const [identify] = await screebDestination({
      websiteId: 'fake-website-id',
      subscriptions
    })

    jest.spyOn(destination.actions.identify, 'perform')
    await identify.load(Context.system(), {} as Analytics)

    await identify.identify?.(
      new Context({
        type: 'identify',
        anonymousId: 'anonymous-id',
        traits: {
          firstname: 'Frida',
          lastname: 'Khalo',
          email: 'frida.khalo@screeb.app'
        }
      })
    )

    expect(destination.actions.identify.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          anonymousId: 'anonymous-id',
          properties: {
            firstname: 'Frida',
            lastname: 'Khalo',
            email: 'frida.khalo@screeb.app'
          }
        }
      })
    )

    expect(window.$screeb.q).toStrictEqual([
      ['init', 'fake-website-id'],
      ['identity', 'anonymous-id', { firstname: 'Frida', lastname: 'Khalo', email: 'frida.khalo@screeb.app' }]
    ])
  })
})
