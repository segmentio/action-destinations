export const SUBMIT_FORM_ENDPOINT = '/rest/v1/leads/submitForm.json'

// Marketo returns HTTP 200 even on failure, with the real error code in the response body.
// Errors appear at two levels:
//   - Response-level: top-level `errors[]` with `success: false` (whole request failed)
//   - Record-level:   `result[].reasons[]` with `success: true` (request ok, this record skipped)
// See: https://experienceleague.adobe.com/en/docs/marketo-developer/marketo/rest/error-codes

// Response-level auth errors. These trigger an OAuth2 token refresh + retry on the platform.
//   601 - Access token invalid
//   602 - Access token expired
export const AUTH_ERROR_CODES = new Set(['601', '602'])

// Response-level errors that are safe to retry (documented as transient by Marketo).
// Retrying the same request later will likely succeed without any change.
//   500 - Internal server error
//   502 - Bad gateway
//   604 - Request time-out
//   606 - Max rate limit exceeded
//   607 - Daily quota reached
//   608 - API temporarily unavailable
//   611 - System error
//   614 - Invalid subscription
//   615 - Concurrent access limit reached
//   713 - Transient error
//   719 - Lock wait timeout exception
export const ResponseLevelErrorRetryableCode = new Set([
  '500',
  '502',
  '604',
  '606',
  '607',
  '608',
  '611',
  '614',
  '615',
  '713',
  '719'
])

// Record-level errors that are safe to retry (documented as transient by Marketo).
// These are queue/throttle conditions on an individual record that clear over time.
//   1016 - Too many imports queued
//   1019 - Import in progress
//   1020 - Too many clones to program
//   1029 - Too many jobs in queue / quota exceeded
// NOTE: 1004 "Lead not found" and 1013 "Object not found" are documented PERMANENT,
// so they are intentionally NOT here. Whether the "entity not ready yet" race the
// customer worked around with a 3s delay actually surfaces as a retryable code is
// still TBD -- pending customer clarification.
export const RecordLevelErrorRetryableCode = new Set(['1016', '1019', '1020', '1029'])
