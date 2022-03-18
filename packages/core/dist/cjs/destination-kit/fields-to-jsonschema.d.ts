import { JSONSchema4 } from 'json-schema'
import type { InputField, GlobalSetting, Optional } from './types'
export declare type MinimalInputField =
  | Optional<InputField, 'description'>
  | (Optional<GlobalSetting, 'description'> & {
      additionalProperties?: boolean
    })
export declare type MinimalFields = Record<string, MinimalInputField>
interface SchemaOptions {
  tsType?: boolean
  additionalProperties?: boolean
}
export declare function fieldsToJsonSchema(fields?: MinimalFields, options?: SchemaOptions): JSONSchema4
export {}
