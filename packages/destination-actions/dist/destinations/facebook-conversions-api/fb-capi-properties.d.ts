import { InputField } from '@segment/actions-core/src/destination-kit/types'
import { IntegrationError } from '@segment/actions-core'
declare type Content = {
  id?: string
  delivery_category?: string
}
export declare const custom_data: InputField
export declare const currency: InputField
export declare const value: InputField
export declare const content_category: InputField
export declare const content_ids: InputField
export declare const content_name: InputField
export declare const content_type: InputField
export declare const contents: InputField
export declare const validateContents: (contents: Content[]) => IntegrationError | false
export declare const num_items: InputField
export declare const event_time: InputField
export declare const action_source: InputField
export declare const event_source_url: InputField
export declare const event_id: InputField
export {}
