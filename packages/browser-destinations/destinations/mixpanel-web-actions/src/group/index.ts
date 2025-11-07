import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Mixpanel } from '../types'

const action: BrowserActionDefinition<Settings, Mixpanel, Payload> = {
  title: 'Group',
  description: 'Sync Segment group calls to Mixpanel.',
  platform: 'web',
  fields: {
    group_key: {
      label: 'Group Key',
      description: 'The Group Key / type of group to associate with the user. This group key will already be defined in your Mixpanel project.',
      required: true,
      type: 'string'
    },
    group_id: {
      label: 'Group ID',
      description: 'The unique ID to associate with the group.',
      required: true,
      type: 'string',
      default: { '@path': '$.groupId' }
    },
    profile_properties_to_set: {
      label: 'Properties to Set',
      description: 'Group Profile Properties to set on the group in Mixpanel.',
      required: false,
      defaultObjectUI: 'keyvalue',
      type: 'object'
    },
    profile_properties_to_set_once: {
      label: 'Properties to set once',
      description: 'Group Profile Properties to set once on the group profile in Mixpanel. Values which get set once cannot be overwritten later.',
      required: false,
      defaultObjectUI: 'keyvalue',
      type: 'object'
    }
  },
  defaultSubscription: 'type = "group"',
  perform: (mixpanel, { payload }) => {

    const { group_key, group_id, profile_properties_to_set, profile_properties_to_set_once } = payload

    mixpanel.set_group(group_key, group_id)

    const group = mixpanel.get_group(group_key, group_id)

    if (profile_properties_to_set && Object.keys(profile_properties_to_set).length > 0) {
      group.set(profile_properties_to_set)
    }

    if (profile_properties_to_set_once && Object.keys(profile_properties_to_set_once).length > 0) {
      group.set_once(profile_properties_to_set_once)
    }
  }
}

export default action
