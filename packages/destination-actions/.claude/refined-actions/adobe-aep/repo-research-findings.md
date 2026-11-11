# Adobe AEP destination: repo-side findings

Date: 2026-10-30
Scope: open questions from `refined-actions.md` that can be answered by reading this repo (no AEP access needed).
Separate file on purpose: `refined-actions.md/.json` were written by another session and are not modified.

---

## Q13. Retry classification (400 / 413 / 429 / 500 / 503)

**Finding.** `packages/core/src/errors.ts:28` defines the retryable HTTP statuses:
`408, 423, 429, 500, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 598, 599`.
`isRetryableStatus()` exposes this. 400 and 413 are NOT retryable; 429, 500 and 503 are.

**Consequence for the 207 case.** Adobe returns HTTP 207 even for failures, so the HTTP-level
retry never fires. Each failed message must be reported with its own status in the
`MultiStatusResponse`. The status we put on the per-message error is what drives retry downstream.

**Caveat.** This repo only shows the 401 re-auth loop for multistatus (see Q10). I did not find the code
that retries individual multistatus entries by status; that lives outside this repo (the platform component
that calls `performBatch`). Confirm with the platform team that per-entry 429/500/503 are retried.

**Proposed mapping (per message, from `responses[].statusCode`):**

| Adobe per-message status | Report as | Retried |
|---|---|---|
| 400 (bad request / unknown XDM format) | error, status 400 | No |
| 413 (over 1 MB) | should not happen with byte-bounded batching; error 413 if it does | No |
| 429 (throttled) | error, status 429 | Yes |
| 500 (processing error, e.g. schema mismatch) | Adobe doc example is a schema mismatch, which will not self-heal. Needs a decision: map to 400 (no retry) or keep 500 (retry). Open. | Open |
| 503 | error, status 503 | Yes |

---

## Multi-status batching API (how `performBatch` returns per-message results)

**Finding.** `MultiStatusResponse` is exported from `@segment/actions-core` (`core/src/index.ts:120`,
class at `core/src/destination-kit/action.ts:1209`). Per-index setters:

```ts
const msResponse = new MultiStatusResponse()
msResponse.setSuccessResponseAtIndex(i, { status: 200, sent: <payload>, body: <adobe entry> })
msResponse.setErrorResponseAtIndex(i, { status: 429, errormessage: '...', sent: <payload>, body: <adobe entry> })
return msResponse
```

- Types (`core/src/destination-kit/types.ts:394`): success = `{status, sent, body}`; error =
  `{status, errortype?, errormessage, sent?, body?}`.
- Error reporting: if an error has `sent` or `body`, it is attributed to the destination; otherwise to
  integrations (`action.ts` ~line 868). So include `sent`/`body` on API-originated errors.
- If `performBatch` returns something that is not a `MultiStatusResponse`, the whole batch is assumed successful
  (`action.ts` ~line 891). So for AEP we MUST return a `MultiStatusResponse`, never `void`/raw response, or 207 failures
  are silently treated as success.
- Index alignment: responses are by index into the payload array. Payloads that failed validation upstream are
  already filtered; use the indices of the payloads passed to `performBatch`.
- Working example to copy: `rokt-capi/send/functions.ts` (uses `setErrorResponseAtIndex` / `setSuccessResponseAtIndex`
  with `error.response?.status`). Others: `ms-bing-capi/sendEvent`, `quora/trackConversion`, `amazon-conversions-api/trackConversion`.
- Note the Adobe 207 response is a single HTTP request, so the mapping is: one request, loop over `responses[]`,
  match entry n to payload n.

---

## Q10 (part). OAuth approach

**Finding.** Two schemes exist: `oauth-managed` (used by attio, blackbaud, yotpo, reddit-audiences, hilo, google-sheets-dev)
and `oauth2` with a custom `refreshAccessToken` (many, incl. listrak, marketo-static-lists, salesforce-marketing-cloud,
taboola-actions, responsys).

Adobe IMS server-to-server is a **client-credentials** flow with the customer's own client ID/secret, so it matches the
`oauth2` + `refreshAccessToken` pattern, not `oauth-managed` (which is for Segment-owned OAuth apps with an authorization
code flow). Closest template in repo: `listrak/index.ts`:

```ts
authentication: {
  scheme: 'oauth2',
  fields: { client_id: {...}, client_secret: { type: 'password', ... } },
  refreshAccessToken: async (request, { settings, auth }) => {
    const res = await request(<token endpoint>, {
      method: 'POST',
      body: new URLSearchParams({ client_id: settings.client_id ?? auth.clientId,
                                  client_secret: settings.client_secret ?? auth.clientSecret,
                                  grant_type: 'client_credentials' /* + scope */ }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    return { accessToken: res.data.access_token }
  }
},
extendRequest({ auth }) { return { headers: { authorization: `Bearer ${auth?.accessToken}`, 'x-api-key': ... } } }
```

**401 handling is built in.** `core/src/destination-kit/index.ts` (~line 1131-1190): on HTTP 401, and also when a
multistatus result contains any 401 entry, an `oauth2`/`oauth-managed` destination refreshes the token and retries
(bounded by `MAX_ATTEMPTS`). So a customer-authenticated inlet returning 401/403 per message in a 207 will trigger
re-auth for free if we report the status as 401. Note it keys on **401 only**, and Adobe uses 403 for an invalid/expired
token. Map Adobe's 403-invalid-token to 401 in the per-message status, or the refresh will not fire.

**Still not answerable from the repo (needs Adobe docs or live access):** the token endpoint URL, scope string,
and whether the Bearer token is required for unauthenticated inlets (if optional, `clientId`/`clientSecret` should
be `required: false` and `extendRequest` must not send a bad header).

---

## Q6 (second half). Nested JSON / XDM path mapping in the UI

**Finding.** The framework already supports what is needed:

- `type: 'object'` + `additionalProperties: true` + `defaultObjectUI: 'keyvalue'` (or `'keyvalue:only'`) gives the key-value
  editor where the customer types the key (the XDM path) and maps a value
  (`core/src/destination-kit/types.ts:225`). 351 destinations use `defaultObjectUI`, so this is a well-trodden pattern.
- Nothing in core expands dotted keys into nested JSON. `core` exports `get` but no `set`; mapping-kit has `flatten.ts`
  (the inverse direction). `lodash` is a dependency of `destination-actions`, but I found no destination importing
  `lodash/set`. Recommendation: a small, unit-tested helper in the destination (`setPath(obj, 'a.b.c', v)`), with explicit
  handling for:
  - collisions (`a` and `a.b` both mapped), decide: later key wins vs throw `PayloadValidationError`;
  - keys containing literal dots (XDM tenant namespaces start with `_tenantId`; sub-keys do not contain dots, so splitting on `.` is safe);
  - prototype-pollution keys (`__proto__`, `constructor`, `prototype`) must be rejected since keys are customer-entered.
- Alternative the PRD hints at ("nested JSON output, open qs"): `defaultObjectUI: 'object'` lets the user map a whole nested object,
  but forces them to pre-shape it in Segment. Flat dotted paths are the lower-risk default; offer both.

---

## Q11 (part). Schema introspection in the UI

**Finding.** Supported via dynamic fields (284 destinations use `dynamicFields`). Pattern (see `sendgrid/sendEmail/index.ts`):
the field sets `dynamic: true` and the action defines `dynamicFields: { field_name: async (request, { settings, payload }) => ... }`
returning `{ choices: [{label, value}], error?: {message, code} }`. The handler gets `request` (with `extendRequest` auth applied),
so it can call the Schema Registry with the customer's token.

Limits for our use: dynamic fields populate **choices for a field**, not free-form key suggestions in a key-value editor.
For XDM paths this likely means: a dynamic dropdown of available *schemas* (feeds `schemaRefId`) and validation of mapped
paths against the fetched schema inside `perform`/`testAuthentication`, rather than per-key autocomplete. I did not find
an existing destination doing per-key autocomplete in a `keyvalue` editor. Treat true path autocomplete as a UI-team ask, not
something the destination alone can deliver. This supports shipping manual path entry in P0 and treating introspection as P1.

Also note: I could not find a `dependsOn` mechanism in `types.ts`, so one dynamic field cannot depend on another field's
selected value here. Check this before designing "pick schema, then list its paths".

---

## Batching fields (supports the Q12 / batching design)

- Repo guideline (CLAUDE.md): keep `batch_bytes` `unsafe_hidden: true`, platform does the chunking before `performBatch`.
  Existing examples with `batch_bytes`: `aws-kinesis/send`, `altertable/identify`.
- Therefore the "auto-split before 1 MB" requirement is met by setting a `batch_bytes` default with headroom
  (e.g. 800 KB-900 KB), not by chunking in code. Still defend in code: if a single message alone exceeds the limit,
  report that index as a 413 error rather than failing the batch.

---

## Q12. Per-destination vs per-action settings (design recommendation)

No code can answer this, but the repo pattern is clear: customer-wide credentials in `authentication.fields` (settings);
anything that varies by data shape goes on the action. Recommendation matching the blueprint: `imsOrgId`, `clientId`,
`clientSecret`, `sandboxName` as settings; `schemaRefId`, `schemaRefContentType`, `datasetId` as action fields (events vs
profiles differ). `inletId` is the open one: if events and profiles use separate inlets it must be an action field, and a
settings-level default can be overridden per action. Needs confirmation with a real AEP setup or Adobe.

---

## Summary

| Question | Status after repo research |
|---|---|
| Multi-status per-message handling | Answered: use `MultiStatusResponse`; must return it or 207 failures are swallowed |
| Q13 retry classification | Mostly answered: retryable set known; per-entry retry owner is outside repo; 500-in-207 needs a decision |
| Q10 OAuth scheme | Answered: `oauth2` + `refreshAccessToken` (client credentials), 401 re-auth is built in. Map Adobe 403 to 401. Token URL/scope/auth-optional still need Adobe docs |
| Q6 nested paths | Answered: key-value object field + own dotted-path helper (with collision and `__proto__` guards) |
| Q11 introspection | Partly answered: dynamic fields give schema pickers, not per-key autocomplete; no `dependsOn` found |
| Batching | Answered: `batch_bytes` hidden with headroom, per-message oversize guard |
| Q12 | Recommendation only |
| Q5, Q9 | Not repo questions (Adobe docs / decision) |
