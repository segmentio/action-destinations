import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { autocaptureFields } from '../autocapture-fields'
import { send } from '../events-functions'
import { 
  user_id,
  device_id,
  event_type,
  session_id,
  time,
  event_properties,
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
  price,
  quantity,
  revenue,
  productId,
  revenueType,
  location_lat,
  location_lng,
  ip,
  idfa,
  idfv,
  adid,
  android_id,
  event_id,
  insert_id,
  library,
  products, 
  utm_properties, 
  referrer, 
  use_batch_endpoint, 
  userAgent, 
  userAgentParsing, 
  includeRawUserAgent, 
  min_id_length, 
  userAgentData 
} from '../fields'
import { 
  trackRevenuePerProduct 
} 
from './fields'


const action: ActionDefinition<Settings, Payload> = {
  title: 'Log Purchase',
  description: 'Send an event to Amplitude.',
  defaultSubscription: 'type = "track"',
  fields: {
    trackRevenuePerProduct,
    user_id,
    device_id,
    event_type,
    session_id,
    time,
    event_properties,
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
    price,
    quantity,
    revenue,
    productId,
    revenueType,
    location_lat,
    location_lng,
    ip,
    idfa,
    idfv,
    adid,
    android_id,
    event_id,
    insert_id,
    library,
    products,
    ...autocaptureFields,
    utm_properties,
    referrer,
    use_batch_endpoint,
    userAgent,
    userAgentParsing,
    includeRawUserAgent,
    min_id_length,
    userAgentData
  },
  perform: (request, { payload, settings }) => {
    return send(request, payload, settings, true)
  }
}

export default action





