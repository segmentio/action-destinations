import { BrowserDestinationDefinition } from '../types'
import { generatePlugins } from '../plugin'

describe('generatePlugins', () => {
  let useInitializeLock = false
  let releaseInitializeLock: () => void
  const initializeLock = () =>
    useInitializeLock ? new Promise<void>((res) => (releaseInitializeLock = res)) : Promise.resolve()
  const initializeSpy = jest.fn()
  const destinationDefinition: BrowserDestinationDefinition<{}, unknown> = {
    name: 'Test destination',
    slug: 'test-web-destination',
    mode: 'device',
    settings: {},
    initialize: async () => {
      await initializeLock()
      initializeSpy()
    },
    actions: {
      trackEventA: {
        title: 'Track Event',
        description: 'Tests track events',
        platform: 'web',
        defaultSubscription: 'type = "track"',
        fields: {},
        perform: () => {}
      },
      trackEventB: {
        title: 'Track Event',
        description: 'Tests track events',
        platform: 'web',
        defaultSubscription: 'type = "track"',
        fields: {},
        perform: () => {}
      }
    }
  }

  const defaultSubscriptions = [
    {
      enabled: true,
      mapping: {},
      name: 'a',
      partnerAction: 'trackEventA',
      subscribe: 'type = "track"'
    },
    {
      enabled: true,
      mapping: {},
      name: 'b',
      partnerAction: 'trackEventB',
      subscribe: 'type = "track"'
    }
  ]

  beforeEach(() => {
    jest.resetAllMocks()
    useInitializeLock = false
  })

  test('only loads once', async () => {
    const plugins = generatePlugins(destinationDefinition, {}, defaultSubscriptions)

    expect(plugins.length).toBe(2)

    await Promise.all(plugins.map((p) => p.load({} as any, {} as any)))

    expect(initializeSpy).toHaveBeenCalledTimes(1)
  })

  test('promise returned by ready can be awaited even before calling load, it resolves when done', async () => {
    const plugins = generatePlugins(destinationDefinition, {}, defaultSubscriptions)

    useInitializeLock = true
    let readyResolved = false

    // tap into promise returned by ready - even before load executes
    plugins[0].ready?.().then(() => (readyResolved = true))

    expect(readyResolved).toBe(false)

    // trigger the load
    const loadP = plugins[0].load({} as any, {} as any).catch(() => {})

    // wait some time
    await new Promise((res) => setTimeout(res, 1000))

    // still nothing
    expect(readyResolved).toBe(false)

    // release the blocker
    releaseInitializeLock()
    await loadP

    // all clear now
    expect(readyResolved).toBe(true)
  })
})
