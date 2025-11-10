import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import MixpanelDestination, { destination } from '../../index'
import { Mixpanel } from '../../types'
import { AUTOCAPTURE_OPTIONS, PERSISTENCE_OPTIONS } from '../../constants'
import { Group } from '../../types'

describe('Mixpanel.track', () => {
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

  test('track() handled correctly', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'track',
        name: 'Track',
        enabled: true,
        subscribe: 'type = "track"',
        mapping: {
          event_name: { '@path': '$.event' },
          properties: { '@path': '$.properties' },
          unique_id: { '@path': '$.userId' },
          user_profile_properties_to_set: {
            name: { '@path': '$.context.traits.user.name' },
            first_name: { '@path': '$.context.traits.user.first_name' },
            last_name: { '@path': '$.context.traits.user.last_name' },
            email: { '@path': '$.context.traits.user.email' },
            phone: { '@path': '$.context.traits.user.phone' },
            avatar: { '@path': '$.context.traits.user.avatar' },
            created: { '@path': '$.context.traits.user.created' }
          },
          user_profile_properties_to_set_once: {
            set_once_trait: { '@path': '$.context.traits.user.set_once_trait_1' }
          },
          user_profile_properties_to_increment: {
            increment_property: { '@path': '$.context.traits.user.increment_property_1' }
          },
          group_details: {
            group_key: { '@path': '$.context.traits.company.group_key' },
            group_id: { '@path': '$.context.groupId' }
          },
          group_profile_properties_to_set: {
            company_name: { '@path': '$.context.traits.company.company_name' },
            number_employees: { '@path': '$.context.traits.company.number_employees' }
          },
          group_profile_properties_to_set_once: {
            set_once_trait: { '@path': '$.context.traits.company.set_once_trait_1' }
          },
          group_profile_properties_to_union: { '@path': '$.context.traits.company.union_properties' }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'track',
      event: 'Big Fat Test Event',
      anonymousId: 'anonymousId',
      userId: 'userId1',
      properties: {
        prop1: 'value1',
        prop2: 2,
        prop3: true,
        prop4: [1, 2, 3],
        prop5: { subprop1: 'subvalue1', subprop2: 22 }
      },
      context: {
        groupId: 'groupId1',
        traits: {
          user: {
            name: 'User Name',
            first_name: 'First',
            last_name: 'Last',
            email: 'user@example.com',
            phone: '123-456-7890',
            avatar: 'https://example.com/avatar.jpg',
            created: '2020-01-01T00:00:000Z',
            set_once_trait_1: 'set_once_value_1',
            increment_property_1: 5
          },
          company: {
            group_key: 'company',
            company_name: 'MicroMegaCorpSoftware',
            number_employees: 1000,
            set_once_trait_1: 'set_once_value_1',
            union_properties: [
              { list_name: 'Interests', string_values: ['sports', 'music'] },
              { list_name: 'Regions', string_values: ['north-america', 'europe'] }
            ]
          }
        }
      }
    })

    const [trackEvent] = await MixpanelDestination({
      ...settings,
      subscriptions
    })
    event = trackEvent

    await event.load(Context.system(), {} as Analytics)
    await event.group?.(context)

    // Identify related calls
    expect(mockMPP.identify).toHaveBeenCalledWith('userId1')
    expect(mockMPP.people.set).toHaveBeenCalledWith({
      name: 'User Name',
      last_name: 'Last',
      first_name: 'First',
      email: 'user@example.com',
      phone: '123-456-7890',
      avatar: 'https://example.com/avatar.jpg',
      created: '2020-01-01T00:00:000Z'
    })
    expect(mockMPP.people.set_once).toHaveBeenCalledWith({
      set_once_trait: 'set_once_value_1'
    })
    expect(mockMPP.people.increment).toHaveBeenCalledWith({
      increment_property: 5
    })

    // Group related calls
    expect(mockMPP.set_group).toHaveBeenCalledWith('company', 'groupId1')
    expect(mockMPP.get_group).toHaveBeenCalledWith('company', 'groupId1')
    expect(mockGroup.set).toHaveBeenCalledWith({
      company_name: 'MicroMegaCorpSoftware',
      number_employees: 1000
    })
    expect(mockGroup.set_once).toHaveBeenCalledWith({
      set_once_trait: 'set_once_value_1'
    })
    expect(mockGroup.union).toHaveBeenCalledTimes(2)
    expect(mockGroup.union).toHaveBeenNthCalledWith(1, 'Interests', ['sports', 'music'])
    expect(mockGroup.union).toHaveBeenNthCalledWith(2, 'Regions', ['north-america', 'europe'])

    // Track related calls
    expect(mockMPP.track).toHaveBeenCalledWith('Big Fat Test Event', {
      prop1: 'value1',
      prop2: 2,
      prop3: true,
      prop4: [1, 2, 3],
      prop5: { subprop1: 'subvalue1', subprop2: 22 }
    })
  })
})
