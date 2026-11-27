// The seam between the runner core and whatever executes a fixture. The core builds an
// CTInvocation and judges the CTObservation; an adapter only sends and reports. The in-process
// adapter lives here; integrations implements its own against its CloudEvents route.
import type { JSONObject, RefreshAccessTokenResult, SegmentEvent } from '@segment/actions-core'
import type { CTExecutionMode, CTSuite } from '../types'

/** Everything needed to run one fixture, already resolved, independent of how it is sent. */
export interface CTInvocation {
  /** The destination definition's slug, e.g. 'actions-mixpanel'. */
  slug: string
  action: string
  mode: CTExecutionMode
  /** One event for 'single', otherwise the batch. Dynamic markers are resolved. */
  events: SegmentEvent[]
  /** Destination settings with `{ $env }` markers resolved, and tokens refreshed earlier in the run. No subscription. */
  settings: Record<string, unknown>
  subscribe: string
  /** The action's field defaults overlaid with the fixture's mapping, as a stored subscription carries it. */
  mapping: JSONObject
  features: Record<string, boolean>
}

/** One partner HTTP exchange. `status` and `body` are the partner's response. */
export interface CTExchange {
  method: string
  url: string
  status: number
  body: unknown
}

export interface CTObservedError {
  /** Segment error code, as integrations reports it (e.g. 'PAYLOAD_VALIDATION_FAILED'). */
  type: string
  message: string
  status?: number
}

export interface CTMultiStatusItem {
  status: number
  errortype?: string
  errormessage?: string
  errorreporter?: string
}

/** What happened, in terms both adapters can observe. */
export interface CTObservation {
  exchanges: CTExchange[]
  error?: CTObservedError
  multistatus?: CTMultiStatusItem[]
  /**
   * Whether the action's performBatch returned a MultiStatusResponse. Core turns any other return
   * into per-event results that copy one status. Unset when performBatch threw or never ran, or the
   * adapter can't see it.
   */
  returnedMultiStatus?: boolean
  /**
   * The tokens core passed to onTokenRefresh after a 401, which the runner reuses for the rest of
   * the run. Unset when nothing was refreshed or the adapter keeps tokens itself.
   */
  refreshedTokens?: RefreshAccessTokenResult
  /**
   * The destination's refreshAccessToken threw or returned nothing. Core reports the first as the
   * token request's own error, so `error` alone can't tell. Unset when the adapter can't see it.
   */
  refreshFailed?: boolean
}

export interface CTAdapter {
  /** 'in-process' here; integrations names its own. Recorded in the report. */
  readonly name: string
  /**
   * Send one invocation and report what happened. Throw CTSetupError when the target itself is
   * unusable (e.g. unreachable); any other throw counts as a fixture failure.
   */
  run(invocation: CTInvocation, suite: CTSuite): Promise<CTObservation>
}

/** A problem with the run's setup rather than with a destination: makes the run exit 2. */
export class CTSetupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CTSetupError'
  }
}
