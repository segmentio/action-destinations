import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from 'src/lib/browser-destinations'
import intercomDestination, { destination } from '../../index'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'trackEvent',
    name: 'Show',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      event_name: {
        '@path': '$.event'
      },
      event_metadata: {
        '@path': '$.properties'
      },
      price: {
        amount: { '@path': '$.properties.revenue' },
        currency: { '@path': '$.properties.currency' }
      }
    }
  }
]

describe('Intercom.trackEvent', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  test('maps price correctly', async () => {
    //boilerplate
    const [trackEvent] = await intercomDestination({
      appId: 'superSecretAppID',
      subscriptions
    })

    jest.spyOn(destination.actions.trackEvent, 'perform').mockImplementation()

    await trackEvent.load(Context.system(), {} as Analytics)

    //context
    const context = new Context({
      type: 'track',
      event: 'surfboard-bought',
      properties: {
        revenue: 100,
        currency: 'USD'
      }
    })
    await trackEvent.track?.(context)

    expect(destination.actions.trackEvent.perform).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        payload: {
          event_name: 'surfboard-bought',
          price: {
            amount: 100,
            currency: 'USD'
          },
          event_metadata: {
            currency: 'USD',
            revenue: 100
          }
        }
      })
    )
  })

  test('maps custom traits correctly', async () => {
    //boilerplate
    const [trackEvent] = await intercomDestination({
      appId: 'superSecretAppID',
      subscriptions
    })

    jest.spyOn(destination.actions.trackEvent, 'perform')

    await trackEvent.load(Context.system(), {} as Analytics)

    //context
    const context = new Context({
      type: 'track',
      event: 'surfboard-bought',
      properties: {
        surfer: 'kelly slater'
      }
    })
    await trackEvent.track?.(context)

    expect(destination.actions.trackEvent.perform).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        payload: {
          event_name: 'surfboard-bought',
          price: {},
          event_metadata: {
            surfer: 'kelly slater'
          }
        }
      })
    )
  })

  test('currency defaults to USD if omitted, revenue in cents is converted to dollars by multiplying by 100', async () => {
    //boilerplate
    const [trackEvent] = await intercomDestination({
      appId: 'somekeydude',
      subscriptions
    })

    jest.spyOn(destination.actions.trackEvent, 'perform')

    await trackEvent.load(Context.system(), {} as Analytics)

    //context
    const context = new Context({
      type: 'track',
      event: 'surfboard-bought',
      properties: {
        revenue: 100
      }
    })
    await trackEvent.track?.(context)

    expect(destination.actions.trackEvent.perform).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        payload: {
          event_name: 'surfboard-bought',
          price: {
            amount: 10000,
            currency: 'USD'
          },
          event_metadata: {
            revenue: 100
          }
        }
      })
    )
  })

  test('drops arrays or objects in properties', async () => {
    //boilerplate
    const [trackEvent] = await intercomDestination({
      appId: 'topSecretKey',
      subscriptions
    })

    const mockIntercom = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => Promise.resolve(mockIntercom as any))
    await trackEvent.load(Context.system(), {} as Analytics)

    //context
    const context = new Context({
      type: 'track',
      event: 'surfboard-bought',
      properties: {
        surfer: 'kelly slater',
        dropMe: {
          foo: 'bar',
          ahoy: {
            okay: 'hello'
          }
        },
        arr: ['hi', 'sup', 'yo']
      }
    })

    await trackEvent.track?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('trackEvent', 'surfboard-bought', { surfer: 'kelly slater' })
  })

  test('richLinkProperties objects are permitted', async () => {
    const settings = {
      appId: 'topSecretKey',
      richLinkProperties: ['article']
    }
    //boilerplate
    const [trackEvent] = await intercomDestination({
      ...settings,
      subscriptions
    })

    //mock an window.Intercom object & give it the settings props
    const mockIntercom = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithProps = mockIntercom as any
      mockedWithProps.appId = settings.appId
      mockedWithProps.richLinkProperties = settings.richLinkProperties
      return Promise.resolve(mockedWithProps)
    })
    await trackEvent.load(Context.system(), {} as Analytics)

    const context = new Context({
      type: 'track',
      event: 'surfboard-bought',
      properties: {
        surfer: 'kelly slater',
        randomObj: {
          willIBeDropped: true
        },
        article: {
          url: 'someurl',
          value: 'hi'
        }
      }
    })

    await trackEvent.track?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('trackEvent', 'surfboard-bought', {
      surfer: 'kelly slater',
      article: {
        url: 'someurl',
        value: 'hi'
      }
    })
  })
})
