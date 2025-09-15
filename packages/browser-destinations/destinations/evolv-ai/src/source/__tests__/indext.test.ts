import { Analytics, Context } from '@segment/analytics-next'
import evolvDestination, { destination } from '../../index'

const subscriptions = [
  {
    partnerAction: 'trackEvent',
    name: 'Show',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      eventName: {
        '@path': '$.event'
      },
      properties: {
        '@path': '$.properties'
      }
    }
  }
]

describe('confirmation source', () => {
  let evolvObj: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [evolvPlugin] = await evolvDestination({
      receiveConfirmations: true,
      subscriptions
    })
    evolvObj = evolvPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      // window.analytics.track = jest.fn();
      window.console.warn = jest.fn()
      window.evolv = {
        client: {
          emit: jest.fn(),
          on: (et, fn: (args: { [key: string]: string }) => void) => {
            console.info('client.on called with', fn)

            expect(et).toBe('confirmed')
            fn({
              cid: '23-45',
              eid: '45',
              ord: '1'
            })
          },
          getDisplayName: jest.fn()
        },
        context: {
          update: jest.fn(),
          get: jest.fn()
        },
        setUid: jest.fn()
      }
      return Promise.resolve(window.evolv)
    })
    await evolvObj.load(Context.system(), {} as Analytics)
  })

  test('contest attributes', async () => {
    const context = new Context({
      type: 'identify',
      traits: {
        textAttribute: 'test'
      }
    })

    await evolvObj.track?.(context)

    // expect(console.warn).toHaveBeenCalledWith({
    //   'segment.textAttribute': 'test'
    // })
  })
})

describe('confirmation source should not process unless requested', () => {
  const settings = {
    receiveConfirmations: false
  }

  let evolvObj: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [evolvPlugin] = await evolvDestination({
      ...settings,
      subscriptions
    })
    evolvObj = evolvPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      // window.analytics.track = jest.fn();
      window.console.warn = jest.fn()
      window.evolv = {
        client: {
          emit: jest.fn(),
          on: (et, fn: (args: { [key: string]: string }) => void) => {
            expect(et).toBe('confirmed')
            fn({
              cid: '23-45',
              eid: '45',
              ord: '1'
            })
          },
          getDisplayName: jest.fn()
        },
        context: {
          update: jest.fn(),
          get: jest.fn()
        },
        setUid: jest.fn()
      }
      return Promise.resolve(window.evolv)
    })
    await evolvObj.load(Context.system(), {} as Analytics)
  })

  test('context attributes', async () => {
    const context = new Context({
      type: 'identify',
      traits: {
        textAttribute: 'test'
      }
    })

    await evolvObj.track?.(context)

    expect(console.warn).not.toHaveBeenCalled()
  })
})
