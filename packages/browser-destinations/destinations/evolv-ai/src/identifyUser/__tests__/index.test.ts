import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import evolvDestination, { destination } from '../../index'

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

describe('identifyUser', () => {
  const settings = {}

  let identifyUser: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [identifyUserPlugin] = await evolvDestination({
      ...settings,
      subscriptions
    })
    identifyUser = identifyUserPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      window.evolv = {
        client: {
          emit: jest.fn(),
          on: jest.fn(),
          getDisplayName: jest.fn()
        },
        context: {
          update: jest.fn(),
          get: jest.fn()
        }
      }
      return Promise.resolve(window.evolv)
    })
    await identifyUser.load(Context.system(), {} as Analytics)
  })

  test('contest attributes', async () => {
    const context = new Context({
      type: 'identify',
      traits: {
        textAttribute: 'test'
      }
    })
    await identifyUser.identify?.(context)

    expect(window.evolv.context.update).toHaveBeenCalledWith({
      'segment.textAttribute': 'test'
    })
  })
})
