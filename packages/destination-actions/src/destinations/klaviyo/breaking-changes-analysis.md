# Breaking Changes Analysis: Klaviyo API 2025-01-15 → 2026-01-15

## Summary

Four GA releases between 2025-01-15 and 2026-01-15: **2025-04-15**, **2025-07-15**, **2025-10-15**, **2026-01-15**. All changes in this window are **additive** — no breaking changes were introduced after 2025-01-15.

**Risk Level: LOW**

## Critical Breaking Changes

None. All changes between these two revisions are additive (new endpoints, new optional fields, new resources).

## Non-Breaking Changes by Release

### 2025-04-15 GA

- **Web Feeds API**: New CRUD endpoints for web feeds.
- **Custom Metrics API**: New API for custom metrics (1 per standard account).
- **Reviews Client APIs**: New client-side review endpoints.
- **Push Token APIs**: New endpoints for managing push tokens; push tokens now includable on `GET /api/profiles`.
- **Campaigns API**: Added push badge settings to `campaign-message` resource (optional field).
- **Templates API**: Optional `amp` field for AMP email template versions.

### 2025-07-15 GA

- **Mapped Metrics API**: New endpoints for mapped metrics retrieval and configuration.
- **Custom Objects API**: New endpoints for ingesting and retrieving custom objects from third-party sources.
- **Data Source APIs**: New CRUD endpoints for data sources.
- **Universal Content API**: Extended support for additional block types (button, divider, image, spacer, etc.).
- **Update Flow Action API**: New `PATCH /api/flow-actions/{id}` endpoint (beta).

### 2025-10-15 GA

- **Forms API** (graduated from beta): `GET` and `POST /api/forms` endpoints.
- **Flow Actions API** (graduated from beta): Full flow actions and flow messages retrieval.
- **Coupon Codes API**: `DELETE /api/coupon-codes/{id}` endpoint added.
- **Profiles API**: Added `subscriptions` field to profile inclusions.
- **Universal Content**: Enrolled accounts can now create/update universal content blocks.

### 2026-01-15 GA

- **Catalog Variants API**: New endpoints for managing catalog item variants.
- **Tags API enhancements**: Extended tagging support to additional resource types.
- **Reporting API additions**: New fields in campaign and flow reporting responses.
- **Additional optional fields**: Various optional fields added across existing endpoints.

## Deprecation Notices

Per Klaviyo's **2-year API lifecycle policy**, revisions older than 2 years enter "Retired" status (return 410 errors). Revision **2024-02-15** and earlier are approaching or past the retirement window. This upgrade from `2025-01-15` to `2026-01-15` is forward-compatible.

## Impact on Current Klaviyo Destination Implementation

Our destination uses:

- `POST /api/profiles/` — No changes
- `POST /api/profile-bulk-import-jobs/` — No changes
- `POST /api/profile-subscription-bulk-create-job` — No changes (subscriptions field already supported)
- `POST /api/profile-subscription-bulk-delete-job` — No changes
- `POST /api/event-bulk-create-jobs/` — No changes
- `GET /api/profiles/` — No changes
- `GET/DELETE /api/lists/` — No changes
- `POST /api/data-privacy-deletion-jobs/` — No changes

**All endpoints used by this destination are unaffected by this version upgrade.**

## Testing Requirements

- Verify `revision` header correctly sends `2025-01-15` without feature flag
- Verify `revision` header correctly sends `2026-01-15` with feature flag enabled
- All existing action tests should pass without modification
