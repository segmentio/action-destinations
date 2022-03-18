import { InputField } from '@segment/actions-core/src/destination-kit/types'
export declare const operation: InputField
export declare const traits: InputField
export declare const customFields: InputField
interface Payload {
  operation?: string
  traits?: object
}
export declare const validateLookup: (payload: Payload) => void
export {}
