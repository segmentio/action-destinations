import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '../../../lib/browser-destinations'
import userpilot, { destination } from '../index'

const example: Subscription[] = [
  {
    partnerAction: 'identifyUser',
    name: 'Identify User',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      userId: {
        '@path': '$.userId'
      },
      anonymousId: {
        '@path': '$.anonymousId'
      },
      traits: {
        '@path': '$.traits'
      }
    }
  },
  {
    partnerAction: 'trackEvent',
    name: 'Track Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      name: {
        '@path': '$.name'
      },
      properties: {
        '@path': '$.properties'
      }
    }
  },
  {
    partnerAction: 'pageView',
    name: 'Page View',
    enabled: true,
    subscribe: 'type = "page"',
    mapping: {
      name: {
        '@path': '$.name'
      },
      properties: {
        '@path': '$.properties'
      }
    }
  }
]

describe('Userpilot', () => {
  it('should load the Userpilot script', async () => {
    const [event] = await userpilot({
      token: 'NX-917089a3',
      subscriptions: example
    })
    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(window.userpilot).toBeDefined()
  })
})

describe('IdentifyUser', () => {
  it('should call identify if user id is provided', async () => {
    const [identifyUser] = await userpilot({
      token: 'NX-917089a3',
      subscriptions: example
    })
    await identifyUser.load(Context.system(), {} as Analytics)
    const up = jest.spyOn(window.userpilot, 'identify')

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        userId: 'test',
        traits: {
          example: 'test prop'
        }
      })
    )
    expect(up).toHaveBeenCalledWith('test', { example: 'test prop' })
  })
})

describe('TrackEvent', () => {
  it('should call track if event name is provided', async () => {
    const [_identifyUser, trackEvent] = await userpilot({
      token: 'NX-917089a3',
      subscriptions: example
    })

    await trackEvent.load(Context.system(), {} as Analytics)
    const up = jest.spyOn(window.userpilot, 'track')

    await trackEvent.track?.(
      new Context({
        type: 'track',
        name: 'test',
        properties: {
          example: 'test prop'
        }
      })
    )
    expect(up).toHaveBeenCalledWith('test', { example: 'test prop' })
  })
})

describe('PageView', () => {
  it('should call Userpilot reload', async () => {
    const [_identifyUser, _trackEvent, pageView] = await userpilot({
      token: 'NX-917089a3',
      subscriptions: example
    })
    await pageView.load(Context.system(), {} as Analytics)

    const up = jest.spyOn(window.userpilot, 'reload')

    await pageView.page?.(
      new Context({
        type: 'page',
        name: 'test',
        properties: {
          example: 'test prop'
        }
      })
    )
    expect(up).toHaveBeenCalledWith('test', { example: 'test prop' })
  })
})
