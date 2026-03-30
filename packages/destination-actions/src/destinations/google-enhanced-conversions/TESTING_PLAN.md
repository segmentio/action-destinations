# Testing Plan: Google Customer Match — Data Manager API Migration

This document covers the full test plan for the migration from `OfflineUserDataJob` to the Google Data Manager API v1, including all functionality affected: OAuth, `createAudience`, `getAudience`, `perform` (single event), and `performBatch`.

---

## How to Run Tests

```bash
# All userList tests (old path + new Data Manager tests)
npx jest "google-enhanced-conversions.*userList"

# Data Manager tests only
npx jest "google-enhanced-conversions.*userList" -t "Data Manager"

# Full destination test suite
yarn cloud jest --testPathPattern="google-enhanced-conversions"
```

To enable the Data Manager flag locally in any `testAction` or `executeBatch` call:

```typescript
features: { 'google-customer-match-use-data-manager-api': true }
```

---

## 1. OAuth & Authentication

### 1.1 refreshAccessToken (unchanged)

| #   | Test                                                                                    | Expected                                                      |
| --- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | Token refresh via `https://www.googleapis.com/oauth2/v4/token` with valid refresh token | Returns `access_token`                                        |
| 2   | Token refresh with missing `refresh_token`                                              | Throws `PayloadValidationError('Oauth credentials missing.')` |
| 3   | Token refresh with missing `GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID` env var              | Throws `PayloadValidationError('Oauth credentials missing.')` |
| 4   | Token refresh with missing `GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET` env var          | Throws `PayloadValidationError('Oauth credentials missing.')` |

### 1.2 extendRequest — header injection

| #   | Test                                                                       | Expected                                                                      |
| --- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 5   | `loginCustomerId` is set — request to Google Ads API                       | `login-customer-id` header is injected (trimmed, dashes removed)              |
| 6   | `loginCustomerId` is not set — request to Google Ads API                   | `login-customer-id` header is absent                                          |
| 7   | `loginCustomerId` is set — request to Data Manager API                     | `login-customer-id` header is sent but harmlessly ignored (no error expected) |
| 8   | `authorization: Bearer <token>` header is present on all outgoing requests | Header is correctly formatted                                                 |

### 1.3 OAuth Scope

| #   | Test                                                               | Expected                                                                                              |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 9   | Token issued with only `adwords` scope calls Data Manager endpoint | API returns `403 Forbidden`                                                                           |
| 10  | Token issued with both `adwords` and `datamanager` scopes          | Both APIs accept requests                                                                             |
| 11  | New OAuth flow requests combined scope string                      | Scope string is `https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/datamanager` |

> **Note:** Tests 9–11 are integration/manual tests requiring live OAuth credentials. Unit tests mock the HTTP layer. Document the expected 403 behavior as a known migration concern.

---

## 2. createAudience

### 2.1 Happy path

| #   | Test                                                                              | Expected                                                                            |
| --- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 12  | Create audience with `external_id_type: CONTACT_INFO`                             | Calls `userLists:mutate`, returns numeric audience ID extracted from `resourceName` |
| 13  | Create audience with `external_id_type: MOBILE_ADVERTISING_ID` and valid `app_id` | Creates `crmBasedUserList` with `appId`, returns audience ID                        |
| 14  | Create audience with `external_id_type: CRM_ID`                                   | Creates `crmBasedUserList`, returns audience ID                                     |
| 15  | `membershipLifeSpan` is always `540`                                              | Request body contains `membershipLifeSpan: '540'`                                   |
| 16  | Audience name maps from `input.audienceName`                                      | Request body `name` equals provided audience name                                   |

### 2.2 Validation errors

| #   | Test                                                       | Expected                                                                                              |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 17  | `external_id_type: MOBILE_ADVERTISING_ID` with no `app_id` | Throws `PayloadValidationError('App ID is required when external ID type is mobile advertising ID.')` |
| 18  | Missing `auth.refresh_token`                               | Throws `PayloadValidationError('Oauth credentials missing.')`                                         |
| 19  | API returns empty `results` array                          | Throws `IntegrationError('Failed to receive a created customer list id.')`                            |
| 20  | API returns `resourceName` in wrong format                 | Audience ID extraction fails gracefully                                                               |

### 2.3 Request structure

| #   | Test                                          | Expected                                                                             |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------ |
| 21  | `developer-token` header is present           | Header equals `process.env.ADWORDS_DEVELOPER_TOKEN`                                  |
| 22  | URL uses correct API version and `customerId` | `https://googleads.googleapis.com/{version}/customers/{customerId}/userLists:mutate` |

---

## 3. getAudience

### 3.1 Happy path

| #   | Test                                             | Expected                                              |
| --- | ------------------------------------------------ | ----------------------------------------------------- |
| 23  | Fetch existing audience by `externalId`          | Returns `UserListResponse` with correct `userList.id` |
| 24  | Query filters by `user_list.id = '{externalId}'` | Only the targeted list is returned                    |

### 3.2 Validation errors

| #   | Test                                                   | Expected                                                        |
| --- | ------------------------------------------------------ | --------------------------------------------------------------- |
| 25  | Missing `auth.refresh_token`                           | Throws `PayloadValidationError('Oauth credentials missing.')`   |
| 26  | API returns empty `results` array (audience not found) | Throws `IntegrationError('Failed to receive a customer list.')` |

### 3.3 Request structure

| #   | Test                                 | Expected                                            |
| --- | ------------------------------------ | --------------------------------------------------- |
| 27  | `developer-token` header is present  | Header equals `process.env.ADWORDS_DEVELOPER_TOKEN` |
| 28  | URL uses `googleAds:search` endpoint | Correct endpoint is used (not `searchStream`)       |

---

## 4. perform — Single Event (`handleUpdate`)

### 4.1 Feature flag OFF — OfflineUserDataJob path (legacy)

| #   | Test                                                 | Expected                                                              |
| --- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| 29  | `Audience Entered` event, flag off                   | Makes 3 calls: `offlineUserDataJobs:create` → `addOperations` → `run` |
| 30  | `Audience Exited` event, flag off                    | Same 3-step flow, operation is `remove`                               |
| 31  | `syncMode: add`, flag off                            | Operation is `create`                                                 |
| 32  | `syncMode: delete`, flag off                         | Operation is `remove`                                                 |
| 33  | `syncMode: mirror` + `event_name: new`, flag off     | Operation is `create`                                                 |
| 34  | `syncMode: mirror` + `event_name: deleted`, flag off | Operation is `remove`                                                 |
| 35  | Data Manager endpoint is NOT called when flag is off | No requests to `datamanager.googleapis.com`                           |

### 4.2 Feature flag ON — Data Manager path

#### 4.2.1 CONTACT_INFO

| #   | Test                                                                            | Expected                                                                                                                         |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 36  | `Audience Entered`, CONTACT_INFO with email + phone                             | Single POST to `audienceMembers:ingest`; body has `userData.userIdentifiers` with `emailAddress` and `phoneNumber` (SHA-256 hex) |
| 37  | `Audience Exited`, CONTACT_INFO                                                 | Single POST to `audienceMembers:remove`; correct identifiers                                                                     |
| 38  | CONTACT_INFO with address fields (firstName, lastName, countryCode, postalCode) | `address` object present with `givenName`, `familyName` (SHA-256), `regionCode`, `postalCode` (plaintext)                        |
| 39  | CONTACT_INFO with email only                                                    | `userIdentifiers` contains only `emailAddress`                                                                                   |
| 40  | CONTACT_INFO with phone only                                                    | `userIdentifiers` contains only `phoneNumber`                                                                                    |
| 41  | CONTACT_INFO with address only                                                  | `userIdentifiers` contains only `address`                                                                                        |
| 42  | Pre-hashed email/phone not re-hashed                                            | Output values equal the input hashes                                                                                             |

#### 4.2.2 MOBILE_ADVERTISING_ID

| #   | Test                                          | Expected                                                                                          |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 43  | `Audience Entered`, MOBILE_ADVERTISING_ID     | POST to `audienceMembers:ingest`; body has `mobileData.mobileIds: ['<adid>']` (array, not string) |
| 44  | `Audience Exited`, MOBILE_ADVERTISING_ID      | POST to `audienceMembers:remove` with `mobileData.mobileIds`                                      |
| 45  | Empty/whitespace-only `mobile_advertising_id` | Member skipped (returns `null` from builder)                                                      |

#### 4.2.3 CRM_ID

| #   | Test                           | Expected                                                                   |
| --- | ------------------------------ | -------------------------------------------------------------------------- |
| 46  | `Audience Entered`, CRM_ID     | POST to `audienceMembers:ingest`; body has `userIdData.userId: '<crm_id>'` |
| 47  | `Audience Exited`, CRM_ID      | POST to `audienceMembers:remove` with `userIdData.userId`                  |
| 48  | Empty/whitespace-only `crm_id` | Member skipped                                                             |

#### 4.2.4 Request body structure

| #   | Test                                                                                       | Expected                                                            |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 49  | `destinations[0].reference` is always `'dest1'`                                            | Constant value present                                              |
| 50  | `destinations[0].operatingAccount.accountId` equals `customerId`                           | Correct value                                                       |
| 51  | `destinations[0].operatingAccount.accountType` equals `'GOOGLE_ADS'`                       | Constant value present                                              |
| 52  | `destinations[0].productDestinationId` equals `audienceId` (numeric string, no URL prefix) | No `customers/.../userLists/` prefix                                |
| 53  | `loginCustomerId` set → `destinations[0].loginAccount.accountId` present                   | `{ accountId: loginCustomerId, accountType: 'GOOGLE_ADS_MANAGER' }` |
| 54  | `loginCustomerId` not set → `loginAccount` absent                                          | Property not present in request body                                |
| 55  | `developer-token` header is NOT sent                                                       | Header absent on Data Manager requests                              |
| 56  | Consent is per-member in `audienceMembers[].consent`                                       | `adUserData` and `adPersonalization` values match payload fields    |
| 57  | `audienceMembers[].destinationReferences` equals `['dest1']`                               | Constant value                                                      |

#### 4.2.5 syncMode and operation routing

| #   | Test                                                       | Expected                                        |
| --- | ---------------------------------------------------------- | ----------------------------------------------- |
| 58  | `Audience Entered`                                         | Routes to `audienceMembers:ingest`              |
| 59  | `Audience Exited`                                          | Routes to `audienceMembers:remove`              |
| 60  | `syncMode: add`                                            | Routes to `audienceMembers:ingest`              |
| 61  | `syncMode: delete`                                         | Routes to `audienceMembers:remove`              |
| 62  | `syncMode: mirror` + `event_name: new`                     | Routes to `audienceMembers:ingest`              |
| 63  | `syncMode: mirror` + `event_name: deleted`                 | Routes to `audienceMembers:remove`              |
| 64  | Mixed payloads with both adds and removes (single perform) | Both `ingest` and `remove` endpoints are called |
| 65  | Payload where operation type cannot be determined          | Member skipped silently                         |

#### 4.2.6 Error handling

| #   | Test                                                                     | Expected                                                                 |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 66  | `ingestAudienceMembers` returns HTTP 4xx                                 | `result.success` is `false`; error is thrown so Centrifuge handles retry |
| 67  | `removeAudienceMembers` returns HTTP 4xx                                 | Same throw behavior                                                      |
| 68  | Missing `external_audience_id` (flag on)                                 | Throws `PayloadValidationError('External Audience ID is required.')`     |
| 69  | Stats counter `success.dataManagerUpdateAudience` incremented on success | Stats client called with correct metric                                  |
| 70  | Stats counter `error.dataManager.ingest` incremented on ingest failure   | Correct metric name                                                      |
| 71  | Stats counter `error.dataManager.remove` incremented on remove failure   | Correct metric name                                                      |

---

## 5. performBatch — Batch Events (`processBatchPayload`)

### 5.1 Feature flag OFF — OfflineUserDataJob path (legacy)

| #   | Test                                                           | Expected                                                                                                                |
| --- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 72  | Batch of `Audience Entered` events, flag off                   | 3-step flow: create job → addOperations → run                                                                           |
| 73  | Batch with `CONCURRENT_MODIFICATION` on `createOfflineUserJob` | All payloads in batch get status `429` with `RETRYABLE_BATCH_FAILURE`                                                   |
| 74  | Batch with `CONCURRENT_MODIFICATION` on `addOperations`        | All affected payloads get status `429` with `RETRYABLE_BATCH_FAILURE`                                                   |
| 75  | Batch with partial failure from `addOperations`                | Failed indices mapped back to original payload positions via `validPayloadIndicesBitmap`; successful payloads get `200` |
| 76  | Batch with non-retryable error on `createOfflineUserJob`       | All payloads get `400` with `BAD_REQUEST`                                                                               |
| 77  | Batch with error on `run`                                      | All non-previously-failed payloads get the run error status                                                             |
| 78  | Batch with invalid email                                       | That payload gets `PAYLOAD_VALIDATION_FAILED` before API call; others proceed                                           |
| 79  | Batch with missing CONTACT_INFO identifiers                    | That payload gets `PAYLOAD_VALIDATION_FAILED`                                                                           |
| 80  | Batch with undeterminable operation type                       | That payload gets `PAYLOAD_VALIDATION_FAILED: Could not determine Operation Type.`                                      |
| 81  | All payloads fail validation before API calls                  | `createOfflineUserJob` is never called                                                                                  |

### 5.2 Feature flag ON — Data Manager path

#### 5.2.1 Happy path

| #   | Test                                                         | Expected                                                                                |
| --- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| 82  | Batch of `Audience Entered` (CONTACT_INFO), flag on          | Single POST to `audienceMembers:ingest`; all indices get `200` in `MultiStatusResponse` |
| 83  | Batch of `Audience Exited` (CONTACT_INFO), flag on           | Single POST to `audienceMembers:remove`; all indices get `200`                          |
| 84  | Mixed batch: some `Audience Entered`, some `Audience Exited` | Both `ingest` and `remove` called; each index gets correct success status               |
| 85  | Batch with MOBILE_ADVERTISING_ID members                     | `mobileData.mobileIds` array in request body                                            |
| 86  | Batch with CRM_ID members                                    | `userIdData.userId` in request body                                                     |
| 87  | Batch where `loginCustomerId` is set                         | `loginAccount` in `destinations[]` for all calls                                        |

#### 5.2.2 Per-payload validation errors (tracked before API call)

| #   | Test                                                                    | Expected                                                                                            |
| --- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 88  | Invalid email in one payload                                            | That index gets `400 PAYLOAD_VALIDATION_FAILED`; valid payloads still sent                          |
| 89  | Missing CONTACT_INFO identifiers (no email/phone/address)               | That index gets `400 PAYLOAD_VALIDATION_FAILED: Missing or Invalid data for CONTACT_INFO.`          |
| 90  | Missing MOBILE_ADVERTISING_ID value                                     | That index gets `400 PAYLOAD_VALIDATION_FAILED: Missing or Invalid data for MOBILE_ADVERTISING_ID.` |
| 91  | Missing CRM_ID value                                                    | That index gets `400 PAYLOAD_VALIDATION_FAILED: Missing or Invalid data for CRM_ID.`                |
| 92  | Undeterminable operation type (invalid event + no syncMode)             | That index gets `400 PAYLOAD_VALIDATION_FAILED: Could not determine Operation Type.`                |
| 93  | `PayloadValidationError` thrown inside `buildDataManagerAudienceMember` | Caught; index gets `400 PAYLOAD_VALIDATION_FAILED` with the error message                           |
| 94  | All payloads fail validation                                            | Neither `ingest` nor `remove` is called; all indices have errors                                    |

#### 5.2.3 API failure error handling

| #   | Test                                                                | Expected                                                                         |
| --- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 95  | `ingestAudienceMembers` call fails (HTTP 5xx), flag on              | All `addMemberIndices` get `500` error in `MultiStatusResponse`                  |
| 96  | `removeAudienceMembers` call fails (HTTP 5xx), flag on              | All `removeMemberIndices` get `500` error                                        |
| 97  | `ingest` succeeds but `remove` fails in same batch                  | Ingest indices get `200`; remove indices get `500`                               |
| 98  | Partial batch: some valid, some validation failures, API call fails | Validation failures have `400`; API-failed have `500`; none are `200`            |
| 99  | No partial failure per-record from Data Manager API                 | Entire `ingest` call either succeeds or fails at once (no per-item error detail) |

#### 5.2.4 Missing external audience ID

| #   | Test                                                                      | Expected                                                             |
| --- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 100 | `hookListId` and `payloads[0].external_audience_id` both missing, flag on | Throws `PayloadValidationError('External Audience ID is required.')` |

---

## 6. Field Name Mapping Verification

These tests validate that the old field names are no longer sent and new field names are correctly structured.

| #   | Old Field                                                      | New Field                                        | Test                                                                  |
| --- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| 101 | `hashedEmail`                                                  | `userData.userIdentifiers[].emailAddress`        | Output body contains `emailAddress`, not `hashedEmail`                |
| 102 | `hashedPhoneNumber`                                            | `userData.userIdentifiers[].phoneNumber`         | Output body contains `phoneNumber`, not `hashedPhoneNumber`           |
| 103 | `addressInfo.hashedFirstName`                                  | `address.givenName`                              | `givenName` present (SHA-256); `hashedFirstName` absent               |
| 104 | `addressInfo.hashedLastName`                                   | `address.familyName`                             | `familyName` present (SHA-256); `hashedLastName` absent               |
| 105 | `addressInfo.countryCode`                                      | `address.regionCode`                             | `regionCode` present (plaintext); `countryCode` absent inside address |
| 106 | `addressInfo.postalCode`                                       | `address.postalCode`                             | Unchanged key, plaintext value                                        |
| 107 | `mobileId` (string)                                            | `mobileData.mobileIds` (array)                   | Value wrapped in array                                                |
| 108 | `thirdPartyUserId`                                             | `userIdData.userId`                              | Correct nesting                                                       |
| 109 | Consent at job level (`customerMatchUserListMetadata.consent`) | Consent per member (`audienceMembers[].consent`) | Each member has its own `consent` object                              |
| 110 | Customer ID in URL path                                        | `destinations[].operatingAccount.accountId`      | Not in URL; present in body                                           |
| 111 | `login-customer-id` HTTP header                                | `destinations[].loginAccount.accountId` in body  | MCC account in body when set                                          |

---

## 7. Phone Number Formatting

| #   | Test                                                                | Expected                                                                 |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 112 | Phone already in E.164 format (starts with `+`)                     | Not reformatted; value passed through as-is                              |
| 113 | Phone without country code, `phone_country_code` absent             | Default `+1` prepended                                                   |
| 114 | Phone with `phone_country_code: '+91'`                              | Formatted with India country code                                        |
| 115 | Phone with invalid `phone_country_code: '+999'`, validation flag on | Throws `PayloadValidationError('Invalid phone number or country code.')` |
| 116 | Pre-hashed phone value                                              | `isHashedInformation` check passes; no formatting applied                |
| 117 | `FLAGON_NAME_PHONE_VALIDATION_CHECK` flag off                       | Uses `formatToE164` (no libphonenumber validation)                       |
| 118 | `FLAGON_NAME_PHONE_VALIDATION_CHECK` flag on                        | Uses `validateAndFormatToE164` (libphonenumber validation)               |

---

## 8. Feature Flag Behavior & Coexistence

| #   | Test                                                                                 | Expected                                                            |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 119 | Flag `google-customer-match-use-data-manager-api` is `false` (default)               | OfflineUserDataJob path executes; Data Manager endpoints not called |
| 120 | Flag is `true`                                                                       | Data Manager path executes; OfflineUserDataJob endpoints not called |
| 121 | Flag is `true`, perform (single event)                                               | Only `ingest` or `remove` called (1 response); never 3 responses    |
| 122 | Flag is `false`, perform (single event)                                              | Exactly 3 responses: create → addOperations → run                   |
| 123 | Flag is `true`, `processBatchPayload`                                                | Returns `MultiStatusResponse` with Data Manager results             |
| 124 | Flag is `false`, `processBatchPayload`                                               | Returns `MultiStatusResponse` with OfflineUserDataJob results       |
| 125 | Both `FLAGON_NAME_DATA_MANAGER` and `FLAGON_NAME_JOURNEY_V2` flags on simultaneously | Each flag applies its own branching independently; no interference  |

---

## 9. Engage Fields / JourneysV2 Flag Integration

| #   | Test                                                                                                   | Expected                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 126 | `FLAGON_NAME_JOURNEY_V2` on, `computation_class: audience`, `audience_key` trait is `true`             | Operation is `add` regardless of event name                                                                |
| 127 | `FLAGON_NAME_JOURNEY_V2` on, `audience_key` trait is `false`                                           | Operation is `remove` regardless of event name                                                             |
| 128 | `FLAGON_NAME_JOURNEY_V2` off, engage fields present                                                    | `getEngageAudienceMembership` returns `undefined`; event name / syncMode used instead                      |
| 129 | `FLAGON_NAME_JOURNEY_V2` on, `engage_fields` empty object, `syncMode: mirror`, non-standard event name | `determineOperationType` returns `null` → `PAYLOAD_VALIDATION_FAILED: Could not determine Operation Type.` |
| 130 | `FLAGON_NAME_JOURNEY_V2` on + `FLAGON_NAME_DATA_MANAGER` on, trait is `true`                           | Routes to `audienceMembers:ingest`                                                                         |
| 131 | `FLAGON_NAME_JOURNEY_V2` on + `FLAGON_NAME_DATA_MANAGER` on, trait is `false`                          | Routes to `audienceMembers:remove`                                                                         |

---

## 10. Stats Context

| #   | Test                                    | Expected                                             |
| --- | --------------------------------------- | ---------------------------------------------------- |
| 132 | Successful Data Manager `perform`       | `success.dataManagerUpdateAudience` incremented once |
| 133 | Failed `ingestAudienceMembers` call     | `error.dataManager.ingest` incremented               |
| 134 | Failed `removeAudienceMembers` call     | `error.dataManager.remove` incremented               |
| 135 | Successful OfflineUserDataJob `perform` | `success.offlineUpdateAudience` incremented          |
| 136 | Failed `createOfflineUserJob`           | `error.createJob` incremented                        |
| 137 | Failed `addOperations`                  | `error.addOperations` incremented                    |
| 138 | Failed `runOfflineUserJob`              | `error.runJob` incremented                           |

---

## 11. Rollout Validation Checklist

Before enabling the feature flag at any traffic percentage:

| Step              | Validation                                                  | Pass Criteria                                                       |
| ----------------- | ----------------------------------------------------------- | ------------------------------------------------------------------- |
| Pre-flag          | Deploy with flag off                                        | Zero Data Manager API calls in production logs                      |
| OAuth scope       | `datamanager` scope added to Google Cloud Console OAuth app | Confirmed by OAuth app config review                                |
| OAuth scope       | Segment platform scope string updated                       | `adwords datamanager` both present in config                        |
| Customer re-auth  | Existing connections re-authorize                           | New tokens include both scopes; no 403 on test call                 |
| Flag on (1%)      | Enable flag for small traffic slice                         | Data Manager endpoints return 200; no spike in error rate           |
| Flag on (1%)      | Verify `login-customer-id` header is sent but ignored       | No 400/422 errors from Data Manager due to unknown header           |
| Flag on (100%)    | All traffic through Data Manager                            | `success.dataManagerUpdateAudience` counter matches expected volume |
| Post-full-rollout | Remove `FLAGON_NAME_DATA_MANAGER` check                     | OfflineUserDataJob code path deleted; old tests removed             |

---

## 12. Negative / Edge Cases

| #   | Test                                                                            | Expected                                                                                                                         |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 139 | `customerId` is `undefined` in settings for Data Manager path                   | `buildDataManagerDestination` receives `undefined`; propagates as-is (caller must validate with `verifyCustomerId` where needed) |
| 140 | `audienceId` is empty string                                                    | `productDestinationId` is empty string in request body                                                                           |
| 141 | Batch of 1 event (minimum batch)                                                | Works correctly; single member in `audienceMembers` array                                                                        |
| 142 | Large batch (e.g., 1000 events) of mixed add/remove                             | Both `ingest` and `remove` endpoints called once each with respective members                                                    |
| 143 | All events in batch are removes (no adds)                                       | Only `audienceMembers:remove` called; `audienceMembers:ingest` not called                                                        |
| 144 | All events in batch are adds (no removes)                                       | Only `audienceMembers:ingest` called; `audienceMembers:remove` not called                                                        |
| 145 | CONTACT_INFO payload with `givenName` only (no `familyName`, no country/postal) | `address.givenName` present; other fields absent                                                                                 |
| 146 | `ad_user_data_consent_state` is `DENIED`                                        | Consent in request body is `DENIED`                                                                                              |
| 147 | `ad_personalization_consent_state` is `UNSPECIFIED`                             | Consent in request body is `UNSPECIFIED`                                                                                         |
| 148 | Both add and remove produce empty member arrays (all payloads invalid)          | Neither `ingest` nor `remove` called; all indices have errors in `MultiStatusResponse`                                           |
