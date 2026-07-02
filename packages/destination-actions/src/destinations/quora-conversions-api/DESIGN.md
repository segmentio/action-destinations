# Quora Conversions API — Segment Destination Design

## Goal
A cloud-mode Actions destination ("Quora Conversions API") that forwards Segment conversion events to Quora's Conversions API, so mutual customers enable Quora with configuration only, no code.

## Quora Conversions API (the target)
- Base URL: `https://api.quora.com/ads/v0`
- Auth: a bearer token generated per ad account in Quora Ads Manager, non-expiring. Header `Authorization: Bearer <token>`.
- Endpoints:
  - `POST /conversion` (single event)
  - `POST /conversions` (batch, 1 to 1,000 events, processed independently, returns HTTP 200 with a per-item results array). The destination uses this.
- Rate limit: 1,000 events/min per account. Each batch item counts. A batch that would exceed the limit is rejected whole with 429.
- `event_name` accepted values: Generic, AppInstall, Purchase, GenerateLead, CompleteRegistration, AddPaymentInfo, AddToCart, AddToWishlist, InitiateCheckout, Search.
- Attribution needs at least one of `click_id` (Quora "qclid", appended to the landing-page URL after an ad click) or `user.email`. click_id is the strongest signal.
- Dedup on `event_id`, shared with the Quora pixel.

### Request body
- `account_id` (int, required, must match the token's account)
- `conversion`: `event_name` (required), `timestamp` (microseconds), `value` (number, USD), `event_id`, `click_id`
- `user`: `email`, `phone_number`, `name`, `ip`, `country`, `region`, `city`, `postal_code`, `company_name`, `job_title`, `date_of_birth`
- `device`: `user_agent`, `language`, `mobile_device_id`, `referrer`

### Batch response
`{ events_received, events_errored, events: [ { status: "OK"|"ERROR", index, error_code, error_message } ] }`. Per-item error code today: `VALUE_OUT_OF_RANGE` (value above ~$214,748.36).

## Destination design
- Cloud-mode Actions destination, modeled on `reddit-conversions-api`.
- Settings (scheme: custom): `account_id` (string), `api_token` (password). `extendRequest` attaches the bearer header.
- Action "Send Conversion" with `enable_batching` (default true): `performBatch` posts to `/conversions`, `perform` to `/conversion`.
- Event field constrained via `choices` to the event types above (Reddit style).
- Field mapping defaults:

| Quora field | Segment source |
| --- | --- |
| conversion.event_name | preset per event (below) |
| conversion.timestamp | `$.timestamp`, converted to microseconds |
| conversion.value | `$.properties.revenue` then `value` then `total` |
| conversion.event_id | `$.messageId` |
| conversion.click_id | `$.integrations['Quora Conversions Api'].qclid`, else `$.properties.qclid` |
| user.email | `$.properties.email`, else `$.context.traits.email` (plaintext) |
| user.phone_number | `traits.phone` |
| user.name | `traits.name` |
| user.ip | `$.context.ip` |
| device.user_agent | `$.context.userAgent` |
| device.language | `$.context.locale` |
| user.country/region/city/postal_code | `traits.address.*` |

- Email: sent as plaintext; Quora hashes server-side for matching, so the destination does not hash.
- Presets (Segment spec event -> Quora event_name): Order Completed -> Purchase, Product Added -> AddToCart, Checkout Started -> InitiateCheckout, Signed Up -> CompleteRegistration, Products Searched -> Search, Product Added to Wishlist -> AddToWishlist, Payment Info Entered -> AddPaymentInfo, page -> Generic.
- Batching and errors: `performBatch` posts up to 1,000 with `throwHttpErrors: false`, then maps the 200-body per-item results to `MultiStatusResponse` by the returned `index` (OK -> `setSuccessResponseAtIndex`, ERROR -> `setErrorResponseAtIndex` carrying `error_code`/`error_message`). Modeled on the Mixpanel and Amazon batch destinations.
- click_id capture: qclid lands on the landing-page URL after an ad click. Proposed: a browser "plugin" action (Reddit/Snap style) that reads qclid from the URL and stashes it in the integrations object, with a `$.properties.qclid` fallback for server-side sources.

## Field formats and notes
All user and device fields are optional strings. The server validates only `email` and `ip`; the rest are stored as sent, with no strict format enforcement. Formats below are the recommended conventions for mapping.

- date_of_birth: YYYY-MM-DD (e.g. 2000-01-01).
- country: ISO 3166-1 alpha-2 (e.g. US).
- region: state or region name as a free string (e.g. California).
- phone_number: no enforced format; E.164 preferred, the doc example is US-formatted.
- language: locale string (e.g. en_US); Segment `context.locale` like en-US passes as-is.
- mobile_device_id: the advertising ID (IDFA on iOS, AAID on Android). There is no separate IDFV / device-ID field today.
- referer: the referring URL. The API field is spelled `referer` (single r); the public doc's `referrer` is a typo to be fixed, so map to `referer`.
- event_id: optional (not required); a UUID is recommended but not enforced; empty string is treated as null. Map to Segment `messageId`.
- click_id (qclid): required for attribution unless a matchable email is provided. Cache the most recent qclid client-side and send it on every event (last-click, up to a 90-day click-through window).
- value: a number, treated as USD; capped near $214,748.36 (above that returns per-item `VALUE_OUT_OF_RANGE`).
- timestamp: microseconds; if missing or outside the 90-day window the server substitutes the current time.

## Design decisions and open questions
- Event field is constrained to the standard conversion types via `choices` (Reddit style), with presets covering the common Segment ecommerce events.
- Email is mapped and sent as plaintext; Quora hashes server-side for matching, so the destination does not hash.
- Batching uses `performBatch` against `/conversions`, mapping the per-item results to `MultiStatusResponse` by returned index (modeled on the Mixpanel and Amazon destinations).
- `testAuthentication` is not implemented in v1 (consistent with the Snap Conversions destination); credentials are validated on first event delivery.
- click_id (qclid) capture: qclid is appended to the advertiser's landing-page URL after an ad click. The plan is a browser plugin action that reads qclid from the URL into the integrations object, with a `$.properties.qclid` fallback for server-side sources. Question for review: is the plugin-action approach the pattern you would recommend, or would you rely on the properties and `context.page.url` path?

## Links
- Overview: https://quoraadsupport.zendesk.com/hc/en-us/articles/23065751885069-Conversion-API-Overview
- API reference: https://www.quora.com/ads/conversion_api_doc
