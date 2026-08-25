## Breaking Changes Analysis: v24.0 → v26.0

### Summary

Meta is sunsetting Graph API **v24.0** on **2026-10-06**. This upgrades the `facebook-conversions-api` destination's canary version from `24.0` to `26.0`, deployed behind the existing feature flag `facebook-capi-actions-canary-version`. Jira: STRATCONN-6971 (parent: STRATCONN-6959).

No functional/breaking changes were found in v25.0 or v26.0 that affect this integration's usage of the Conversions API `/events` endpoint (`https://graph.facebook.com/v{version}/{pixelId}/events`).

### Critical Breaking Changes

None identified affecting Conversions API `/events`, `user_data`, `custom_data`, `action_source`, or `test_event_code`.

### Non-Breaking Changes (informational, not applicable to this destination)

- **v25.0**: Insights API metric deprecations (Page/Post/Video/Stories) — not used here.
- **v25.0**: `metadata=1` query parameter deprecated on node queries — not used here.
- **v25.0**: Webhooks mTLS CA transition (by 2026-03-31) — this destination doesn't consume webhooks.
- **v26.0**: Commerce Order Management API fully deprecated (47 endpoints) — not used here.
- **v26.0**: Graph API protocol cleanup — `pretty` query param ignored, `date_format` param now errors, legacy batch `GET /?ids=...` removed, `ETag`/`304 Not Modified` removed. None of these are used by this destination's request pattern (single POST per event/batch, no batch-by-ids, no date_format param, no reliance on ETag caching).
- **v26.0**: Marketing API surface deprecations (Messenger Stories, Poll ads, Instagram Explore Feed placement) — unrelated to Conversions API.

### Deprecation Warnings

None applicable.

### Testing Requirements

- Verify `/events` POST requests succeed unchanged against v26.0 for all event types (addToCart, addToCart2, custom, custom2, initiateCheckout, initiateCheckout2, pageView, pageView2, purchase, purchase2, search, search2, viewContent, viewContent2).
- Confirm feature-flag toggle correctly switches the version segment in the request URL between stable (`24.0`) and canary (`26.0`).
- Confirm `statsContext` tagging (`fb_api_version`) reports the correct version tag under both flag states.

### Risk Level

LOW — no request/response schema changes identified for the endpoints this destination calls. Primary risk is Meta silently changing undocumented validation on `/events`, mitigated by canary rollout via feature flag.
