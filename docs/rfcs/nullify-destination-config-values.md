# RFC: Nullify Legacy `value` Columns for Destination Config Settings

## 1. Status

Draft

## 2. Audience

ARB and leadership

## 3. Overview

### 3.1 Summary

This RFC proposes permanently nullifying the legacy `value` column in destination configuration storage after `value_v2` has become the canonical source of setting data.

The cleanup applies to:

- `destination_config_options_2`
- `destination_config_revisions`

We will not drop the `value` column as part of this RFC. The column will remain present for schema compatibility, but its contents will be set to `NULL`.

The rollout will be performed by customer tier, starting with lower tiers. We will create two temporary internal APIs:

- one API to nullify `value`
- one API to revert `value` from `value_v2`

A temporary Kubernetes script/job will call these APIs when required.

### 3.2 Background

Destination settings and credentials were historically stored in plaintext in the `value` column. This created a security risk because sensitive credentials could be exposed through direct database access, database replicas, backups, downstream stores, or accidental logging.

The integration settings encryption project introduced `value_v2` as the new canonical storage column. For sensitive settings, `value_v2` stores encrypted data and associated encryption metadata. For non-sensitive settings, `value_v2` stores the plain setting value.

At this stage:

- ControlPlane writes populate `value_v2`.
- Readers are assumed to have migrated from `value` to `value_v2`.
- There is no plan to move data back into `value`.
- The remaining security cleanup is to remove plaintext data from the legacy column.

### 3.3 Scope

#### 3.3.1 In Scope

This RFC covers the final cleanup required to remove data from the legacy `value` columns after migration to `value_v2`.

The work includes:

- Permanently nullifying `destination_config_options_2.value`.
- Permanently nullifying `destination_config_revisions.value`.
- Applying nullification to all rows, not only sensitive or encrypted options.
- Rolling out nullification by customer tier, starting with lower tiers.
- Creating temporary internal APIs to nullify and revert `value`.
- Creating a temporary Kubernetes script/job to call the APIs during rollout.
- Validating that `value_v2` can be used to reconstruct `value` before nullification.
- Providing a revert path that reconstructs `value` from `value_v2`.

#### 3.3.2 Table Scope

| Table                          | Scope    | Notes                                                                                                          |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------- |
| `destination_config_options_2` | In scope | Live destination settings table. Updates flow to downstream CtlStore/change listeners and must be throttled.   |
| `destination_config_revisions` | In scope | Historical revision/audit table. Not part of downstream CtlStore, so it does not need the same TPS constraint. |

#### 3.3.3 Rollout Scope

Nullification for `destination_config_options_2` will be performed by customer tier:

1. Stage
2. Free
3. Self-Service
4. Startup Program
5. Business
6. Key Accounts
7. Strategic Accounts
8. Remaining internal/unknown tiers

`destination_config_revisions` will be processed separately after, or independently from, the live table rollout because it is not part of downstream CtlStore.

#### 3.3.4 Operational Scope

The temporary migration tooling includes:

- a nullify API
- a revert API
- a Kubernetes script/job that invokes the APIs in batches

For `destination_config_options_2`, the script must respect downstream CtlStore/change listener throughput limits. The current assumption is approximately 1 RPS for this migration path.

For `destination_config_revisions`, the script may use a higher throughput because the table is not part of downstream CtlStore.

#### 3.3.5 Out of Scope

This RFC does not include:

- Dropping the `value` column.
- Reusing `value` as a canonical storage column.
- Moving encrypted data back from `value_v2` to `value`.
- Redesigning the encryption, decryption, DEK, or KMS model.
- Building a durable migration framework.
- Changing customer-facing API contracts.
- Changing external client behavior.
- Retaining a plaintext backup.
- Cleaning up unrelated plaintext stores outside the two tables listed above.

#### 3.3.6 Assumptions

This RFC assumes:

- Readers have migrated from `value` to `value_v2`.
- `value_v2` is the canonical source of setting data.
- ControlPlane write paths already populate `value_v2`.
- No future product or platform workflow requires `value` to contain data.
- Rollback can reconstruct `value` from `value_v2` if required.

## 4. Problem

Keeping data in the legacy `value` column preserves the original plaintext exposure risk. Even if application readers no longer rely on it, the data remains available to anyone or anything with access to the database or downstream copies.

Dropping the column is not required for this phase and may create unnecessary schema compatibility risk. Nullifying the column gives us the security benefit while keeping the database shape stable.

## 5. Goals

- Permanently set `destination_config_options_2.value` to `NULL` for all rows.
- Permanently set `destination_config_revisions.value` to `NULL` for all rows.
- Keep `value_v2` as the canonical source of setting data.
- Roll out nullification by customer tier, starting with lower tiers.
- Provide a revert path that reconstructs `value` from `value_v2`.
- Avoid retaining a plaintext backup.

## 6. Non-Goals

- Dropping the `value` column.
- Reusing `value` as a canonical storage column.
- Redesigning the encryption, decryption, DEK, or KMS model.
- Building a durable migration framework.
- Changing the API contract for customers or external clients.

## 7. Proposal

We will add temporary internal migration tooling to nullify and revert the legacy `value` column.

For `destination_config_options_2`, nullification will be tier-based and throttled because changes flow to downstream CtlStore/change listeners that can only support limited throughput.

For `destination_config_revisions`, nullification can be processed separately and at higher throughput because it is not part of downstream CtlStore replication and does not affect the same API TPS constraint.

After this migration, `value_v2` will remain the only source of truth.

## 8. API Design

We will create two temporary internal APIs.

### 8.1 Nullify API

```http
POST /internal/migrations/destination-config-values/nullify
```

Example request:

```json
{
  "config_ids": ["config_id_1", "config_id_2"],
  "include_revisions": false
}
```

Expected behavior:

- Set `destination_config_options_2.value = NULL` for the provided config IDs.
- Only update rows where `value IS NOT NULL`.
- Return counts for requested configs, matched rows, updated rows, and failures.
- Be safe to retry.

Example response:

```json
{
  "requested_config_ids": 2,
  "matched_rows": 12,
  "updated_rows": 12,
  "failed_config_ids": []
}
```

### 8.2 Revert API

```http
POST /internal/migrations/destination-config-values/revert
```

Example request:

```json
{
  "config_ids": ["config_id_1", "config_id_2"]
}
```

Expected behavior:

- Reconstruct `value` from `value_v2`.
- For encrypted rows, decrypt `value_v2` and write the plaintext result to `value`.
- For non-encrypted rows, copy `value_v2` back to `value`.
- Only update rows where `value IS NULL`.
- Return counts and failures.
- Be safe to retry.

## 9. Kubernetes Script

We will create a temporary Kubernetes script/job to call the APIs.

Responsibilities:

- Read config IDs by customer tier.
- Call the nullify API in small batches.
- Respect the configured TPS limit for `destination_config_options_2`.
- Stop or pause if downstream lag crosses the agreed threshold.
- Support rerunning the same batch safely.
- Call the revert API if rollback is required.

The script does not need complex durable state. Since the APIs are idempotent, failed or repeated batches are safe.

## 10. Rollout Plan

Rollout order:

1. Stage
2. Free
3. Self-Service
4. Startup Program
5. Business
6. Key Accounts
7. Strategic Accounts
8. Remaining internal/unknown tiers
9. `destination_config_revisions`

For `destination_config_options_2`, rollout will be throttled because updates flow to downstream CtlStore/change listeners.

For `destination_config_revisions`, rollout will happen separately because it is not part of downstream CtlStore.

## 11. Revert Plan

We will not retain a plaintext backup.

If rollback is required, the revert API will reconstruct `value` from `value_v2`.

For encrypted rows:

- Read `value_v2`.
- Use encryption metadata and DEK/KMS flow to decrypt.
- Write decrypted plaintext back to `value`.

For non-encrypted rows:

- Copy `value_v2` back to `value`.

This means rollback depends on `value_v2` being present and valid, and on the decryption path being available for encrypted rows.

## 12. Crash and Retry Behavior

The APIs must be idempotent.

Nullify is safe to retry because it only updates rows where `value IS NOT NULL`.

Revert is safe to retry because it only updates rows where `value IS NULL`.

If an API pod crashes:

- The Kubernetes script retries the same batch.
- Rows already updated are skipped by the idempotent condition.
- Rows not updated yet are processed on retry.

If the Kubernetes script crashes:

- It can be restarted from the same tier or batch.
- Reprocessing is safe.

## 13. Risks and Mitigations

### 13.1 Risk: Hidden Dependency on `value`

A service may still read from `value` despite the assumption that readers have migrated.

Mitigation:

- Confirm migration tracker status before rollout.
- Validate in stage.
- Roll out by customer tier.
- Monitor reader errors after each tier.
- Use revert API if a critical dependency is discovered.

### 13.2 Risk: Unable to Reconstruct Original `value` After Nullification

After nullification, the legacy `value` column will no longer contain the original stored data. We are intentionally not retaining a plaintext backup because doing so would extend the lifetime of sensitive plaintext credentials.

Rollback will reconstruct `value` from `value_v2`.

This creates a risk that we may not be able to restore the exact original data if:

- `value_v2` is missing or malformed.
- `value_v2` was populated incorrectly during backfill.
- An encrypted row cannot be decrypted because of KMS, DEK, AAD, or encryption metadata issues.
- The original `value` and decrypted `value_v2` differ because of serialization differences.
- A non-sensitive row has a `value_v2` representation that is not byte-for-byte identical to the original `value`.

Mitigation:

Before nullifying a customer tier, we will run preflight validation for the rows in that tier:

- Verify `value_v2 IS NOT NULL`.
- For encrypted rows, verify that `value_v2` decrypts successfully.
- For encrypted rows, verify that decrypted `value_v2` matches the legacy `value`.
- For non-encrypted rows, verify that `value_v2` matches `value`, or passes an approved canonical equivalence check.
- Generate a mismatch report before nullification.
- Skip rows that fail validation and keep their `value` intact until they are manually remediated.

We will also validate the revert path before production rollout:

- Test the revert API in stage using real migrated rows.
- Verify encrypted rows can be decrypted from `value_v2` and written back to `value`.
- Verify non-encrypted rows can be restored by copying `value_v2` back to `value`.
- Monitor decryption failures and value mismatch metrics during rollout.

Because no plaintext backup will be retained, successful preflight validation is required to preserve rollback confidence. Rows that fail validation will be excluded from nullification until fixed.

### 13.3 Risk: Downstream Replication Pressure

Updates to `destination_config_options_2` flow to downstream CtlStore/change listeners. These systems have limited throughput and support approximately 1 RPS for this migration path.

Mitigation:

- Throttle calls from the Kubernetes script.
- Use small batches.
- Monitor downstream lag.
- Pause rollout when lag crosses threshold.
- Process customer tiers sequentially.

### 13.4 Risk: Revisions Table Volume

`destination_config_revisions` may contain a large number of historical rows.

Mitigation:

- Process revisions separately from the live config table.
- Do not apply the `destination_config_options_2` TPS constraint because revisions are not part of downstream CtlStore.
- Use batch updates and progress monitoring.

### 13.5 Risk: Misclassified Sensitive Options

Some sensitive settings may have incorrect metadata and may not have been encrypted as expected.

Mitigation:

- Continue auditing sensitive option metadata.
- Exclude rows with known unresolved metadata issues.
- Rerun backfill after metadata fixes where required.

## 14. Validation Plan

Before each tier:

- Count rows with `value IS NOT NULL`.
- Count rows with `value_v2 IS NULL`.
- Validate decryptability for encrypted rows.
- Validate equivalence between `value` and `value_v2`.
- Generate mismatch and skipped-row reports.

After each tier:

- Confirm expected rows have `value = NULL`.
- Confirm no increase in application errors.
- Confirm downstream CtlStore/change listener lag is healthy.
- Confirm no unexpected decryption failures.

For revisions:

- Count remaining rows with `value IS NOT NULL`.
- Process until the count reaches zero or all known exceptions are documented.

## 15. Success Criteria

- `destination_config_options_2.value` is `NULL` for all eligible rows.
- `destination_config_revisions.value` is `NULL` for all rows.
- `value_v2` remains the canonical source of data.
- No production reader impact is observed.
- Revert API is tested successfully in stage.
- No plaintext backup is retained.
- Temporary APIs and Kubernetes scripts are removed after the migration is complete and the observation window ends.

## 16. Open Questions

- Final batch size for `destination_config_options_2`.
- Final downstream lag threshold for pausing rollout.
- Whether revisions cleanup should use the same API or a separate script-only path.
- Observation window duration before deleting temporary migration tooling.
