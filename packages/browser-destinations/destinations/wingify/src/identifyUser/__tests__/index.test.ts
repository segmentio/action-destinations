import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import wingifyDestination, { destination } from '../../index'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'identifyUser',
    name: 'Identify User',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      attributes: {
        '@path': '$.traits'
      }
    }
  }
]

describe('Wingify.identifyUser', () => {
  const settings = {
    wingifyAccountId: 654331
  }

  let identifyUser: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [identifyUserPlugin] = await wingifyDestination({
      ...settings,
      subscriptions
    })
    identifyUser = identifyUserPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      window.Wingify = {
        push: jest.fn(),
        event: jest.fn(),
        visitor: jest.fn()
      }
      return Promise.resolve(window.Wingify)
    })
    await identifyUser.load(Context.system(), {} as Analytics)
  })

  test('Visitor call with attributes', async () => {
    const context = new Context({
      type: 'identify',
      traits: {
        textAttribute: 'Hello'
      }
    })
    await identifyUser.identify?.(context)

    expect(window.Wingify.visitor).toHaveBeenCalledWith(
      {
        'segment.textAttribute': 'Hello'
      },
      {
        source: 'segment.web'
      }
    )
  })

  test('Visitor call with empty traits', async () => {
    const context = new Context({
      type: 'identify',
      traits: {}
    })
    await identifyUser.identify?.(context)

    expect(window.Wingify.visitor).toHaveBeenCalledWith(
      {},
      {
        source: 'segment.web'
      }
    )
  })

  test('queues identify when Wingify library has not loaded', async () => {
    window.Wingify = [] as unknown as typeof window.Wingify
    const pushSpy = jest.spyOn(window.Wingify, 'push')

    const context = new Context({
      type: 'identify',
      traits: {
        textAttribute: 'Hello'
      }
    })
    await identifyUser.identify?.(context)

    expect(pushSpy).toHaveBeenCalledWith([
      'visitor',
      {
        'segment.textAttribute': 'Hello'
      },
      {
        source: 'segment.web'
      }
    ])
  })
})
