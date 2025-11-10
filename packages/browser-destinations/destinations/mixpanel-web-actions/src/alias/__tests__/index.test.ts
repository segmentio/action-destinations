import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import MixpanelDestination, { destination } from '../../index'
import { Mixpanel } from '../../types'
import { AUTOCAPTURE_OPTIONS, PERSISTENCE_OPTIONS } from '../../constants'
import { Group } from '../../types'

describe('Mixpanel.alias', () => {
  const settings = {
    projectToken: 'projectToken1',
    name: 'name1',
    default: 'https://api-js.mixpanel.com',
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
    record_min_ms: 8_000,
    record_sessions_percent: 0
  }

  let mockMPP: Mixpanel
  let mockGroup: Group
  let event: any

  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {

      mockGroup = {
        set: jest.fn(),
        set_once: jest.fn(),
        union: jest.fn()
      }

      mockMPP = {
        init: jest.fn(),
        track_pageview: jest.fn(),
        track: jest.fn(),
        identify: jest.fn(),
        alias: jest.fn(),
        get_group: jest.fn().mockReturnValue(mockGroup),
        set_group: jest.fn(),
        people: {
          set: jest.fn(),
          set_once: jest.fn(),
          increment: jest.fn()
        }
      }
      return Promise.resolve(mockMPP)
    })
  })

  test('alias() handled correctly', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'alias',
        name: 'Alias',
        enabled: true,
        subscribe: 'type = "alias"',
        mapping: {
          alias:{ '@path': '$.userId' },
          original: { '@path': '$.previousId' }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'alias',
      userId: 'userId1',
      previousId: 'previousId1'
    })

    const [aliasEvent] = await MixpanelDestination({
      ...settings,
      subscriptions
    })
    event = aliasEvent

    await event.load(Context.system(), {} as Analytics)
    await event.alias?.(context)

    expect(mockMPP.alias).toHaveBeenCalledWith("userId1", "previousId1")
  })
})
