import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Mixpanel } from '../types'
import { sendIdentify } from '../functions'
import { 
  unique_id, 
  user_profile_properties_to_set,
  user_profile_properties_to_set_once,
  user_profile_properties_to_increment
} from '../fields'

const action: BrowserActionDefinition<Settings, Mixpanel, Payload> = {
  title: 'Identify',
  description: 'Sync user profile data to Mixpanel.',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    unique_id, 
    user_profile_properties_to_set,
    user_profile_properties_to_set_once,
    user_profile_properties_to_increment
  },
  perform: (mixpanel, { payload }) => {
    sendIdentify(mixpanel, payload)
  }
}

export default action
