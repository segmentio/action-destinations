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
  /** Partial deep match against the JSON response body. Arrays must match length and each item is partial-matched. */
  jsonContains?: unknown
}

/**
 * The HTTP request was sent and the destination API returned a non-2xx response.
 * Use this to verify that the destination rejects specific inputs (e.g., bad auth, invalid payload).
 */
export interface E2EFailureExpectation {
  status: 'failure'
  httpStatus: E2EHttpFailureCode
  bodyContains?: string
  /** Partial deep match against the JSON response body. Arrays must match length and each item is partial-matched. */
  jsonContains?: unknown
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
 * - '$now'                  → current ISO 8601 timestamp (e.g., '2026-05-28T14:32:01.000Z')
 * - '$guid'                 → fresh UUID v4, unique each occurrence
 * - '$guid:<name>'          → UUID v4, consistent within a single fixture execution.
 *                             All occurrences of the same name resolve to the same value.
 * - '$externalAudienceId'   → resolved after createAudience step returns the destination's audience ID
 */
export type E2EDynamicValue = '$now' | '$guid' | `$guid:${string}` | '$externalAudienceId'

export type E2EExecutionMode = 'single' | 'batch' | 'batchWithMultistatus'

export type E2EFixture = E2ESingleFixture | E2EBatchFixture | E2EBatchWithMultistatusFixture

export interface E2EBaseFixture {
  /** Human-readable name for the test case, shown in runner output. */
  description: string
  /** FQL query that determines whether the event matches this subscription. */
  subscribe: string
  /** Mapping kit directives that transform the event into the action's payload shape. */
  mapping: JSONObject
  /** The expected outcome of executing this fixture. */
  expect: E2EExpectation
  /** Hint shown in verbose mode when this fixture fails. Helps developers diagnose common issues. */
  verboseFailureHint?: string
  /** Feature flags passed to the action, to exercise flag-gated code branches end-to-end. */
  features?: Record<string, boolean>
  /**
   * Max times the runner re-runs this fixture if it fails, with exponential backoff between attempts.
   * Overrides the run-level retry default. Useful for destinations with eventual consistency
   * (e.g. writes to a freshly-created audience that briefly return a transient error).
   */
  retries?: number
}

export interface E2ESingleFixture extends E2EBaseFixture {
  /** Executes via onEvent() with a single event. */
  mode: 'single'
  /**
   * The Segment event (track, identify, page, screen, etc.) sent into the action.
   * String values may use dynamic markers ($now, $guid, $guid:<name>) that the
   * runner resolves before execution.
   */
  event: SegmentEvent
}

export interface E2EBatchFixture extends E2EBaseFixture {
  /** Executes via onBatch() with multiple events. Response is a standard HTTP response. */
  mode: 'batch'
  /**
   * Array of Segment events sent into the action as a batch.
   * String values may use dynamic markers ($now, $guid, $guid:<name>) that the
   * runner resolves before execution.
   */
  events: SegmentEvent[]
}

export interface E2EBatchWithMultistatusFixture extends E2EBaseFixture {
  /** Executes via onBatch(). Response is a per-item MultiStatusResponse array. */
  mode: 'batchWithMultistatus'
  /**
   * Array of Segment events sent into the action as a batch.
   * String values may use dynamic markers ($now, $guid, $guid:<name>) that the
   * runner resolves before execution.
   */
  events: SegmentEvent[]
}

export interface E2EAudienceEventBase {
  computationKey: string
  computationId: string
  externalAudienceId?: string
  userId?: string
  anonymousId?: string
  email?: string
  audienceFields?: Record<string, unknown>
  includeContextTraits?: boolean
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

export interface E2EJourneysV1AudienceEventOptions<ComputationKey extends string = string> {
  computationKey: ComputationKey
  computationId: string
  externalAudienceId?: string
  userId?: string
  anonymousId?: string
  email?: string
  audienceFields?: Record<string, unknown>
  enrichedTraits?: Record<string, unknown>
}

export interface E2EJourneysV2AudienceEventOptions<ComputationKey extends string = string> {
  /** Whether the user is entering ('add') or exiting ('remove') the journey step. Sets properties[computationKey]. Defaults to 'add'. */
  action?: 'add' | 'remove'
  computationKey: ComputationKey
  computationId: string
  externalAudienceId?: string
  eventName?: string
  journeyId?: string
  journeyName?: string
  userId?: string
  anonymousId?: string
  email?: string
  audienceFields?: Record<string, unknown>
  enrichedTraits?: Record<string, unknown>
}

export interface E2ERetlAudienceEventOptions<ComputationKey extends string = string> {
  eventName: 'new' | 'updated' | 'deleted'
  computationKey: ComputationKey
  computationId: string
  externalAudienceId?: string
  userId?: string
  anonymousId?: string
  email?: string
  audienceFields?: Record<string, unknown>
  enrichedTraits?: Record<string, unknown>
}

export interface E2ERetlAudienceTrackEvent<ComputationKey extends string = string> extends SegmentEvent {
  type: 'track'
  event: 'new' | 'updated' | 'deleted'
  messageId: string
  timestamp: string
  context: {
    personas: {
      computation_class: 'audience'
      computation_key: ComputationKey
      computation_id: string
      external_audience_id?: string
    }
    traits?: { email?: string }
    audienceFields?: Record<string, unknown>
  }
  properties: { [key in ComputationKey]: boolean } & { [k: string]: JSONValue }
}

export interface E2EJourneysV1AudienceTrackEvent<ComputationKey extends string = string> extends SegmentEvent {
  type: 'track'
  event: "Audience Entered"
  messageId: string
  timestamp: string
  context: {
    personas: {
      computation_class: 'journey_step'
      computation_key: ComputationKey
      computation_id: string
      external_audience_id?: string
    }
    traits?: { email?: string }
    audienceFields?: Record<string, unknown>
  }
  properties: { [k: string]: JSONValue }
}

export interface E2EJourneysV2AudienceTrackEvent<ComputationKey extends string = string> extends SegmentEvent {
  type: 'track'
  event: string
  messageId: string
  timestamp: string
  context: {
    personas: {
      computation_class: 'journey_step'
      computation_key: ComputationKey
      computation_id: string
      external_audience_id?: string
    }
    traits?: { email?: string }
    audienceFields?: Record<string, unknown>
  }
  properties: {
    journey_context: { [k: string]: JSONValue }
    journey_metadata: { journey_id: string; journey_name: string; [k: string]: JSONValue }
  } & { [key in ComputationKey]: boolean } & { [k: string]: JSONValue }
}

export interface E2EEngageAudienceTrackEvent<ComputationKey extends string = string> extends SegmentEvent {
  type: 'track'
  event: string
  messageId: string
  timestamp: string
  context: {
    personas: {
      computation_class: 'audience'
      computation_key: ComputationKey
      computation_id: string
      external_audience_id?: string
    }
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
    personas: {
      computation_class: 'audience'
      computation_key: ComputationKey
      computation_id: string
      external_audience_id?: string
    }
    audienceFields?: Record<string, unknown>
  }
  traits: { [key in ComputationKey]: boolean } & { [k: string]: JSONValue }
}

export type E2EEngageAudienceEvent<ComputationKey extends string = string> =
  | E2EEngageAudienceTrackEvent<ComputationKey>
  | E2EEngageAudienceIdentifyEvent<ComputationKey>

export interface E2ESettingsSecretValue {
  $env: string
}

export interface E2ESettingsObject {
  [key: string]: string | number | boolean | E2ESettingsSecretValue | E2ESettingsObject
}

export interface E2EDestinationConfig {
  settings: E2ESettingsObject
}

export interface E2ETeardownContext {
  settings: Record<string, unknown>
}

export interface E2ETeardownAudienceContext extends E2ETeardownContext {
  externalAudienceId: string
  audienceSettings: Record<string, unknown>
}

export interface E2EAudienceConfig {
  /** Name of the audience to create/test against. Used as the audienceName param for createAudience. */
  audienceName: string
  /** Audience-level settings passed to createAudience and getAudience (e.g., id_type, owner_email). */
  audienceSettings: Record<string, unknown>
  /** When true, the runner calls createAudience before executing fixtures and captures the externalAudienceId. */
  createAudience: boolean
  /** When true, the runner calls getAudience after fixtures to verify the audience still exists. */
  getAudience: boolean
  /** When a function, the runner calls it after all tests to clean up the audience. Set to false to skip. */
  teardown: false | ((context: E2ETeardownAudienceContext) => Promise<void>)
}

export interface E2EAudienceDestinationConfig extends E2EDestinationConfig {
  audience: E2EAudienceConfig
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