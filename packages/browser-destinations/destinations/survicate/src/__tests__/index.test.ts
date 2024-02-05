import { Analytics, Context } from '@segment/analytics-next'
import survicate, { destination } from '../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

const example: Subscription[] = [
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
    partnerAction: 'identifyUser',
    name: 'Identify User',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      traits: {
        '@path': '$.traits'
      }
    }
  }
]

jest.setTimeout(10000) // Resolves a timeout issue in these tests
describe('Survicate', () => {
  test('#load', async () => {
    const [event] = await survicate({
      workspaceKey: 'xMIeFQrceKnfKOuoYXZOVgqbsLlqYMGD',
      subscriptions: example
    })

    jest.spyOn(destination.actions.trackEvent, 'perform')
    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    expect(window).toHaveProperty('_sva')
  })

  it('#track', async () => {
    const [event] = await survicate({
      workspaceKey: 'xMIeFQrceKnfKOuoYXZOVgqbsLlqYMGD',
      subscriptions: example
    })

    await event.load(Context.system(), {} as Analytics)
    const sva = jest.spyOn(window._sva, 'invokeEvent')

    await event.track?.(
      new Context({
        type: 'track',
        name: 'event',
        properties: {}
      })
    )

    expect(sva).toHaveBeenCalledWith('segmentEvent-event', {})
  })

  it('#identify', async () => {
    const [_, identifyUser] = await survicate({
      workspaceKey: 'xMIeFQrceKnfKOuoYXZOVgqbsLlqYMGD',
      subscriptions: example
    })

    await identifyUser.load(Context.system(), {} as Analytics)
    const setVisitorTraits = jest.spyOn(window._sva, 'setVisitorTraits')

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        traits: {
          date: '2024-01-01'
        }
      })
    )

    expect(setVisitorTraits).toHaveBeenCalled()
    expect(setVisitorTraits).toHaveBeenCalledWith({ date: '2024-01-01' })
  })
})
