import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Mixpanel } from '../types'
import { sendGroup } from '../functions'
import {
  group_details,
  group_profile_properties_to_set,
  group_profile_properties_to_set_once,
  group_profile_properties_to_union
} from '../fields'

const action: BrowserActionDefinition<Settings, Mixpanel, Payload> = {
  title: 'Group',
  description: 'Sync Group data to Mixpanel.',
  defaultSubscription: 'type = "group"',
  platform: 'web',
  fields: {
    group_details,
    group_profile_properties_to_set,
    group_profile_properties_to_set_once,
    group_profile_properties_to_union
  },
  perform: (mixpanel, { payload }) => {
    sendGroup(mixpanel, payload)
  }
}

export default action
