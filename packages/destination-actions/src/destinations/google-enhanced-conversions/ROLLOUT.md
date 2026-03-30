# Rollout Plan: Google Customer Match — Data Manager API Migration

This document covers the end-to-end rollout plan for migrating the Google Enhanced Conversions destination from the `OfflineUserDataJob` API to the Google Data Manager API v1 for Customer Match uploads.

Feature flag: `google-customer-match-use-data-manager-api` (`FLAGON_NAME_DATA_MANAGER`)

---

## Overview

| Phase | Description                                     | Flag State   |
| ----- | ----------------------------------------------- | ------------ |
| 0     | Pre-deployment: OAuth scope and platform config | Off          |
| 1     | Code deployment                                 | Off          |
| 2     | Customer re-authorization                       | Off          |
| 3     | 1% traffic validation                           | On (1%)      |
| 4     | Full ramp                                       | On (100%)    |
| 5     | Cleanup                                         | Flag removed |

---

## Phase 0 — Pre-Deployment: OAuth & Platform Config

These steps must be completed **before** any code is deployed or the flag is turned on.

### 0.1 OAuth Scope Update

The Data Manager API requires an additional OAuth scope. Both scopes must be active simultaneously during the rollout window because both APIs are live at the same time.

| Current scope                             | Required scope (during rollout)                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| `https://www.googleapis.com/auth/adwords` | `https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/datamanager` |

**Actions:**

1. **Google Cloud Console** — Add `https://www.googleapis.com/auth/datamanager` to the allowed scopes on the OAuth 2.0 app used by the destination.
2. **Segment platform OAuth configuration** — Update the requested scope string to include both scopes:
   ```
   https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/datamanager
   ```
3. Verify the updated scope string is saved and will be sent on all new OAuth authorization requests.

> **Why this matters:** Existing tokens were issued with only the `adwords` scope. Calling any Data Manager endpoint with such a token returns `403 Forbidden`. The scope must be updated before customers re-authorize.

### 0.2 Verify `extendRequest` Header Behavior

`extendRequest` in `index.ts` injects `authorization` and (when set) `login-customer-id` headers on every outgoing request. The `login-customer-id` header is not used by the Data Manager API but is harmlessly ignored. **No code change is required here before rollout.** Removal is deferred to the Phase 5 cleanup.

### 0.3 Developer Token

The `developer-token` header is added per-request inside `createOfflineUserJob`, `addOperations`, and `runOfflineUserJob`. The new Data Manager functions (`ingestAudienceMembers`, `removeAudienceMembers`) do not add this header. **No change required.**

### Phase 0 Exit Criteria

- [ ] `datamanager` scope added to Google Cloud Console OAuth app
- [ ] Segment platform scope string updated to request both scopes
- [ ] Confirm new OAuth authorizations include both scopes (manual verification)

---

## Phase 1 — Code Deployment (Flag Off)

Deploy the updated destination code with the `FLAGON_NAME_DATA_MANAGER` flag **off** (default). This is a zero-risk deploy — all traffic continues on the existing `OfflineUserDataJob` path unchanged.

### 1.1 Impacted Functionality

The following functions have branching logic added for the feature flag:

| Function                          | File                | Change                                                                                |
| --------------------------------- | ------------------- | ------------------------------------------------------------------------------------- |
| `handleUpdate`                    | `functions.ts`      | Data Manager path executes when flag is on; falls through to existing logic when off  |
| `processBatchPayload`             | `functions.ts`      | Same flag branching; `MultiStatusResponse` per-index tracking for Data Manager errors |
| `createAudience`                  | `index.ts`          | No change — still calls `userLists:mutate` via Google Ads API regardless of flag      |
| `getAudience`                     | `index.ts`          | No change — still calls `googleAds:search` regardless of flag                         |
| `userList` perform / performBatch | `userList/index.ts` | No change — calls `handleUpdate` / `processBatchPayload` which handle the branching   |

### 1.2 New Code Added

| Item                                | Location       | Purpose                                                    |
| ----------------------------------- | -------------- | ---------------------------------------------------------- |
| `FLAGON_NAME_DATA_MANAGER` constant | `functions.ts` | Feature flag name                                          |
| `DATA_MANAGER_API_BASE` constant    | `functions.ts` | `https://datamanager.googleapis.com/v1`                    |
| `buildDataManagerDestination()`     | `functions.ts` | Builds `destinations[]` body entry                         |
| `buildDataManagerMemberData()`      | `functions.ts` | Builds per-ID-type member data                             |
| `buildDataManagerAudienceMember()`  | `functions.ts` | Wraps member data with `destinationReferences` and consent |
| `ingestAudienceMembers()`           | `functions.ts` | POSTs to `audienceMembers:ingest`                          |
| `removeAudienceMembers()`           | `functions.ts` | POSTs to `audienceMembers:remove`                          |

### 1.3 No-Op Verification

After deploying with flag off:

- Confirm zero requests to `datamanager.googleapis.com` in production logs.
- Confirm existing `OfflineUserDataJob` metrics (`success.offlineUpdateAudience`, `error.createJob`, `error.addOperations`, `error.runJob`) are unchanged.

### Phase 1 Exit Criteria

- [ ] Deployment successful with flag off
- [ ] No Data Manager API calls observed in logs
- [ ] Existing OfflineUserDataJob metrics unchanged
- [ ] All unit tests passing (`yarn cloud jest --testPathPattern="google-enhanced-conversions"`)

---

## Phase 2 — Customer Re-Authorization

> This is the most operationally significant step. Existing connections cannot use the Data Manager API until they re-authorize.

### 2.1 Who Is Affected

All customers who:

- Have an active Google Enhanced Conversions (`actions-google-enhanced-conversions`) connection
- Use the `userList` action (Customer Match uploads)

Customers using only `uploadClickConversion`, `uploadCallConversion`, `uploadConversionAdjustment`, or `postConversion` are **not affected** — those actions use the Google Ads API, not the Data Manager API.

### 2.2 Re-Authorization Flow

1. Customer visits the destination connection settings in the Segment UI.
2. Customer clicks "Re-connect" / "Re-authorize" to trigger a new OAuth consent screen.
3. The consent screen now requests both `adwords` and `datamanager` scopes.
4. Customer approves. A new refresh token scoped to both APIs is issued and stored.

### 2.3 Identifying Connections That Have Not Re-Authorized

After the flag is enabled (Phase 3), connections with old tokens will return `403 Forbidden` from the Data Manager API. Monitor for `403` errors on `datamanager.googleapis.com` — each one represents a connection that has not re-authorized.

### 2.4 Connections with `supports_conversions: true`

These connections return `externalId: 'segment'` from `createAudience` and skip `userList` audience management entirely. They are **not affected** by this migration.

### 2.5 Connections with `externalId: 'segment'` (Legacy)

Connections created before audience methods were added have `externalId === 'segment'` and short-circuit in `getAudience`. These connections also bypass `userList` operations and are **not affected**.

### Phase 2 Exit Criteria

- [ ] Customer communication sent (re-authorization required before flag enablement)
- [ ] Target accounts have re-authorized (confirmed via token scope inspection or test call)
- [ ] 403 error rate on test accounts is zero after re-authorization

---

## Phase 3 — 1% Traffic Validation (Flag On)

Enable the feature flag for a small traffic slice (1% or a set of test accounts).

### 3.1 createAudience — No Change

`createAudience` continues to call `userLists:mutate` via the Google Ads API. It is **not gated by `FLAGON_NAME_DATA_MANAGER`**. Verify no regressions:

- Audience creation with `external_id_type: CONTACT_INFO` returns a numeric audience ID.
- Audience creation with `external_id_type: MOBILE_ADVERTISING_ID` (with `app_id`) returns a numeric audience ID.
- Audience creation with `external_id_type: CRM_ID` returns a numeric audience ID.
- Missing `app_id` when `external_id_type: MOBILE_ADVERTISING_ID` throws `PayloadValidationError`.
- Missing OAuth credentials throws `PayloadValidationError('Oauth credentials missing.')`.

### 3.2 getAudience — No Change

`getAudience` continues to call `googleAds:search`. Verify no regressions:

- Returns `UserListResponse` with correct `userList.id` for a known audience.
- Returns early with `externalId: 'segment'` for legacy connections.

### 3.3 userList — perform (Single Event via `handleUpdate`)

With the flag on, `handleUpdate` routes through the Data Manager path. Verify:

**Add operations (`Audience Entered`, `syncMode: add`, `syncMode: mirror` + `event_name: new`):**

- Single POST to `https://datamanager.googleapis.com/v1/audienceMembers:ingest`
- `OfflineUserDataJob` endpoints (`offlineUserDataJobs:create`, `addOperations`, `run`) are NOT called
- `destinations[0].operatingAccount.accountId` equals `customerId` (no dashes)
- `destinations[0].productDestinationId` equals numeric audience ID (no `customers/.../userLists/` prefix)
- `developer-token` header is absent on Data Manager requests

**Remove operations (`Audience Exited`, `syncMode: delete`, `syncMode: mirror` + `event_name: deleted`):**

- Single POST to `https://datamanager.googleapis.com/v1/audienceMembers:remove`

**Per-ID-type field mapping:**

| ID Type                | Verify in request body                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| CONTACT_INFO (email)   | `userData.userIdentifiers[].emailAddress` is SHA-256 hex                                                            |
| CONTACT_INFO (phone)   | `userData.userIdentifiers[].phoneNumber` is SHA-256 hex                                                             |
| CONTACT_INFO (address) | `address.givenName`, `address.familyName` are SHA-256 hex; `address.regionCode`, `address.postalCode` are plaintext |
| MOBILE_ADVERTISING_ID  | `mobileData.mobileIds: ['<adid>']` — array, not string                                                              |
| CRM_ID                 | `userIdData.userId: '<crm_id>'`                                                                                     |

**MCC accounts (`loginCustomerId` set):**

- `destinations[0].loginAccount.accountId` equals `loginCustomerId` (no dashes)
- `destinations[0].loginAccount.accountType` equals `'GOOGLE_ADS_MANAGER'`
- `login-customer-id` HTTP header is still sent (harmless, ignored by Data Manager)

**Consent:**

- `audienceMembers[].consent.adUserData` and `audienceMembers[].consent.adPersonalization` match payload fields (per-member, not job-level)

### 3.4 userList — performBatch (Batch Events via `processBatchPayload`)

With the flag on, `processBatchPayload` routes through the Data Manager path. Verify:

**Happy path:**

- Batch of adds → single `audienceMembers:ingest` call; all indices get `200` in `MultiStatusResponse`
- Batch of removes → single `audienceMembers:remove` call; all indices get `200`
- Mixed batch (adds + removes) → both `ingest` and `remove` endpoints called; each index gets correct status

**Per-payload validation errors (tracked before API call):**

- Invalid email → that index gets `400 PAYLOAD_VALIDATION_FAILED`; valid payloads still sent
- Missing identifier for ID type → that index gets `400 PAYLOAD_VALIDATION_FAILED: Missing or Invalid data for <type>.`
- Undeterminable operation type → that index gets `400 PAYLOAD_VALIDATION_FAILED: Could not determine Operation Type.`
- All payloads fail validation → neither `ingest` nor `remove` is called

**API failure:**

- `ingestAudienceMembers` HTTP 5xx → all `addMemberIndices` get `500` in `MultiStatusResponse`
- `removeAudienceMembers` HTTP 5xx → all `removeMemberIndices` get `500`
- Mixed result (ingest succeeds, remove fails) → ingest indices `200`, remove indices `500`

**No partial failure per-record:** The Data Manager API does not support partial failure. An entire `ingest` or `remove` call either succeeds or fails as a unit.

### 3.5 JourneysV2 Flag Interaction (`FLAGON_NAME_JOURNEY_V2`)

When both `FLAGON_NAME_DATA_MANAGER` and `FLAGON_NAME_JOURNEY_V2` are on:

- `engage_fields.traits_or_properties[audience_key] === true` → routes to `audienceMembers:ingest`
- `engage_fields.traits_or_properties[audience_key] === false` → routes to `audienceMembers:remove`
- Both flags operate independently with no interference

### 3.6 Monitoring

| Metric                                                     | Expected behavior when flag on                                                         |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `success.dataManagerUpdateAudience`                        | Increments on every successful `handleUpdate` / `processBatchPayload` via Data Manager |
| `error.dataManager.ingest`                                 | Increments on every failed `ingestAudienceMembers` call                                |
| `error.dataManager.remove`                                 | Increments on every failed `removeAudienceMembers` call                                |
| `success.offlineUpdateAudience`                            | Should drop toward zero as flag ramps up                                               |
| `error.createJob` / `error.addOperations` / `error.runJob` | Should drop toward zero                                                                |

### 3.7 403 Errors (Scope Issues)

If `error.dataManager.ingest` or `error.dataManager.remove` show `403` responses:

- The connection has not re-authorized with the new combined scope.
- Do not ramp the flag further until affected connections re-authorize.

### Phase 3 Exit Criteria

- [ ] `success.dataManagerUpdateAudience` incrementing as expected
- [ ] No `403` errors from Data Manager endpoints
- [ ] `error.dataManager.ingest` and `error.dataManager.remove` at or near zero
- [ ] `createAudience` and `getAudience` metrics unchanged
- [ ] No spike in overall error rate for the destination

---

## Phase 4 — Full Ramp (Flag On 100%)

Gradually ramp the flag from 1% → 10% → 50% → 100%, pausing at each step to verify metrics.

### Ramp Checkpoints

| Traffic % | Wait period | Pass criteria                                                        |
| --------- | ----------- | -------------------------------------------------------------------- |
| 1%        | 24 hours    | `error.dataManager.*` near zero; no 403s                             |
| 10%       | 24 hours    | `success.dataManagerUpdateAudience` scales linearly with traffic     |
| 50%       | 24 hours    | `success.offlineUpdateAudience` drops ~50%; no anomalies             |
| 100%      | 48 hours    | All Customer Match traffic through Data Manager; old metrics at zero |

### Phase 4 Exit Criteria

- [ ] 100% traffic through Data Manager for 48 hours with stable error rates
- [ ] `success.offlineUpdateAudience` at zero
- [ ] `error.createJob`, `error.addOperations`, `error.runJob` at zero
- [ ] `createAudience` and `getAudience` unaffected (still use Google Ads API)

---

## Phase 5 — Cleanup (Post Full Rollout)

After 100% rollout is confirmed stable, remove the legacy code path.

### 5.1 Code to Delete

**`functions.ts`:**

- Remove `FLAGON_NAME_DATA_MANAGER` flag check and associated imports
- Delete `createOfflineUserJob()`
- Delete `addOperations()`
- Delete `runOfflineUserJob()`
- Delete `createOfflineUserJobPayload()`
- Delete `handleGoogleAdsError()` (used only by old path)
- Delete `extractBatchUserIdentifiers()` old-path logic (or full function if Data Manager handles all cases)
- Remove `OfflineUserJobPayload` and `AddOperationPayload` from imports

**`index.ts`:**

- Remove `login-customer-id` header from `extendRequest` (no longer needed by Data Manager; was only for Google Ads API Customer Match)

**`types.ts`:**

- Remove `OfflineUserJobPayload` type
- Remove `AddOperationPayload` type

**`__tests__/userList.test.ts`:**

- Remove tests for the `OfflineUserDataJob` path (flag off tests)
- Keep Data Manager tests

### 5.2 OAuth Scope Cleanup

After full rollout, the `adwords` scope is still required for:

- `createAudience` / `getAudience` (still use Google Ads API)
- `uploadClickConversion`, `uploadCallConversion`, `uploadConversionAdjustment` actions

The combined scope string (`adwords datamanager`) should be kept unless all Google Ads API usage is also removed.

### Phase 5 Exit Criteria

- [ ] `FLAGON_NAME_DATA_MANAGER` flag check removed from codebase
- [ ] `OfflineUserDataJob` functions deleted
- [ ] `login-customer-id` removed from `extendRequest`
- [ ] Dead types removed from `types.ts`
- [ ] All tests passing with cleaned-up code
- [ ] PR reviewed and merged

---

## Rollback Plan

| Scenario                                          | Action                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| `403 Forbidden` spike after flag on               | Turn flag off immediately; identify un-reauthorized connections           |
| `5xx` errors from Data Manager API                | Turn flag off; investigate API availability                               |
| Data integrity issues (wrong users added/removed) | Turn flag off; audit `buildDataManagerAudienceMember` output vs. expected |
| `createAudience` or `getAudience` failures        | These are not gated by the flag; investigate Google Ads API independently |

Turning the flag off restores the `OfflineUserDataJob` code path with no code deployment required.

---

## Quick Reference: What Changed vs. What Did Not

| Functionality                                   | Changed by this migration?  | Notes                                                                                    |
| ----------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| OAuth `refreshAccessToken`                      | No                          | Same token endpoint; unchanged                                                           |
| OAuth scope requested                           | Yes                         | `datamanager` scope added                                                                |
| `extendRequest` headers                         | No (deferred)               | `login-customer-id` still sent; harmless                                                 |
| `createAudience`                                | No                          | Still calls Google Ads `userLists:mutate`                                                |
| `getAudience`                                   | No                          | Still calls Google Ads `googleAds:search`                                                |
| `userList` perform (`handleUpdate`)             | Yes (flag gated)            | Routes to Data Manager when flag on                                                      |
| `userList` performBatch (`processBatchPayload`) | Yes (flag gated)            | Routes to Data Manager when flag on                                                      |
| `uploadClickConversion` actions                 | No                          | Not Customer Match; unaffected                                                           |
| `uploadCallConversion` actions                  | No                          | Not Customer Match; unaffected                                                           |
| `uploadConversionAdjustment` actions            | No                          | Not Customer Match; unaffected                                                           |
| `postConversion` action                         | No                          | Not Customer Match; unaffected                                                           |
| Field names sent to API                         | Yes                         | Old: `hashedEmail`, `mobileId`, etc. → New: `emailAddress`, `mobileData.mobileIds`, etc. |
| Consent level                                   | Yes                         | Old: job-level → New: per-member                                                         |
| MCC account passing                             | Yes                         | Old: `login-customer-id` header → New: `destinations[].loginAccount` in body             |
| `developer-token` header                        | Removed (Data Manager path) | Not sent to Data Manager endpoints                                                       |
| Partial failure support                         | No (Data Manager has none)  | Entire batch succeeds or fails as a unit                                                 |
