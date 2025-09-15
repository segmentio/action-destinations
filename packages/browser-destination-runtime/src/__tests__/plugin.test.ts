import { BrowserDestinationDefinition } from '../types'
import { generatePlugins } from '../plugin'

describe('generatePlugins', () => {
  const initializeSpy = jest.fn()
  const destinationDefinition: BrowserDestinationDefinition<{}, unknown> = {
    name: 'Test destination',
    slug: 'test-web-destination',
    mode: 'device',
    settings: {},
    initialize: async () => {
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

  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('only loads once', async () => {
    const plugins = generatePlugins(destinationDefinition, {}, [
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
    ])

    expect(plugins.length).toBe(2)

    await Promise.all(plugins.map((p) => p.load({} as any, {} as any)))

    expect(initializeSpy).toHaveBeenCalledTimes(1)
  })
})
