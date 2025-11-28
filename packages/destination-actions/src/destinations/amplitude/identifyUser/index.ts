import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions'
import { autocaptureFields } from '../autocapture-fields'
import { 
  user_id, 
  device_id, 
  user_properties, 
  groups, 
  app_version, 
  platform, 
  os_name, 
  os_version,
  device_brand,
  device_manufacturer,
  device_model,
  carrier,
  country,
  region,
  city,
  dma,
  language,
  insert_id,
  userAgent,
  userAgentParsing,
  includeRawUserAgent,
  utm_properties,
  referrer,
  min_id_length,
  library,
  userAgentData 
} from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description:
    'Set the user ID for a particular device ID or update user properties without sending an event to Amplitude.',
  defaultSubscription: 'type = "identify"',
  fields: {
    ...autocaptureFields,
    user_id: {
      ...user_id,
      description: 'A UUID (unique user ID) specified by you. **Note:** If you send a request with a user ID that is not in the Amplitude system yet, then the user tied to that ID will not be marked new until their first event. Required unless device ID is present.'
    },
    device_id: {
      ...device_id,
      description: 'A device specific identifier, such as the Identifier for Vendor (IDFV) on iOS. Required unless user ID is present.'
    },
    user_properties: {
      ...user_properties,      
      description: 'Additional data tied to the user in Amplitude. Each distinct value will show up as a user segment on the Amplitude dashboard. Object depth may not exceed 40 layers. **Note:** You can store property values in an array and date values are transformed into string values.'
    },
    groups: {
      ...groups,      
      description: "Groups of users for Amplitude's account-level reporting feature. Note: You can only track up to 5 groups. Any groups past that threshold will not be tracked. **Note:** This feature is only available to Amplitude Enterprise customers who have purchased the Amplitude Accounts add-on."
    },
    app_version,
    platform,
    os_name,
    os_version,
    device_brand,
    device_manufacturer,
    device_model,
    carrier,
    country,
    region,
    city,
    dma,
    language,
    paying: {
      label: 'Is Paying',
      type: 'boolean',
      description: 'Whether the user is paying or not.'
    },
    start_version: {
      label: 'Initial Version',
      type: 'string',
      description: 'The version of the app the user was first on.'
    },
    insert_id,
    userAgent,
    userAgentParsing,
    includeRawUserAgent,
    utm_properties,
    referrer,
    min_id_length,
    library,
    userAgentData
  },
  perform: (request, { payload, settings }) => {
    return send(request, payload, settings)
  }
}

export default action