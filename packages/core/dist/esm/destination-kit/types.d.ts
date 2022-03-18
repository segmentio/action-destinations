import type { RequestOptions } from '../request-client'
import type { JSONObject } from '../json-object'
import { AuthTokens } from './parse-settings'
import type { RequestClient } from '../create-request-client'
import type { ID } from '../segment-event'
export declare type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
export declare type MaybePromise<T> = T | Promise<T>
export interface Result {
  output?: JSONObject | string | null | undefined
  error?: JSONObject | null
}
export interface ExecuteInput<Settings, Payload> {
  readonly mapping?: JSONObject
  readonly settings: Settings
  payload: Payload
  page?: string
  readonly auth?: AuthTokens
}
export interface DynamicFieldResponse {
  body: {
    data: DynamicFieldItem[]
    pagination: {
      nextPage?: string
    }
  }
}
export interface DynamicFieldItem {
  label: string
  value: string
}
export interface GlobalSetting {
  label: string
  description: string
  type: 'boolean' | 'string' | 'password' | 'number'
  multiple?: boolean
  choices?: Array<{
    value: string | number
    label: string
  }>
  required?: boolean
  default?: string | number | boolean
  properties?: InputField['properties']
  format?: InputField['format']
}
export declare type FieldTypeName =
  | 'string'
  | 'text'
  | 'number'
  | 'integer'
  | 'datetime'
  | 'boolean'
  | 'password'
  | 'object'
export interface InputField {
  label: string
  description: string
  type: FieldTypeName
  allowNull?: boolean
  multiple?: boolean
  additionalProperties?: boolean
  default?: FieldValue
  placeholder?: string
  dynamic?: boolean
  choices?:
    | Array<string>
    | Array<{
        value: string | number
        label: string
      }>
  required?: boolean
  properties?: Record<string, Optional<InputField, 'description'>>
  format?:
    | 'date'
    | 'time'
    | 'date-time'
    | 'uri'
    | 'uri-reference'
    | 'uri-template'
    | 'email'
    | 'hostname'
    | 'ipv4'
    | 'ipv6'
    | 'regex'
    | 'uuid'
    | 'password'
    | 'text'
  defaultObjectUI?: 'keyvalue' | 'object' | 'keyvalue:only' | 'object:only'
}
export declare type FieldValue = string | number | boolean | object | Directive
export interface IfDirective {
  '@if': {
    exists?: FieldValue
    then: FieldValue
    else?: FieldValue
  }
}
export interface TemplateDirective {
  '@template': string
}
export interface PathDirective {
  '@path': string
}
export declare type Directive = IfDirective | TemplateDirective | PathDirective
export declare type RequestExtension<Settings, Payload = undefined> = (
  data: ExecuteInput<Settings, Payload>
) => RequestOptions
export interface DeletionPayload {
  userId: ID
  anonymousId: ID
}
export declare type Deletion<Settings, Return = any> = (
  request: RequestClient,
  data: ExecuteInput<Settings, DeletionPayload>
) => MaybePromise<Return>
