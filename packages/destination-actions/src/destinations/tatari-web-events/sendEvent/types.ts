export interface TatariWebEvent {
  event_dt: string
  session_id: string
  event: string
  user_agent: string
  url: string
  ipv4?: string
  ipv6?: string
  user_id?: string
  distinct_id?: string
  referrer_url?: string
  args?: Record<string, unknown>
  hem_sha256?: string
  hem_sha1?: string
  hem_md5?: string
}

/**
 * 200: `{ accepted_count, rejected_count: 0 }`
 * 207: partial accept (ACCEPT_ANY_VALID) with `errors_by_index`
 * 400: full reject (REJECT_ALL_IF_ANY_INVALID, all-invalid, or a batch-level error)
 */
export interface BatchResponse {
  accepted_count?: number
  rejected_count?: number
  /** stringified zero-based index into the submitted array -> "CODE: detail" */
  errors_by_index?: Record<string, string>
  message?: string
  /** batch-level error (e.g. `batch size N exceeds maximum of 1000`) */
  error?: string
}
