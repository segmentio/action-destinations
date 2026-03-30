import { InputField } from '@segment/actions-core'
import {
  currency,
  value,
  net_revenue,
  content_name,
  content_type,
  contents,
  custom_data,
  num_items,
  content_ids,
  event_time,
  action_source,
  event_source_url,
  event_id,
  data_processing_options,
  data_processing_options_country,
  data_processing_options_state,
  test_event_code
} from '../fb-capi-properties'
import { user_data_field } from '../fb-capi-user-data'
import { app_data_field } from '../fb-capi-app-data'

export const fields: Record<string, InputField> = {
  action_source: { ...action_source, required: true },
  currency: { ...currency, required: true },
  event_time: { ...event_time, required: true },
  user_data: user_data_field,
  app_data_field: app_data_field,
  value: {
    ...value,
    required: true,
    default: { '@path': '$.properties.revenue' }
  },
  net_revenue: net_revenue,
  content_ids: content_ids,
  content_name: content_name,
  content_type: content_type,
  contents: {
    // Segment Checkout Started has an array of products mapping
    ...contents,
    default: {
      '@arrayPath': [
        '$.properties.products',
        {
          id: {
            '@path': '$.product_id'
          },
          quantity: {
            '@path': '$.quantity'
          },
          item_price: {
            '@path': '$.price'
          }
        }
      ]
    }
  },
  event_id: event_id,
  event_source_url: event_source_url,
  num_items: num_items,
  custom_data: custom_data,
  data_processing_options: data_processing_options,
  data_processing_options_country: data_processing_options_country,
  data_processing_options_state: data_processing_options_state,
  test_event_code: test_event_code
}
