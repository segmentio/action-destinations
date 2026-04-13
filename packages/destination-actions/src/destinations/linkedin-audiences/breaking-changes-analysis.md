# Breaking Changes Analysis: LinkedIn Audiences API 202505 → 202603

## Summary

No new DMP Segments API-specific breaking changes were introduced in the 202505–202603 window. The upgrade is primarily driven by **version sunset urgency**: 202505 sunsets on **May 15, 2026** (~1 month from today). Upgrading to 202603 (supported until March 16, 2027) ensures continuity of service.

The implementation uses a feature flag (`linkedin-audiences-canary-version`) for safe, gradual rollout with instant rollback capability.

---

## Critical Breaking Changes

**None new in 202505 → 202603 range.**

---

## Medium Priority Changes

### 1. BATCH_CREATE Per-Element Response Schema (introduced 202502)

**Applies to**: `POST /rest/dmpSegments/{id}/users` with `X-RestLi-Method: BATCH_CREATE`

| Aspect            | Pre-202502                                                    | 202502+ (202603)                                                         |
| ----------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Validation scope  | All-or-nothing: entire batch rejected on any validation error | Partial: valid elements accepted, invalid ones return per-element errors |
| Response body     | Single error on failure                                       | Array of per-element HTTP statuses (`201` success, `400` error)          |
| Error attribution | No index reference                                            | `batchIndex` field identifies failing element position                   |

**Impact on our implementation**: Our current code checks `res.status !== 200` for the top-level HTTP response and throws `RetryableError` for non-200 responses. Under 202603, a batch with some valid and some invalid elements may return HTTP `200` at the top level while individual elements have `400` status in the response body.

**Decision**: The existing error handling remains correct for the overall batch failure case. Per-element error handling is a potential future enhancement but is not a breaking change for the current implementation pattern (batch retries handle transient failures).

### 2. Predictive Audiences API (202511)

Additive/non-breaking. New `desiredAudienceCount` field and geo-filter options for predictive audience segments. Does not affect existing DMP segment user sync flows.

---

## Low Priority / Informational

### 3. Rate Limit Alerting (202509)

LinkedIn now sends email alerts to developer app admins at 75% of daily rate limit. Rate limits themselves are unchanged.

### 4. Version Sunset Schedule

| Version              | Sunset Date         |
| -------------------- | ------------------- |
| **202505 (current)** | **May 15, 2026 ⚠️** |
| 202603 (target)      | March 16, 2027      |

202505 is the **immediate driver** for this upgrade — it sunsets in approximately 1 month.

### 5. `accessPolicy` Field Removal (202406 — pre-range)

Already handled. The field was removed from create/update/get schema in 202406. Our implementation does not use this field.

---

## Testing Requirements

- [x] Stable version (202505) continues to work without feature flag
- [x] Canary version (202603) activated via `linkedin-audiences-canary-version` feature flag
- [ ] Manual smoke test with feature flag disabled (stable)
- [ ] Manual smoke test with feature flag enabled (canary)
- [ ] Monitor for per-element batch error responses in canary rollout

---

## Rollout Plan

1. **Phase 1**: Merge PR — feature flag off by default, production unchanged
2. **Phase 2**: Enable flag for internal Segment workspace testing
3. **Phase 3**: Gradual rollout to subset of customers
4. **Phase 4**: Full rollout, promote canary (`202603`) to stable
5. **Phase 5**: Remove feature flag and old version (`202505`)
