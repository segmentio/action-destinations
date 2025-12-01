import { Payload as GroupPayload } from './group/generated-types'
import { Payload as TrackPayload } from './track/generated-types'
import { Payload as IdentifyPayload } from './identify/generated-types'
import { Payload as TrackPageViewPayload } from './trackPageView/generated-types'
import type { Mixpanel } from './types'

export function sendIdentify(mixpanel: Mixpanel, payload: IdentifyPayload | TrackPayload | TrackPageViewPayload) {
  const { 
    unique_id, 
    user_profile_properties_to_set,
    user_profile_properties_to_set_once,
    user_profile_properties_to_increment
  } = payload

  if(unique_id) {
    mixpanel.identify(unique_id)
  }

  if (user_profile_properties_to_set && Object.keys(user_profile_properties_to_set).length > 0) {
    mixpanel.people.set(user_profile_properties_to_set)
  }

  if (user_profile_properties_to_set_once && Object.keys(user_profile_properties_to_set_once).length > 0) {
    mixpanel.people.set_once(user_profile_properties_to_set_once)
  }

  if (user_profile_properties_to_increment && Object.keys(user_profile_properties_to_increment).length > 0) {
    mixpanel.people.increment(user_profile_properties_to_increment)
  }
}

export function sendGroup(mixpanel: Mixpanel, payload: GroupPayload | TrackPayload | TrackPageViewPayload) {
  const { 
    group_details: { group_key, group_id } = {},
    group_profile_properties_to_set, 
    group_profile_properties_to_set_once,
    group_profile_properties_to_union
  } = payload

  if (group_key && group_id) {
    mixpanel.set_group(group_key, group_id)
    const group = mixpanel.get_group(group_key, group_id)

    if (group_profile_properties_to_set && Object.keys(group_profile_properties_to_set).length > 0) {
      group.set(group_profile_properties_to_set)
    }
    if (group_profile_properties_to_set_once && Object.keys(group_profile_properties_to_set_once).length > 0) {
      group.set_once(group_profile_properties_to_set_once)
    }
    if (group_profile_properties_to_union && group_profile_properties_to_union.length > 0) {
      group_profile_properties_to_union.forEach((item) => {
        const {
          list_name,
          string_values
        } = item
        group.union(list_name, string_values)
      })
    }
  }
}