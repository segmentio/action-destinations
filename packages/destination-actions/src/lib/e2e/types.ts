// E2E fixture types. Ported from action-destinations PR #3829, which placed these in
// packages/core. They live here (outside core) on purpose: the E2E framework must own
// secret resolution (process.env), which core forbids via no-restricted-imports.
// SegmentEvent / JSONObject / JSONValue are consumed from the published core package —
// using core, not modifying it.
import type { DestinationDefinition, RequestClient, SegmentEvent, JSONObject, JSONValue } from '@segment/actions-core'
import type { E2EObservation } from './adapters/types'

export type E2EExpectation =
  | E2ESuccessExpectation
  | E2EFailureExpectation
  | E2EErrorExpectation
  | E2EMultistatusExpectation

/** Response checks shared by `success` and `failure`, judged on the selected exchange. */
export interface E2EResponseChecks {
  bodyContains?: string
  /**
   * Partial deep match against the JSON response body. Arrays must match length and each item is
   * partial-matched. The value '$absent' requires the key to be missing.
   */
  jsonContains?: unknown
  /** The whole body after trimming both sides. A JSON body is compared as compact `JSON.stringify` output. */
  bodyEquals?: string
  /** Which exchange to judge: the last one matching `method` and a substring of `url`. Defaults to the last. */
  exchange?: E2EExchangeSelector
  /** How many partner requests the action sent, e.g. 2 for a 401 followed by a retry. */
  exchangeCount?: number
}

export interface E2EExchangeSelector {
  method?: string
  /** Substring of the request URL. */
  url?: string
}

/**
 * The HTTP request was sent and the destination API returned a 2xx response.
 */
export interface E2ESuccessExpectation extends E2EResponseChecks {
  status: 'success'
  httpStatus?: E2EHttpSuccessCode
}

/**
 * The HTTP request was sent and the destination API returned a non-2xx response.
 * Use this to verify that the destination rejects specific inputs (e.g., bad auth, invalid payload).
 */
export interface E2EFailureExpectation extends E2EResponseChecks {
  status: 'failure'
  httpStatus: E2EHttpFailureCode
}

/**
 * Our action code threw before making an HTTP request.
 * The request never left. Use this to verify client-side validation
 * (e.g., PayloadValidationError when required fields are missing).
 */
export interface E2EErrorExpectation {
  status: 'error'
  /**
   * The Segment error code integrations reports for the thrown error (e.g. 'PAYLOAD_VALIDATION_FAILED'),
   * not the JS class name: integrations never sees the class, so both adapters assert the code.
   */
  errorType: string
  errorMessage?: string
  /**
   * The status carried by the thrown error, where it has one. Segment's error classes take a status
   * which decides whether the event is retried, so this asserts that choice: a 400 is discarded
   * where a 500 is retried.
   */
  httpStatus?: number
}

/**
 * A batch's per-event results, as core returns them from onBatch, judged item by item in event
 * order. Use with 'batchWithMultistatus', where performBatch must return a MultiStatusResponse;
 * on a plain response every item is a copy of one status.
 */
export interface E2EMultistatusExpectation {
  status: 'multistatus'
  /** One per event, in event order. */
  items: E2EMultistatusItemExpectation[]
}

export type E2EMultistatusItemExpectation =
  | { status: '2xx' | E2EHttpSuccessCode }
  | {
      status: E2EHttpFailureCode
      /** Exact Segment error code, e.g. 'PAYLOAD_VALIDATION_FAILED'. */
      errortype: string
      /** Substring of the item's error message. */
      errormessage: string
      /** INTEGRATIONS when our code rejected the event, DESTINATION when the partner did. */
      errorreporter?: 'INTEGRATIONS' | 'DESTINATION'
    }

/**
 * Dynamic value markers that the runner resolves at execution time.
 *
 * - '$now'           → current ISO 8601 timestamp (e.g., '2026-05-28T14:32:01.000Z')
 * - '$guid'          → fresh UUID v4, unique each occurrence
 * - '$guid:<name>'   → UUID v4, consistent within a single fixture execution.
 *                      All occurrences of the same name resolve to the same value.
 * - '$before:<key>'  → the value the suite's or fixture's `before` hook returned under `key`, the
 *                      same on every attempt. A key no hook returned is a setup error.
 */
export type E2EDynamicValue = '$now' | '$guid' | `$guid:${string}` | `$before:${string}`

/** What `before` hooks return, and `$before:<key>` reads. */
export type E2EHookValues = Record<string, JSONValue>

export interface E2EHookContext {
  /** Destination settings with `{ $env }` resolved. */
  settings: Record<string, unknown>
  /** The destination's own request client (its extendRequest), for creating and deleting partner resources. */
  request: RequestClient
  /** Unique to this run. Put it in resource names so parallel runs never collide. */
  runId: string
}

/** What the suite's `after` learns about each fixture, so it cleans up only what is left. */
export interface E2EFixtureCleanup {
  description: string
  values: E2EHookValues
  /** Unset when the fixture did not run, e.g. its `before` failed. */
  outcome?: E2EResult['outcome']
  /** The fixture's own `after` ran and succeeded. */
  cleaned: boolean
}

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
  /**
   * Runs once before the fixture's attempts, after the suite's `before`. Returns values for
   * '$before:<key>', merged over the suite's. A throw is a setup error and the fixture does not run.
   */
  before?: (ctx: E2EHookContext & { values: E2EHookValues }) => Promise<E2EHookValues>
  /** Runs after the fixture, unless its own `before` threw, so a throwing `before` cleans up first. `observation` is the last attempt's, unset if it threw or none ran. A throw is a warning. */
  after?: (ctx: E2EHookContext & { values: E2EHookValues; observation?: E2EObservation }) => Promise<void>
}

export interface E2ESingleFixture extends E2EBaseFixture {
  /** Executes via onEvent() with a single event. */
  mode: 'single'
  /**
   * The Segment event (track, identify, page, screen, etc.) sent into the action.
   * String values may use dynamic markers ($now, $guid, $guid:<name>, $before:<key>) that the
   * runner resolves before execution.
   */
  event: SegmentEvent
}

export interface E2EBatchFixture extends E2EBaseFixture {
  /** Executes via onBatch() with multiple events. Response is a standard HTTP response. */
  mode: 'batch'
  /**
   * Array of Segment events sent into the action as a batch.
   * String values may use dynamic markers ($now, $guid, $guid:<name>, $before:<key>) that the
   * runner resolves before execution.
   */
  events: SegmentEvent[]
}

export interface E2EBatchWithMultistatusFixture extends E2EBaseFixture {
  /** Executes via onBatch(). Response is a per-item MultiStatusResponse array. */
  mode: 'batchWithMultistatus'
  /**
   * Array of Segment events sent into the action as a batch.
   * String values may use dynamic markers ($now, $guid, $guid:<name>, $before:<key>) that the
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
  // A warehouse row carries no membership boolean at properties[computation_key]: add and remove
  // are derived from the sync mode and the event name instead.
  properties: { [k: string]: JSONValue }
}

export interface E2EJourneysV1AudienceTrackEvent<ComputationKey extends string = string> extends SegmentEvent {
  type: 'track'
  event: 'Audience Entered'
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

/** One action's fixtures, as listed in `registry.ts`. */
export interface E2ESuite {
  /** Destination folder name, e.g. 'mixpanel'. `--destinations` scopes by this. */
  destination: string
  /** Action slug. */
  action: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  definition: DestinationDefinition<any>
  config: E2EDestinationConfig
  fixtures: E2EFixture[]
  /** Retries for this suite's fixtures that set none. */
  retries?: number
  /** Checks merged into every `success` expectation in the suite; a fixture's own keys win. */
  defaultSuccess?: Omit<E2ESuccessExpectation, 'status'>
  /** Runs once before the suite's fixtures. Its values reach every fixture. A throw is a setup error and the suite does not run. */
  before?: (ctx: E2EHookContext) => Promise<E2EHookValues>
  /** Runs after the suite's fixtures, even when `before` threw; not when the OAuth refresh before hooks failed. A throw is a warning. */
  after?: (ctx: E2EHookContext & { values: E2EHookValues; fixtures: E2EFixtureCleanup[] }) => Promise<void>
}

/** The outcome of one fixture. `fixture` is its `description`, the stable result ID. */
export interface E2EResult {
  suite: string
  fixture: string
  outcome: 'passed' | 'failed' | 'quarantined'
  attempts: number
  ms: number
  reason?: string
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
