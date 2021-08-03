import type { RequestOptions } from '../request-client'
import type { JSONObject } from '../json-object'
import { AuthTokens } from './parse-settings'

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

export interface Result {
  output?: JSONObject | string | null | undefined
  error?: JSONObject | null
}

export interface ExecuteInput<Settings, Payload> {
  /** The subscription mapping definition */
  readonly mapping?: JSONObject
  /** The global destination settings */
  readonly settings: Settings
  /** The transformed input data, based on `mapping` + `event` */
  payload: Payload
  /** The page used in dynamic field requests */
  page?: string
  /** The data needed in OAuth requests */
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

/** The supported field type names */
export type FieldTypeName = 'string' | 'text' | 'number' | 'integer' | 'datetime' | 'boolean' | 'password' | 'object'

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
  /** An optional default value for the field */
  default?: FieldValue
  /** A placeholder display value that suggests what to input */
  placeholder?: string
  /** Whether or not the field supports dynamically fetching options */
  dynamic?: boolean
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

export type Directive = IfDirective | TemplateDirective | PathDirective

/**
 * A function to configure a request client instance with options
 * that will be applied to every request made by that instance
 */
export type RequestExtension<Settings, Payload = unknown> = (data: ExecuteInput<Settings, Payload>) => RequestOptions
