# Breaking Changes Analysis: 202505 → 202604

## Summary

Upgrading the LinkedIn Audiences API version header from `202505` to `202604`. No breaking changes affect the endpoints used by this destination (`/dmpSegments`, `/dmpSegments/{id}/users`, `/adAccountUsers`, `/me`). The upgrade is a calendar-rotation requirement — LinkedIn supports each version for a minimum of one year, and 202505 will be sunset in May 2026.

## Critical Breaking Changes

None affecting this destination.

## Medium Priority Changes

1. **BATCH_CREATE Partial Validation (202502+)**
   - **Impact**: The `POST /dmpSegments/{id}/users` endpoint now returns per-element HTTP status codes with `batchIndex` identifiers when some records are invalid.
   - **Required Action**: None — this change was introduced in 202502, before our current stable version (202505). Our implementation already benefits from this behavior.
   - **Risk Level**: LOW

## Non-Breaking Changes

- **Predictive Audiences API (202511)**: New private API for AI-scored audience segments. Not relevant to this destination.
- **Buyer Groups Targeting Facet (202603)**: New `buyerGroups` facet on `/adTargetingEntities`. Not relevant to this destination.
- **External IDs in Conversions API (202410+)**: Optional `externalIds` field on conversion events. Not relevant to this destination.

## Deprecation Warnings

- **Version 202504 sunset**: Already sunset. Our upgrade to 202604 is well within the support window.
- **POST /media/upload (DMP list uploads)**: Was sunset September 16, 2025. This destination uses the `BATCH_CREATE` method on `/dmpSegments/{id}/users`, not file uploads, so this deprecation does not apply.

## Testing Requirements

- Verify `Linkedin-Version: 202604` header is sent when feature flag `linkedin-audiences-canary-version` is enabled.
- Verify `Linkedin-Version: 202505` header is sent when feature flag is disabled (default behavior unchanged).
- Verify all existing `updateAudience` action tests continue to pass with stable version.
