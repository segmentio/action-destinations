import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import commandBarDestination, { destination } from '../../index'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'identifyUser',
    name: 'Identify User',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      userId: {
        '@path': '$.userId'
      },
      traits: {
        '@path': '$.traits'
      },
      hmac: {
        '@path': '$.context.CommandBar.hmac'
      },
      formFactor: {
        '@path': '$.context.CommandBar.formFactor'
      }
    }
  }
]

describe('CommandBar.boot when with deploy enabled', () => {
  const settings = {
    orgId: 'xxxxxxxx'
  }
  let mockCommandBarBoot: jest.Mock<any, any>
  let mockCommandBarMetadataBatch: jest.Mock<any, any>

  let identifyUser: any

  beforeEach(async () => {
    const [identifyUserPlugin] = await commandBarDestination({
      ...settings,
      subscriptions
    })

    identifyUser = identifyUserPlugin

    mockCommandBarBoot = jest.fn()
    mockCommandBarMetadataBatch = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithBoot = {
        boot: mockCommandBarBoot,
        addMetadataBatch: mockCommandBarMetadataBatch,
        trackEvent: jest.fn()
      }
      return Promise.resolve(mockedWithBoot)
    })
    await identifyUser.load(Context.system(), {} as Analytics)
  })

  it('Can add metadata via identify', async () => {
    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        userId: 'test-user',
        traits: {
          foo: 'bar'
        }
      })
    )

    expect(mockCommandBarMetadataBatch).toHaveBeenCalledWith({ foo: 'bar' }, true)
    expect(mockCommandBarBoot).not.toHaveBeenCalled()
  })
})

describe('CommandBar.addMetadataBatch with deploy disabled', () => {
  const settings = {
    orgId: 'xxxxxxxx',
    deploy: true
  }
  let mockCommandBarBoot: jest.Mock<any, any>
  let mockCommandBarMetadataBatch: jest.Mock<any, any>

  let identifyUser: any

  beforeEach(async () => {
    const [identifyUserPlugin] = await commandBarDestination({
      ...settings,
      subscriptions
    })

    identifyUser = identifyUserPlugin

    mockCommandBarBoot = jest.fn()
    mockCommandBarMetadataBatch = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithBoot = {
        boot: mockCommandBarBoot,
        addMetadataBatch: mockCommandBarMetadataBatch,
        trackEvent: jest.fn()
      }
      return Promise.resolve(mockedWithBoot)
    })
    await identifyUser.load(Context.system(), {} as Analytics)
  })

  it('Can boot via identify', async () => {
    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        userId: 'test-user',
        traits: {
          foo: 'bar'
        }
      })
    )

    expect(mockCommandBarBoot).toHaveBeenCalledWith('test-user', { foo: 'bar' }, {})
    expect(mockCommandBarMetadataBatch).not.toHaveBeenCalled()
  })

  it('Can pass instanceAttributes to boot', async () => {
    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        userId: 'test-user',
        traits: {
          foo: 'bar'
        },
        context: {
          CommandBar: {
            hmac: 'x',
            formFactor: {
              type: 'inline',
              rootElement: 'commandbar-inline-root'
            }
          }
        }
      })
    )

    expect(mockCommandBarBoot).toHaveBeenCalledWith(
      'test-user',
      { foo: 'bar' },
      {
        hmac: 'x',
        formFactor: {
          type: 'inline',
          rootElement: 'commandbar-inline-root'
        }
      }
    )
    expect(mockCommandBarMetadataBatch).not.toHaveBeenCalled()
  })
})
