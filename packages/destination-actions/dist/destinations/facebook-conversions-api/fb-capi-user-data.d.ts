import { InputField } from '@segment/actions-core/src/destination-kit/types'
import { Payload } from './addToCart/generated-types'
export declare const user_data_field: InputField
declare type UserData = Pick<Payload, 'user_data'>
export declare const normalize_user_data: (payload: UserData) => void
export declare const hash_user_data: (payload: UserData) => Object
export {}
