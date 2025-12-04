import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions'
import { autocapture_fields } from '../fields/autocapture-fields'
import { common_fields } from '../fields/common-fields'
import { common_track_identify_fields} from '../fields/common-track-identify-fields'
import { paying, start_version } from './fields'
import { min_id_length, device_id, insert_id, referrer, utm_properties } from '../fields/misc-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description:
    'Set the user ID for a particular device ID or update user properties without sending an event to Amplitude.',
  defaultSubscription: 'type = "identify"',
  fields: {
    ...common_fields,
    ...common_track_identify_fields,
    ...autocapture_fields,
    user_id: {
      ...common_fields.user_id,
      description: 'A UUID (unique user ID) specified by you. **Note:** If you send a request with a user ID that is not in the Amplitude system yet, then the user tied to that ID will not be marked new until their first event. Required unless device ID is present.'
    },
    device_id: {
      ...device_id,
      description: 'A device specific identifier, such as the Identifier for Vendor (IDFV) on iOS. Required unless user ID is present.'
    },
    insert_id,
    user_properties: {
      ...common_track_identify_fields.user_properties,      
      description: 'Additional data tied to the user in Amplitude. Each distinct value will show up as a user segment on the Amplitude dashboard. Object depth may not exceed 40 layers. **Note:** You can store property values in an array and date values are transformed into string values.'
    },
    groups: {
      ...common_track_identify_fields.groups,      
      description: "Groups of users for Amplitude's account-level reporting feature. Note: You can only track up to 5 groups. Any groups past that threshold will not be tracked. **Note:** This feature is only available to Amplitude Enterprise customers who have purchased the Amplitude Accounts add-on."
    },
    min_id_length,
    paying, 
    start_version,
    referrer, 
    utm_properties
  },
  perform: (request, { payload, settings }) => {
    return send(request, payload, settings)
  }
}

export default action