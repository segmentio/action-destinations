import { StateContext, Logger, StatsContext, TransactionContext } from './index'
import type { RequestOptions } from '../request-client'
import type { JSONObject } from '../json-object'
import { AuthTokens } from './parse-settings'
import type { RequestClient } from '../create-request-client'
import type { ID } from '../segment-event'
import { Features } from '../mapping-kit'

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
export type MaybePromise<T> = T | Promise<T>

export interface Result {
  output?: JSONObject | string | null | undefined
  error?: JSONObject | null
}

export interface ExecuteInput<Settings, Payload, AudienceSettings = unknown> {
  /** The subscription mapping definition */
  readonly mapping?: JSONObject
  /** The global destination settings */
  readonly settings: Settings
  /** The audience-specific destination settings */
  readonly audienceSettings?: AudienceSettings
  /** The transformed input data, based on `mapping` + `event` (or `events` if batched) */
  payload: Payload
  /** The page used in dynamic field requests */
  page?: string
  /** The data needed in OAuth requests */
  readonly auth?: AuthTokens
  /**
   * The features available in the request based on the customer's sourceID;
   * `features`,`stats`, `logger` , `transactionContext` and `stateContext` are for internal Twilio/Segment use only.
   */
  readonly features?: Features
  readonly statsContext?: StatsContext
  readonly logger?: Logger
  readonly transactionContext?: TransactionContext
  readonly stateContext?: StateContext
}

export interface DynamicFieldResponse {
  choices: DynamicFieldItem[]
  nextPage?: string
  error?: DynamicFieldError
}

export interface DynamicFieldError {
  code: string
  message: string
}

export interface DynamicFieldItem {
  label: string
  value: string
}

/** The shape of authentication and top-level settings */
export interface GlobalSetting {
  /** A short, human-friendly label for the field */
  label: string
  /** A human-friendly description of the field */
  description: string
  /** A subset of the available DestinationMetadataOption types */
  type: 'boolean' | 'string' | 'password' | 'number'
  /** Whether or not the field accepts more than one of its `type` */
  multiple?: boolean
  /**
   * A predefined set of options for the setting.
   * Only relevant for `type: 'string'` or `type: 'number'`.
   */
  choices?: Array<{
    /** The value of the option */
    value: string | number
    /** A human-friendly label for the option */
    label: string
  }>
  required?: boolean
  default?: string | number | boolean
  properties?: InputField['properties']
  format?: InputField['format']
}

/** The supported field type names */
export type FieldTypeName =
  | 'string'
  | 'text'
  | 'number'
  | 'integer'
  | 'datetime'
  | 'boolean'
  | 'password'
  | 'object'
  | 'hidden'

/** The shape of an input field definition */
export interface InputField {
  /** A short, human-friendly label for the field */
  label: string
  /** A human-friendly description of the field */
  description: string
  /** The data type for the field */
  type: FieldTypeName
  /** Whether null is allowed or not */
  allowNull?: boolean
  /** Whether or not the field accepts multiple values (an array of `type`) */
  multiple?: boolean
  /** Whether or not the field accepts properties not defined by the builder */
  additionalProperties?: boolean
  /** An optional default value for the field */
  default?: FieldValue
  /** A placeholder display value that suggests what to input */
  placeholder?: string
  /** Whether or not the field supports dynamically fetching options */
  dynamic?: boolean
  /**
   * A predefined set of options for the setting.
   * Only relevant for `type: 'string'` or `type: 'number'`.
   */
  choices?:
    | Array<string>
    | Array<{
        /** The value of the option */
        value: string | number
        /** A human-friendly label for the option */
        label: string
      }>
  /** Whether or not the field is required */
  required?: boolean
  /**
   * Optional definition for the properties of `type: 'object'` fields
   * (also arrays of objects when using `multiple: true`)
   * Note: this part of the schema is not persisted outside the code
   * but is used for validation and typedefs
   */
  properties?: Record<string, Optional<InputField, 'description'>>
  /**
   * Format option to specify more nuanced 'string' types
   * @see {@link https://github.com/ajv-validator/ajv/tree/v6#formats}
   */
  format?:
    | 'date' // full-date according to RFC3339.
    | 'time' // time with optional time-zone.
    | 'date-time' // date-time from the same source (time-zone is mandatory). date, time and date-time validate ranges in full mode and only regexp in fast mode (see options).
    | 'uri' // full URI.
    | 'uri-reference' // URI reference, including full and relative URIs.
    | 'uri-template' // URI template according to RFC6570
    | 'email' // email address.
    | 'hostname' // host name according to RFC1034.
    | 'ipv4' // IP address v4.
    | 'ipv6' // IP address v6.
    | 'regex' // tests whether a string is a valid regular expression by passing it to RegExp constructor.
    | 'uuid' // Universally Unique IDentifier according to RFC4122.
    | 'password' // hint to the UI to hide/obfuscate input strings
    | 'text' // longer strings

  /**
   * Determines the UI representation of the object field. Only applies to object types.
   * Key Value Editor: Users can specify individual object keys and their mappings, ideal for custom objects.
   * Object Reference: Users can specify only another object in the segment event to use as the value for this key in the payload
   */
  defaultObjectUI?:
    | 'keyvalue' // Users will see the key value object editor by default and can change to the object editor.
    | 'object' // Users will see the object editor by default and can change to the key value editor.
    | 'keyvalue:only' // Users will only use the key value editor.
    | 'object:only' // Users will only use the object editor.
}

export type FieldValue = string | number | boolean | object | Directive

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

export interface CaseDirective {
  '@case': {
    operator: string
    value: FieldValue
  }
}

export type Directive = IfDirective | TemplateDirective | PathDirective | CaseDirective

/**
 * A function to configure a request client instance with options
 * that will be applied to every request made by that instance
 */
export type RequestExtension<Settings, Payload = undefined> = (data: ExecuteInput<Settings, Payload>) => RequestOptions

/**
 * Common fields derived from the Segment event schema for use in deletion calls to endpoints
 */
export interface DeletionPayload {
  userId: ID
  anonymousId: ID
}

/**
 * A function to perform a deletion request for GDPR or PII related data
 *
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Deletion<Settings, Return = any> = (
  request: RequestClient,
  data: ExecuteInput<Settings, DeletionPayload>
) => MaybePromise<Return>
