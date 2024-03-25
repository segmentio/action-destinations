export { Destination, fieldsToJsonSchema } from './destination-kit'
export { getAuthData } from './destination-kit/parse-settings'
export { transform } from './mapping-kit'
export {
  ArrayPathDirective,
  CaseDirective,
  Directive,
  DirectiveMetadata,
  FieldValue,
  IfDirective,
  LiteralDirective,
  PathDirective,
  PrimitiveValue,
  ReplaceDirective,
  TemplateDirective,
  JSONDirective,
  getFieldValue,
  getFieldValueKeys,
  isArrayPathDirective,
  isCaseDirective,
  isDirective,
  isIfDirective,
  isLiteralDirective,
  isPathDirective,
  isReplaceDirective,
  isTemplateDirective,
  isJSONDirective
} from './mapping-kit/value-keys'
export { createTestEvent } from './create-test-event'
export { createTestIntegration } from './create-test-integration'
export { default as createInstance } from './request-client'
export { defaultValues } from './defaults'
export {
  IntegrationError,
  InvalidAuthenticationError,
  RetryableError,
  PayloadValidationError,
  SelfTimeoutError,
  APIError,
  ErrorCodes
} from './errors'
export { get } from './get'
export { omit } from './omit'
export { removeUndefined } from './remove-undefined'
export { time, duration } from './time'

export { realTypeOf, isObject, isArray, isString } from './real-type-of'

export type { RequestOptions } from './request-client'
export { HTTPError, DEFAULT_REQUEST_TIMEOUT } from './request-client'
export { ModifiedResponse } from './types'
export { default as fetch, Request, Response, Headers } from './fetch'

export type {
  BaseActionDefinition,
  ActionDefinition,
  ActionHookResponse,
  BaseDefinition,
  DestinationDefinition,
  AudienceDestinationDefinition,
  ExecuteInput,
  Subscription,
  SubscriptionStats,
  AuthenticationScheme,
  BasicAuthentication,
  CustomAuthentication,
  OAuth2Authentication,
  OAuthManagedAuthentication,
  OAuth2ClientCredentials,
  RefreshAccessTokenResult,
  RequestFn,
  DecoratedResponse,
  MinimalInputField,
  StateContext,
  StatsContext,
  Preset
} from './destination-kit'

export type {
  DynamicFieldResponse,
  DynamicFieldError,
  DynamicFieldItem,
  InputField,
  GlobalSetting,
  RequestExtension
} from './destination-kit/types'

export type { JSONPrimitive, JSONValue, JSONObject, JSONArray, JSONLike, JSONLikeObject } from './json-object'

export type { SegmentEvent } from './segment-event'

export type { RequestClient } from './create-request-client'
