import type { InputField } from '@segment/actions-core'
export declare type FriendbuyAPI = 'pub' | 'mapi'
export interface FieldConfig {
  requireCustomerId?: boolean
  requireEmail?: boolean
}
export declare function commonCustomerFields(fieldConfig: FieldConfig): Record<string, InputField>
