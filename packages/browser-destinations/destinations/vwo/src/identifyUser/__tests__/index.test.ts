import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import vwoDestination, { destination } from '../../index'

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

describe('VWO.identifyUser', () => {
  const settings = {
    vwoAccountId: 654331
  }

  let identifyUser: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [identifyUserPlugin] = await vwoDestination({
      ...settings,
      subscriptions
    })
    identifyUser = identifyUserPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      window.VWO = {
        push: jest.fn(),
        event: jest.fn(),
        visitor: jest.fn()
      }
      return Promise.resolve(window.VWO)
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

    expect(window.VWO.visitor).toHaveBeenCalledWith(
      {
        'segment.textAttribute': 'Hello'
      },
      {
        source: 'segment.web'
      }
    )
  })
})
