import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
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
      revenue: {
        '@path': '$.properties.revenue'
      },
      currency: {
        '@path': '$.properties.currency'
      }
    }
  }
]

describe('Intercom.trackEvent', () => {
  const settings = {
    appId: 'superSecretAppID'
  }

  let mockIntercom: jest.Mock<any, any>
  let trackEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await intercomDestination({
      ...settings,
      subscriptions
    })
    trackEvent = trackEventPlugin

    mockIntercom = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithProps = Object.assign(mockIntercom as any, settings)
      return Promise.resolve(mockedWithProps)
    })
    await trackEvent.load(Context.system(), {} as Analytics)
  })

  test('maps custom traits correctly', async () => {
    const context = new Context({
      type: 'track',
      event: 'surfboard-bought',
      properties: {
        surfer: 'kelly slater'
      }
    })
    await trackEvent.track?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('trackEvent', 'surfboard-bought', {
      surfer: 'kelly slater'
    })
  })

  test('maps price correctly', async () => {
    const context = new Context({
      type: 'track',
      event: 'surfboard-bought',
      properties: {
        revenue: 100,
        currency: 'USD'
      }
    })
    await trackEvent.track?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('trackEvent', 'surfboard-bought', {
      price: {
        amount: 10000,
        currency: 'USD'
      }
    })
  })

  test('currency defaults to USD if omitted', async () => {
    const context = new Context({
      type: 'track',
      event: 'surfboard-bought',
      properties: {
        revenue: 100
      }
    })
    await trackEvent.track?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('trackEvent', 'surfboard-bought', {
      price: {
        amount: 10000,
        currency: 'USD'
      }
    })
  })

  test('drops arrays or objects in properties', async () => {
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

    expect(mockIntercom).toHaveBeenCalledWith('trackEvent', 'surfboard-bought', {
      surfer: 'kelly slater'
    })
  })
})

describe('Intercom.trackEvent with rich link properties', () => {
  const settings = {
    appId: 'superSecretAppID',
    richLinkProperties: ['article']
  }

  let mockIntercom: jest.Mock<any, any>
  let trackEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await intercomDestination({
      ...settings,
      subscriptions
    })
    trackEvent = trackEventPlugin

    mockIntercom = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithProps = Object.assign(mockIntercom as any, settings)
      return Promise.resolve(mockedWithProps)
    })
    await trackEvent.load(Context.system(), {} as Analytics)
  })

  test('rich link properties are permitted', async () => {
    const context = new Context({
      type: 'track',
      event: 'surfboard-bought',
      properties: {
        surfer: 'kelly slater',
        dropMe: {
          foo: 'bar'
        },
        article: {
          url: 'im a link',
          value: 'hi'
        }
      }
    })

    await trackEvent.track?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('trackEvent', 'surfboard-bought', {
      surfer: 'kelly slater',
      article: {
        url: 'im a link',
        value: 'hi'
      }
    })
  })
})
