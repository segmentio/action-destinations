import { Analytics, Context } from '@segment/analytics-next'
import MixpanelDestination, { destination } from '../index'
import { AUTOCAPTURE_OPTIONS, PERSISTENCE_OPTIONS } from '../constants'
import * as initScriptModule from '../init-script'
import { Mixpanel } from '../types'

describe('Mixpanel Web initialization', () => {
  const baseSettings = {
    projectToken: 'test-project-token',
    api_host: 'https://api-js.mixpanel.com',
    autocapture: AUTOCAPTURE_OPTIONS.ENABLED,
    cross_subdomain_cookie: true,
    persistence: PERSISTENCE_OPTIONS.COOKIE,
    track_marketing: true,
    cookie_expiration: 365,
    disable_persistence: false,
    ip: true,
    record_block_class: 'mp-block',
    record_block_selector: 'img, video, audio',
    record_canvas: false,
    record_heatmap_data: false,
    record_idle_timeout_ms: 180_000,
    record_mask_text_class: 'mp-mask',
    record_mask_text_selector: '*',
    record_max_ms: 86_400_000,
    record_min_ms: 0,
    record_sessions_percent: 0
  }

  const subscriptions = [
    {
      partnerAction: 'track',
      name: 'Track',
      enabled: true,
      subscribe: 'type = "track"',
      mapping: {
        event_name: { '@path': '$.event' },
        properties: { '@path': '$.properties' }
      }
    }
  ]

  afterEach(() => {
    jest.restoreAllMocks()
    delete (window as any).mixpanel
  })

  test('initialize resolves when loaded callback is called', async () => {
    const mockMixpanelInstance: Mixpanel = {
      init: jest.fn(),
      track: jest.fn(),
      track_pageview: jest.fn(),
      identify: jest.fn(),
      register: jest.fn(),
      alias: jest.fn(),
      get_group: jest.fn(),
      set_group: jest.fn(),
      people: {
        set: jest.fn(),
        set_once: jest.fn(),
        increment: jest.fn()
      }
    }

    const mockSnippetMixpanel: Partial<Mixpanel> = {
      init: jest.fn().mockImplementation((_token, config, _name) => {
        // Simulate Mixpanel SDK calling the loaded callback asynchronously
        setTimeout(() => {
          if (config?.loaded) {
            config.loaded(mockMixpanelInstance)
          }
        }, 10)
      })
    }

    jest.spyOn(initScriptModule, 'initScript').mockImplementation(async () => {
      ;(window as any).mixpanel = mockSnippetMixpanel
    })

    const [event] = await MixpanelDestination({
      ...baseSettings,
      subscriptions
    })

    const initializeSpy = jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)

    // Verify the loaded callback was used by checking that the destination loaded successfully
    expect(mockSnippetMixpanel.init).toHaveBeenCalledWith(
      'test-project-token',
      expect.objectContaining({
        loaded: expect.any(Function)
      })
    )

    // Verify that initialize resolves with the real Mixpanel instance from the loaded callback,
    // not the snippet mock on window.mixpanel
    const resolvedInstance = await initializeSpy.mock.results[0].value
    expect(resolvedInstance).toBe(mockMixpanelInstance)
    expect(resolvedInstance).not.toBe(mockSnippetMixpanel)
  })

  test('registers segment_source_name as a super property when sourceName is set', async () => {
    const mockMixpanelInstance: Mixpanel = {
      init: jest.fn(),
      track: jest.fn(),
      track_pageview: jest.fn(),
      identify: jest.fn(),
      register: jest.fn(),
      alias: jest.fn(),
      get_group: jest.fn(),
      set_group: jest.fn(),
      people: {
        set: jest.fn(),
        set_once: jest.fn(),
        increment: jest.fn()
      }
    }

    const mockSnippetMixpanel: Partial<Mixpanel> = {
      init: jest.fn().mockImplementation((_token, config, _name) => {
        setTimeout(() => {
          if (config?.loaded) {
            config.loaded(mockMixpanelInstance)
          }
        }, 10)
      })
    }

    jest.spyOn(initScriptModule, 'initScript').mockImplementation(async () => {
      ;(window as any).mixpanel = mockSnippetMixpanel
    })

    const [event] = await MixpanelDestination({
      ...baseSettings,
      sourceName: 'My Website Source',
      subscriptions
    })

    await event.load(Context.system(), {} as Analytics)

    expect(mockMixpanelInstance.register).toHaveBeenCalledWith({
      segment_source_name: 'My Website Source'
    })

    // sourceName is a Segment side setting and is not a valid Mixpanel config option,
    // so it must not be forwarded to mixpanel.init
    const [, config] = (mockSnippetMixpanel.init as jest.Mock).mock.calls[0]
    expect(config).not.toHaveProperty('sourceName')
  })

  test('does not register a super property when sourceName is not set', async () => {
    const mockMixpanelInstance: Mixpanel = {
      init: jest.fn(),
      track: jest.fn(),
      track_pageview: jest.fn(),
      identify: jest.fn(),
      register: jest.fn(),
      alias: jest.fn(),
      get_group: jest.fn(),
      set_group: jest.fn(),
      people: {
        set: jest.fn(),
        set_once: jest.fn(),
        increment: jest.fn()
      }
    }

    const mockSnippetMixpanel: Partial<Mixpanel> = {
      init: jest.fn().mockImplementation((_token, config, _name) => {
        setTimeout(() => {
          if (config?.loaded) {
            config.loaded(mockMixpanelInstance)
          }
        }, 10)
      })
    }

    jest.spyOn(initScriptModule, 'initScript').mockImplementation(async () => {
      ;(window as any).mixpanel = mockSnippetMixpanel
    })

    const [event] = await MixpanelDestination({
      ...baseSettings,
      subscriptions
    })

    await event.load(Context.system(), {} as Analytics)

    expect(mockMixpanelInstance.register).not.toHaveBeenCalled()
  })
})
