import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Mixpanel } from '../types'
import { sendIdentify, sendGroup } from '../functions'
import {
  event_name,
  properties,
  unique_id,
  user_profile_properties_to_set,
  user_profile_properties_to_set_once,
  user_profile_properties_to_increment,
  group_details,
  group_profile_properties_to_set,
  group_profile_properties_to_set_once,
  group_profile_properties_to_union
} from '../fields'

const action: BrowserActionDefinition<Settings, Mixpanel, Payload> = {
  title: 'Track Page View',
  description: 'Sync Segment page events to Mixpanel.',
  defaultSubscription: 'type = "page"',
  platform: 'web',
  fields: {
    event_name: {
      ...event_name,
      default: undefined,
      required: false
    },
    properties,
    unique_id: {
      ...unique_id,
      description:
        'The unique ID to associate with the user. Settings this value will trigger a Mixpanel identify call before immediately the page event is sent.',
      default: undefined
    },
    user_profile_properties_to_set: {
      ...user_profile_properties_to_set,
      default: {
        name: {
          '@if': {
            exists: { '@path': '$.context.traits.name' },
            then: { '@path': '$.context.traits.name' },
            else: { '@path': '$.properties.name' }
          }
        },
        first_name: {
          '@if': {
            exists: { '@path': '$.context.traits.first_name' },
            then: { '@path': '$.context.traits.first_name' },
            else: { '@path': '$.properties.first_name' }
          }
        },
        last_name: {
          '@if': {
            exists: { '@path': '$.context.traits.last_name' },
            then: { '@path': '$.context.traits.last_name' },
            else: { '@path': '$.properties.last_name' }
          }
        },
        email: {
          '@if': {
            exists: { '@path': '$.context.traits.email' },
            then: { '@path': '$.context.traits.email' },
            else: { '@path': '$.properties.email' }
          }
        },
        phone: {
          '@if': {
            exists: { '@path': '$.context.traits.phone' },
            then: { '@path': '$.context.traits.phone' },
            else: { '@path': '$.properties.phone' }
          }
        },
        avatar: {
          '@if': {
            exists: { '@path': '$.context.traits.avatar' },
            then: { '@path': '$.context.traits.avatar' },
            else: { '@path': '$.properties.avatar' }
          }
        },
        created: {
          '@if': {
            exists: { '@path': '$.context.traits.created_at' },
            then: { '@path': '$.context.traits.created_at' },
            else: { '@path': '$.properties.created_at' }
          }
        }
      }
    },
    user_profile_properties_to_set_once,
    user_profile_properties_to_increment,
    group_details: {
      ...group_details,
      required: false,
      description:
        'Details for the group to be created or updated in Mixpanel. Setting this value will trigger a Mixpanel set_group call before the page event is sent.',
      default: undefined
    },
    group_profile_properties_to_set,
    group_profile_properties_to_set_once,
    group_profile_properties_to_union
  },
  perform: (mixpanel, { payload }) => {
    sendIdentify(mixpanel, payload)
    sendGroup(mixpanel, payload)
    const { event_name, properties = {} } = payload
    if (event_name) {
      mixpanel.track_pageview(properties || {}, { event_name })
    } else {
      mixpanel.track_pageview(properties || {})
    }
  }
}

export default action
