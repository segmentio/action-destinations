# Google Customer Match: Migration from OfflineUserDataJob to Data Manager API

Google is deprecating the `OfflineUserDataJob` API for Customer Match. The replacement is the **Google Data Manager API v1**, which simplifies the upload flow from a 3-step async process to a single synchronous API call.

---

<details>
<summary><strong>Feature Flag</strong></summary>

| Flag Name                  | Value                                        |
| -------------------------- | -------------------------------------------- |
| `FLAGON_NAME_DATA_MANAGER` | `google-customer-match-use-data-manager-api` |

- Flag **off** (default): existing `OfflineUserDataJob` code path runs unchanged
- Flag **on**: all Customer Match uploads route through the Data Manager API

Both code paths coexist in the codebase during rollout. The old path is only removed after the flag is fully enabled and stable.

</details>

---

<details>
<summary><strong>API Comparison</strong></summary>

### Old API — OfflineUserDataJob (3 steps)

```
Step 1: POST https://googleads.googleapis.com/{version}/customers/{customerId}/offlineUserDataJobs:create
Step 2: POST https://googleads.googleapis.com/{version}/{resourceName}:addOperations
Step 3: POST https://googleads.googleapis.com/{version}/{resourceName}:run
```

- Requires `developer-token` header on every request
- Requires `login-customer-id` header for MCC accounts
- Async — job must be explicitly run after operations are added
- Supports partial failure (`enablePartialFailure: true`)
- User list referenced as `customers/{customerId}/userLists/{audienceId}`

### New API — Data Manager v1 (single call)

```
Add users:    POST https://datamanager.googleapis.com/v1/audienceMembers:ingest
Remove users: POST https://datamanager.googleapis.com/v1/audienceMembers:remove
```

- No `developer-token` header required
- No `login-customer-id` header — login account passed in the request body instead
- Synchronous — single call handles everything
- No partial failure support
- Audience referenced via `productDestinationId` (numeric ID only)

</details>

---

<details>
<summary><strong>OAuth Changes</strong></summary>

> This is the most impactful migration concern for existing connections.

### Current OAuth Setup (`index.ts`)

The destination uses the `oauth2` scheme with two relevant functions:

**`refreshAccessToken`** — exchanges a refresh token for an access token via `https://www.googleapis.com/oauth2/v4/token`. This is shared between both APIs and **does not change**.

**`extendRequest`** — injects shared headers on every outgoing request:

```typescript
extendRequest({ auth, settings }) {
  const loginCustomerId = settings?.loginCustomerId?.trim().replace(/-/g, '')
  return {
    headers: {
      authorization: `Bearer ${auth?.accessToken}`,
      ...(loginCustomerId && { 'login-customer-id': loginCustomerId })
    }
  }
}
```

---

### Required Scope Change

| API                              | OAuth Scope                                   |
| -------------------------------- | --------------------------------------------- |
| Google Ads OfflineUserDataJob    | `https://www.googleapis.com/auth/adwords`     |
| Google Data Manager              | `https://www.googleapis.com/auth/datamanager` |
| **During rollout (both active)** | **Both scopes must be requested together**    |

**Updated combined scope string:**

```
https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/datamanager
```

The scope must be updated in two places:

1. **Google Cloud Console** — add `datamanager` to the OAuth app's allowed scopes
2. **Segment platform OAuth configuration** — update the requested scope string

---

### Impact on Existing Connections

Existing OAuth tokens were issued with only the `adwords` scope. Calling Data Manager endpoints with these tokens returns **`403 Forbidden`**.

**Every existing connection must re-authorize before the feature flag is turned on.**

The re-authorization triggers a new OAuth consent flow that requests both scopes, issuing a token valid for both APIs.

---

### `login-customer-id` Header Behavior

`extendRequest` currently injects the `login-customer-id` header on all requests when `loginCustomerId` is set. The Data Manager API does not use this header — the login account is passed in the request body (`destinations[].loginAccount`) instead.

|                                    | Old API (Google Ads)            | New API (Data Manager)                          |
| ---------------------------------- | ------------------------------- | ----------------------------------------------- |
| MCC account identified via         | `login-customer-id` HTTP header | `destinations[].loginAccount.accountId` in body |
| Header injected by `extendRequest` | Yes — required                  | Yes — harmless, ignored by Data Manager         |
| Header removal needed              | No                              | Deferred to final cleanup after flag removal    |

The header being sent to Data Manager is harmless (unknown headers are ignored). No immediate change to `extendRequest` is required. It should be removed in the final cleanup pass when the OfflineUserDataJob path is deleted.

---

### `developer-token` Header

The `developer-token` header is added per-request inside `createOfflineUserJob`, `addOperations`, and `runOfflineUserJob` — **not** via `extendRequest`. The new Data Manager functions (`ingestAudienceMembers`, `removeAudienceMembers`) do not add this header. No change needed.

---

### OAuth Migration Checklist

| Step                                              | Where                | Must complete before flag on? |
| ------------------------------------------------- | -------------------- | ----------------------------- |
| Add `datamanager` scope to OAuth app              | Google Cloud Console | Yes                           |
| Update requested scope in Segment platform config | Segment platform     | Yes                           |
| Existing connections re-authorize                 | Customer action      | Yes — 403 errors otherwise    |
| Remove `login-customer-id` from `extendRequest`   | `index.ts`           | No — defer to final cleanup   |
| Remove `developer-token` from old functions       | `functions.ts`       | No — defer to final cleanup   |

</details>

---

<details>
<summary><strong>Request Body Structure</strong></summary>

### Old — `offlineUserDataJobs:create` body

```json
{
  "job": {
    "type": "CUSTOMER_MATCH_USER_LIST",
    "customerMatchUserListMetadata": {
      "userList": "customers/{customerId}/userLists/{audienceId}",
      "consent": {
        "adUserData": "GRANTED",
        "adPersonalization": "GRANTED"
      }
    }
  }
}
```

Followed by a separate `addOperations` call and a `run` call.

### New — `audienceMembers:ingest` / `audienceMembers:remove` body

```json
{
  "destinations": [
    {
      "reference": "dest1",
      "operatingAccount": {
        "accountId": "{customerId}",
        "accountType": "GOOGLE_ADS"
      },
      "loginAccount": {
        "accountId": "{loginCustomerId}",
        "accountType": "GOOGLE_ADS_MANAGER"
      },
      "productDestinationId": "{audienceId}"
    }
  ],
  "audienceMembers": [
    {
      "destinationReferences": ["dest1"],
      "consent": {
        "adUserData": "GRANTED",
        "adPersonalization": "GRANTED"
      },
      "userData": {
        "userIdentifiers": [
          { "emailAddress": "<sha256-hex>" },
          { "phoneNumber": "<sha256-hex>" },
          {
            "address": {
              "givenName": "<sha256-hex>",
              "familyName": "<sha256-hex>",
              "regionCode": "US",
              "postalCode": "98004"
            }
          }
        ]
      }
    }
  ]
}
```

> `loginAccount` is only included when `settings.loginCustomerId` is set.

</details>

---

<details>
<summary><strong>Field Name Changes (Old → New)</strong></summary>

### CONTACT_INFO

| Old field                     | New field                                 | Notes                     |
| ----------------------------- | ----------------------------------------- | ------------------------- |
| `hashedEmail`                 | `userData.userIdentifiers[].emailAddress` | SHA-256 hex, same hashing |
| `hashedPhoneNumber`           | `userData.userIdentifiers[].phoneNumber`  | SHA-256 hex, same hashing |
| `addressInfo.hashedFirstName` | `address.givenName`                       | SHA-256 hex, same hashing |
| `addressInfo.hashedLastName`  | `address.familyName`                      | SHA-256 hex, same hashing |
| `addressInfo.countryCode`     | `address.regionCode`                      | Plaintext, unchanged      |
| `addressInfo.postalCode`      | `address.postalCode`                      | Plaintext, unchanged      |

Old — identifiers flat inside `userIdentifiers`:

```json
{ "hashedEmail": "abc123" }
```

New — identifiers wrapped inside `userData.userIdentifiers`:

```json
{ "userData": { "userIdentifiers": [{ "emailAddress": "abc123" }] } }
```

### MOBILE_ADVERTISING_ID

| Old                        | New                                       |
| -------------------------- | ----------------------------------------- |
| `mobileId` (single string) | `mobileData.mobileIds` (array of strings) |

```json
// Old
{ "mobileId": "test-adid-123" }

// New
{ "mobileData": { "mobileIds": ["test-adid-123"] } }
```

### CRM_ID

| Old                         | New                          |
| --------------------------- | ---------------------------- |
| `thirdPartyUserId` (string) | `userIdData.userId` (string) |

```json
// Old
{ "thirdPartyUserId": "user-abc" }

// New
{ "userIdData": { "userId": "user-abc" } }
```

### Consent

| Old                                                                   | New                                                              |
| --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| In `customerMatchUserListMetadata.consent` (job-level, one per batch) | In each `audienceMembers[].consent` (member-level, one per user) |

### Account identifiers

| Old                                               | New                                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| Customer ID in URL path: `.../customers/{id}/...` | `destinations[].operatingAccount.accountId`                                      |
| `accountType` not present                         | `accountType: "GOOGLE_ADS"` required                                             |
| Login customer ID in header                       | `destinations[].loginAccount.accountId` with `accountType: "GOOGLE_ADS_MANAGER"` |
| `developer-token` header                          | Not used                                                                         |

</details>

---

<details>
<summary><strong>Add vs Remove Operations</strong></summary>

### Old API

Both add and remove are sent to the same `addOperations` endpoint, distinguished by the operation wrapper:

```json
// Add
{ "operations": [{ "create": { "userIdentifiers": [...] } }] }

// Remove
{ "operations": [{ "remove": { "userIdentifiers": [...] } }] }
```

### New API

Separate endpoints per operation type:

| Operation    | Endpoint                                                            |
| ------------ | ------------------------------------------------------------------- |
| Add users    | `POST https://datamanager.googleapis.com/v1/audienceMembers:ingest` |
| Remove users | `POST https://datamanager.googleapis.com/v1/audienceMembers:remove` |

Both endpoints use the same request body schema. A single call to `handleUpdate` or `processBatchPayload` may call both endpoints if a batch contains both adds and removes.

</details>

---

<details>
<summary><strong>Partial Failure</strong></summary>

|                               | Old API                                     | New API                            |
| ----------------------------- | ------------------------------------------- | ---------------------------------- |
| Partial failure supported     | Yes (`enablePartialFailure: true`)          | No                                 |
| Per-item error tracking       | Yes — `partialFailureError` in response     | No — entire call succeeds or fails |
| Concurrent modification retry | Yes — 400 converted to RetryableError (500) | Not applicable                     |

In the batch path (`processBatchPayload`), per-payload **validation** errors are still tracked via `MultiStatusResponse` before the API call is made. However, if the API call itself fails, all payloads in that batch are marked as failed — there is no per-record error detail from the Data Manager API.

</details>

---

<details>
<summary><strong>Error Handling</strong></summary>

### Old API

- HTTP errors from Google Ads are `GoogleAdsError` instances with structured `error.details`
- `CONCURRENT_MODIFICATION` (HTTP 400) is converted to `RetryableError` (HTTP 500) so Centrifuge retries
- Partial failure decoded from `partialFailureError` in the response body, mapped back to individual payload indices

### New API

- Standard HTTP errors — no special `CONCURRENT_MODIFICATION` handling needed
- `ingestAudienceMembers` / `removeAudienceMembers` return `{ success: false, error }` on failure
- In `handleUpdate` (single event `perform`): throws the error so Centrifuge handles retry logic
- In `processBatchPayload` (batch `performBatch`): sets error on all affected indices in `MultiStatusResponse`

</details>

---

<details>
<summary><strong>Code Changes Summary</strong></summary>

### `functions.ts`

**New constants:**

```typescript
export const FLAGON_NAME_DATA_MANAGER = 'google-customer-match-use-data-manager-api'
export const DATA_MANAGER_API_BASE = 'https://datamanager.googleapis.com/v1'
```

**New helper functions** (added alongside existing OfflineUserDataJob functions, not replacing them):

| Function                                                                    | Purpose                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `buildDataManagerDestination(customerId, audienceId, loginCustomerId?)`     | Builds `destinations[]` entry for the request body           |
| `buildDataManagerMemberData(payload, idType, features?, statsContext?)`     | Builds the member data object per ID type                    |
| `buildDataManagerAudienceMember(payload, idType, features?, statsContext?)` | Wraps member data with `destinationReferences` and `consent` |
| `ingestAudienceMembers(request, body, statsContext?)`                       | POSTs to `audienceMembers:ingest`                            |
| `removeAudienceMembers(request, body, statsContext?)`                       | POSTs to `audienceMembers:remove`                            |

**Modified `handleUpdate`:**

- Feature flag check added at top
- When flag on: calls Data Manager path, returns early
- When flag off: falls through to existing OfflineUserDataJob logic unchanged

**Modified `processBatchPayload`:**

- Same feature flag branching
- Data Manager path validates each payload individually and tracks errors via `MultiStatusResponse`

### `types.ts`

- `loginCustomerId?: string` confirmed present in `CreateAudienceInput.settings` (no change needed)

### `userList/index.ts`

- No changes — calls `handleUpdate` and `processBatchPayload` which handle the branching internally
- `settings`, `features`, and `statsContext` are already passed through

### `__tests__/userList.test.ts`

- Added `FLAGON_NAME_DATA_MANAGER` to imports
- Added `beforeEach(() => { nock.cleanAll(); testDestination.responses = [] })` to prevent test state pollution
- Added `describe('Data Manager API (feature flag on)')` block with 7 tests:
  - CONTACT_INFO add (Audience Entered) via `audienceMembers:ingest`
  - CONTACT_INFO remove (Audience Exited) via `audienceMembers:remove`
  - MOBILE_ADVERTISING_ID add
  - CRM_ID add
  - `loginCustomerId` included in `destinations[].loginAccount` when set
  - `PayloadValidationError` when `external_audience_id` is missing
  - Falls back to OfflineUserDataJob when flag is off

</details>

---

<details>
<summary><strong>Rollout Plan</strong></summary>

1. **Add `datamanager` OAuth scope** to the Google Cloud Console OAuth app
2. **Update Segment platform** to request the combined scope on new authorizations
3. **Notify customers** that re-authorization is required before the migration
4. **Deploy code** with flag off — no behavioral change, existing path runs
5. **Customers re-authorize** to obtain tokens with both scopes
6. **Enable flag** for test accounts / small traffic slice
7. **Monitor** Data Manager endpoints for errors
8. **Ramp up** flag to 100% traffic once stable
9. **Cleanup** (after full rollout confirmed):
   - Remove `FLAGON_NAME_DATA_MANAGER` flag check
   - Delete OfflineUserDataJob functions (`createOfflineUserJob`, `addOperations`, `runOfflineUserJob`, `createOfflineUserJobPayload`)
   - Remove `developer-token` header from deleted functions
   - Remove `login-customer-id` from `extendRequest` in `index.ts`
   - Remove `OfflineUserJobPayload` and `AddOperationPayload` from `types.ts`
   - Remove old-path tests from `userList.test.ts`

</details>

---

<details>
<summary><strong>Testing</strong></summary>

### Enable the flag locally

Pass `features: { 'google-customer-match-use-data-manager-api': true }` in any `testAction` call or `./bin/run serve` session.

### Expected ingest request body

```json
{
  "destinations": [
    {
      "reference": "dest1",
      "operatingAccount": { "accountId": "1234567890", "accountType": "GOOGLE_ADS" },
      "productDestinationId": "9876543210"
    }
  ],
  "audienceMembers": [
    {
      "destinationReferences": ["dest1"],
      "consent": { "adUserData": "GRANTED", "adPersonalization": "GRANTED" },
      "userData": {
        "userIdentifiers": [
          { "emailAddress": "87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674" },
          { "phoneNumber": "0506a1f3f4c515fd310fce54d253b731f71e33e7e7d2b10848528ca4411120b0" }
        ]
      }
    }
  ]
}
```

### Run the tests

```bash
# All userList tests (includes old path + new Data Manager tests)
npx jest "google-enhanced-conversions.*userList"

# Data Manager tests only
npx jest "google-enhanced-conversions.*userList" -t "Data Manager"
```

</details>
