import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import MixpanelDestination, { destination } from '../../index'
import { Mixpanel } from '../../types'
import { AUTOCAPTURE_OPTIONS, PERSISTENCE_OPTIONS } from '../../constants'
import { Group } from '../../types'

describe('Mixpanel.group', () => {
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

  test('group() handled correctly', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'group',
        name: 'Group',
        enabled: true,
        subscribe: 'type = "group"',
        mapping: {
          group_details: {
              group_key: { '@path': '$.traits.group_key' },
              group_id: { '@path': '$.groupId' }
          },
          group_profile_properties_to_set: { 
              company_name: { '@path': '$.traits.company_name' },
              number_employees: { '@path': '$.traits.number_employees' }
          },
          group_profile_properties_to_set_once: {
              set_once_trait: { '@path': '$.traits.set_once_trait_1' },
          },
          group_profile_properties_to_union: { '@path': '$.traits.union_properties' }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'group',
      anonymousId: 'anonymousId',
      userId: 'userId1',
      groupId: 'groupId1',
      traits: {
        group_key: 'company',
        company_name: 'MicroMegaCorpSoftware',
        number_employees: 1000,
        set_once_trait_1: 'set_once_value_1',
        union_properties: [
          { list_name: 'Interests', string_values: ['sports', 'music'] },
          { list_name: 'Regions', string_values: ['north-america', 'europe'] }
        ]
      }
    })

    const [groupEvent] = await MixpanelDestination({
      ...settings,
      subscriptions
    })
    event = groupEvent

    await event.load(Context.system(), {} as Analytics)
    await event.group?.(context)
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
  })
})
