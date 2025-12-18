import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import MixpanelDestination, { destination } from '../../index'
import { Mixpanel } from '../../types'
import { AUTOCAPTURE_OPTIONS, PERSISTENCE_OPTIONS } from '../../constants'
import { Group } from '../../types'

describe('Mixpanel.identify', () => {
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

  test('identify() handled correctly', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'identify',
        name: 'Identify',
        enabled: true,
        subscribe: 'type = "identify"',
        mapping: {
          unique_id: { '@path': '$.userId' },
          user_profile_properties_to_set: {
            name: { '@path': '$.traits.name' },
            first_name: { '@path': '$.traits.first_name' },
            last_name: { '@path': '$.traits.last_name' },
            email: { '@path': '$.traits.email' },
            phone: { '@path': '$.traits.phone' },
            avatar: { '@path': '$.traits.avatar' },
            created: { '@path': '$.traits.created' }
          },
          user_profile_properties_to_set_once: {
            set_once_trait: { '@path': '$.traits.set_once_trait_1' }
          },
          user_profile_properties_to_increment: {
            increment_property: { '@path': '$.traits.increment_property_1' }
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'identify',
      anonymousId: 'anonymousId',
      userId: 'userId1',
      traits: {
        name: 'name1',
        last_name: 'lastName1',
        first_name: 'firstName1',
        email: 'aaa@aaa.com',
        phone: '+12345678900',
        avatar: 'https://example.com/avatar.png',
        created: '2020-01-01T00:05:02.010Z',
        set_once_trait_1: 'set_once_value_1',
        increment_property_1: 5
      }
    })

    const [identifyEvent] = await MixpanelDestination({
      ...settings,
      subscriptions
    })
    event = identifyEvent

    await event.load(Context.system(), {} as Analytics)
    await event.identify?.(context)

    expect(mockMPP.identify).toHaveBeenCalledWith('userId1')
    expect(mockMPP.people.set).toHaveBeenCalledWith({
      $name: 'name1',
      $last_name: 'lastName1',
      $first_name: 'firstName1',
      $email: 'aaa@aaa.com',
      $phone: '+12345678900',
      $avatar: 'https://example.com/avatar.png',
      $created: '2020-01-01T00:05:02.010Z'
    })
    expect(mockMPP.people.set_once).toHaveBeenCalledWith({
      set_once_trait: 'set_once_value_1'
    })
    expect(mockMPP.people.increment).toHaveBeenCalledWith({
      increment_property: 5
    })
  })
})
