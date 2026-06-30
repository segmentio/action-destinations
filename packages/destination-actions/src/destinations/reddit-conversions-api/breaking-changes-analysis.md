# Breaking Changes Analysis: v2.0 → v3.0

## Summary

Upgrade of the Reddit Conversions API from **v2.0** (stable/production) to **v3.0**
(canary/feature-flagged). The version is the only path segment that changes in the
request URL:

```
https://ads-api.reddit.com/api/<version>/conversions/events/<ad_account_id>
```

The new version is deployed behind the feature flag `reddit-conversions-api-canary-version`.
With the flag off, behavior is byte-for-byte identical to today.

## ⚠️ Changelog Retrieval Status

> **The Reddit changelog could not be fetched programmatically during this upgrade.**
> Both `https://ads-api.reddit.com/docs/v2/changelog` and `https://ads-api.reddit.com/docs/`
> returned network errors from the build environment.
>
> **Action required before merge / promoting the canary to stable:** a maintainer must
> manually review the v3.0 changelog at https://ads-api.reddit.com/docs/v2/changelog
> (and any v3 migration guide Reddit publishes) and complete the breaking-changes
> checklist below. Do not enable the feature flag for production traffic until this
> review is done.

## Breaking Changes Checklist (to be completed via manual changelog review)

### Request Changes

- [ ] New required parameters
- [ ] Removed or deprecated parameters
- [ ] Changed parameter types or formats
- [ ] Modified validation rules
- [ ] Different authentication methods (currently `Authorization: Bearer <conversion_token>`)
- [ ] New headers required
- [ ] Changed request body structure (`events[]`, `event_type`, `event_metadata`, `user`, etc.)

### Response Changes

- [ ] Modified response schema
- [ ] Removed response fields
- [ ] Changed field types
- [ ] Different error codes (current handling: 401 → invalid token, 403 → invalid ad account)
- [ ] New error response formats

### Behavioral Changes

- [ ] Rate limiting differences
- [ ] Batching size limits
- [ ] Timeout changes
- [ ] Retry logic requirements
- [ ] Idempotency key handling

### Endpoint Changes

- [ ] URL pattern changes (currently `/api/<version>/conversions/events/<ad_account_id>`)
- [ ] Method changes (currently POST)
- [ ] Deprecated endpoints
- [ ] New endpoints replacing old ones

## Risk Assessment

**Risk Level**: MEDIUM (until changelog review is completed)

**Mitigation**:

- Feature flag `reddit-conversions-api-canary-version` allows instant rollback.
- Stable v2.0 path is unchanged; canary only activates when the flag is set.
- Unit tests cover both stable (flag off) and canary (flag on) request URLs.

## Testing Requirements

- Verify stable v2.0 endpoint is called by default (no `features`).
- Verify v3.0 endpoint is called when `reddit-conversions-api-canary-version` is enabled.
- Cover both `standardEvent` and `customEvent` actions, single + batch.
