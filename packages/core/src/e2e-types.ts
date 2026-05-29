import type { SegmentEvent } from './segment-event'
import type { JSONObject, JSONValue } from './json-object'

export type E2EExpectation = E2ESuccessExpectation | E2EFailureExpectation | E2EErrorExpectation

/**
 * The HTTP request was sent and the destination API returned a 2xx response.
 */
export interface E2ESuccessExpectation {
  status: 'success'
  httpStatus?: E2EHttpSuccessCode
  bodyContains?: string
}

/**
 * The HTTP request was sent and the destination API returned a non-2xx response.
 * Use this to verify that the destination rejects specific inputs (e.g., bad auth, invalid payload).
 */
export interface E2EFailureExpectation {
  status: 'failure'
  httpStatus: E2EHttpFailureCode
  bodyContains?: string
}

/**
 * Our action code threw before making an HTTP request.
 * The request never left. Use this to verify client-side validation
 * (e.g., PayloadValidationError when required fields are missing).
 */
export interface E2EErrorExpectation {
  status: 'error'
  errorType: string
  errorMessage?: string
}

/**
 * Dynamic value markers that the runner resolves at execution time.
 *
 * - '$now'          → current ISO 8601 timestamp (e.g., '2026-05-28T14:32:01.000Z')
 * - '$guid'         → fresh UUID v4, unique each occurrence
 * - '$guid:<name>'  → UUID v4, consistent within a single fixture execution.
 *                     All occurrences of the same name resolve to the same value.
 */
export type E2EDynamicValue = '$now' | `$guid` | `$guid:${string}`

export interface E2EFixture {
  /** Human-readable name for the test case, shown in runner output. */
  description: string
  /** FQL query that determines whether the event matches this subscription. */
  subscribe: string
  /** Mapping kit directives that transform the event into the action's payload shape. */
  mapping: JSONObject
  /**
   * The Segment event (track, identify, page, screen, etc.) sent into the action.
   * String values may use dynamic markers ($now, $guid, $guid:<name>) that the
   * runner resolves before execution.
   */
  event: SegmentEvent
  /** The expected outcome of executing this fixture. */
  expect: E2EExpectation
}

export interface E2EEngageAudienceEventOptions<ComputationKey extends string = string> {
  type: 'track' | 'identify'
  action: 'add' | 'remove'
  computationKey: ComputationKey
  computationId: string
  externalAudienceId?: string
  eventName?: string
  userId?: string
  anonymousId?: string
  email?: string
  audienceFields?: Record<string, unknown>
  enrichedTraits?: Record<string, unknown>
}

export interface E2EEngageAudiencePersonas<ComputationKey extends string = string> {
  computation_class: 'audience'
  computation_key: ComputationKey
  computation_id: string
  external_audience_id?: string
}

export interface E2EEngageAudienceTrackEvent<ComputationKey extends string = string> extends SegmentEvent {
  type: 'track'
  event: string
  messageId: string
  timestamp: string
  context: {
    personas: E2EEngageAudiencePersonas<ComputationKey>
    traits?: { email?: string }
    audienceFields?: Record<string, unknown>
  }
  properties: { [key in ComputationKey]: boolean } & { [k: string]: JSONValue }
}

export interface E2EEngageAudienceIdentifyEvent<ComputationKey extends string = string> extends SegmentEvent {
  type: 'identify'
  messageId: string
  timestamp: string
  context: {
    personas: E2EEngageAudiencePersonas<ComputationKey>
    audienceFields?: Record<string, unknown>
  }
  traits: { [key in ComputationKey]: boolean } & { [k: string]: JSONValue }
}

export type E2EEngageAudienceEvent<ComputationKey extends string = string> =
  | E2EEngageAudienceTrackEvent<ComputationKey>
  | E2EEngageAudienceIdentifyEvent<ComputationKey>

export interface E2EAudienceFixture {
  description: string
  audienceSettings: Record<string, unknown>
  audienceName: string
  subscribe: string
  mapping: JSONObject
  steps: E2EAudienceStep[]
}

export type E2EAudienceStep =
  | E2ECreateAudienceStep
  | E2EGetAudienceStep
  | E2ESyncAudienceSingleStep
  | E2ESyncAudienceBatchStep
  | E2ETeardownAudienceStep

export interface E2ECreateAudienceStep {
  type: 'createAudience'
  description: string
  expect: E2EExpectation
}

export interface E2EGetAudienceStep {
  type: 'getAudience'
  description: string
  expect: E2EExpectation
}

export type E2EExecutionMode = 'single' | 'batch'

export interface E2ESyncAudienceSingleStep {
  type: 'syncAudience'
  description: string
  mode: Extract<E2EExecutionMode, 'single'>
  event: E2EAudienceSyncEvent
  expect: E2EExpectation
}

export interface E2ESyncAudienceBatchStep {
  type: 'syncAudience'
  description: string
  mode: Extract<E2EExecutionMode, 'batch'>
  events: E2EAudienceSyncEvent[]
  expect: E2EExpectation
}

export interface E2ETeardownAudienceStep {
  type: 'teardownAudience'
  description: string
  expect: E2EExpectation
}

export interface E2EAudienceSyncEvent {
  eventType: 'track' | 'identify'
  action: 'add' | 'remove'
  userId?: string
  anonymousId?: string
  email?: string
  enrichedTraits?: Record<string, unknown>
}

export interface E2ESettingsSecretValue {
  $env: string
}

export interface E2EDestinationConfig {
  settings: Record<string, string | number | boolean | E2ESettingsSecretValue>
}

export type E2EHttpSuccessCode = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226

export type E2EHttpFailureCode =
  | 300
  | 301
  | 302
  | 303
  | 304
  | 305
  | 306
  | 307
  | 308
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 407
  | 408
  | 409
  | 410
  | 411
  | 412
  | 413
  | 414
  | 415
  | 416
  | 417
  | 418
  | 421
  | 422
  | 423
  | 424
  | 425
  | 426
  | 428
  | 429
  | 431
  | 451
  | 499
  | 500
  | 501
  | 502
  | 503
  | 504
  | 505
  | 506
  | 507
  | 508
  | 509
  | 510
  | 511
  | 529
  | 598
  | 599
