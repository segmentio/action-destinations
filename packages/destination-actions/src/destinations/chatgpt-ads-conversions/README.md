# ChatGPT Ads Conversions

Local implementation of a Segment cloud destination for website conversions.
It sends events to `POST https://bzr.openai.com/v1/events?pid=<Pixel ID>`.
The working name and catalog registration still need confirmation before release.

## Settings

Use the Pixel ID and a server-side Conversions API key from the same Ads Manager
data source.
The API key field uses Segment's password setting.

The credential check sends `validate_only: true`. It does not record a conversion.
Normal action deliveries send `validate_only: false`.

## Events

One **Report Website Event** action handles all website event types. Advertisers
can change its filters and field mappings in Segment.

| Preset filter             | CAPI event               | CAPI data type    |
| ------------------------- | ------------------------ | ----------------- |
| `Order Completed`         | `order_created`          | `contents`        |
| `Checkout Started`        | `checkout_started`       | `contents`        |
| `Product Added`           | `items_added`            | `contents`        |
| `Product Viewed`          | `contents_viewed`        | `contents`        |
| `Lead Created`            | `lead_created`           | `customer_action` |
| `Signed Up`               | `registration_completed` | `customer_action` |
| `Appointment Scheduled`   | `appointment_scheduled`  | `customer_action` |
| `Subscription Created`    | `subscription_created`   | `plan_enrollment` |
| `Trial Started`           | `trial_started`          | `plan_enrollment` |
| Segment `page` call       | `page_viewed`            | `contents`        |
| Advertiser-defined filter | `custom`                 | `custom`          |

For a custom event, add a mapping, select `custom`, and set Custom Event Name.
Only explicitly mapped custom properties are sent. There is no automatic
catch-all mapping, because it could send a standard event twice.
Custom event delivery does not by itself establish that Ads Manager can use that
event for optimization or reporting.

This destination supports the website events listed above and uses `action_source: web`.

## Default field mappings

| Segment field                           | CAPI field or behavior                                       |
| --------------------------------------- | ------------------------------------------------------------ |
| `properties.event_id`, else `messageId` | `id`                                                         |
| `timestamp`                             | `timestamp_ms`                                               |
| `context.page.url`                      | `source_url`, with credentials, query and fragment removed   |
| `properties.oppref`                     | `oppref`, unchanged                                          |
| `properties.opt_out`                    | `opt_out`, without a default                                 |
| `properties.revenue`                    | `data.amount`, converted to integer minor currency units     |
| `properties.currency`                   | `data.currency`                                              |
| `properties.products`                   | `data.contents`                                              |
| `properties.plan_id`                    | `data.plan_id`, for subscription, trial, or custom events    |
| `context.traits.email`                  | Trim, lowercase, SHA-256, then `user.email_sha256`           |
| `userId`                                | Trim, preserve case, SHA-256, then `user.external_id_sha256` |
| `properties.user_data`                  | Explicitly supported matching fields                         |
| Constant `segment`                      | Request `integration_source`                                 |

Choose the correct value field for your event. For example, map
`properties.total` if that is the full order value you want to report.
Item `price` means unit price. Product Added and Product Viewed presets use the
single product in `properties`; other presets use `properties.products`.
Optional item fields also include group ID, content type, and string-valued variants.

By default, USD `19.99` becomes `1999`, JPY `1200` stays `1200`, and KWD `1.005`
becomes `1005`. If the source already uses minor units, select **Minor**.
The connector rejects fractional minor units instead of rounding them.
Currency must be present for a mapped value or item price. The API remains the
final authority for valid ISO currency codes.

## Matching and consent

Matching Data supports:

- Pre-hashed email and customer IDs, as single values or lists.
- Pre-hashed phone numbers, first names, and last names, as lists.
- Country and city, as single values or lists; postal codes and regions, as lists.
- Original customer IP address, browser user agent, and OpenAI browser reference.

Lists allow at most three values. These are optional matching signals, not proof
that a customer will match. IP and user agent are not inferred from the Segment
server. Map the original customer values explicitly.

Raw Email and Customer ID are separate from their pre-hashed fields. If you
supply a pre-hashed value, remove its raw field mapping to avoid a conflict.
Raw Customer IDs are trimmed at both ends and hashed without changing case.
Normalize phone and name values before hashing upstream. Raw phone/name fields,
private identity fields, and unrelated Segment traits are not forwarded.

Configure the advertiser's consent rules in Segment before enabling delivery.
The connector does not infer permission to track. It preserves explicit opt-out
true/false and null/absent as unspecified. The `opt_out` flag does not replace
consent-based suppression at the source or in Segment.

## Data boundaries

Requests go only to the fixed HTTPS Conversions API endpoint. The API key goes
in the Authorization header, never in the URL or event body. The connector does
not log credentials, event payloads, or API response bodies.

Page URL retains the scheme, host, port, and path. Embedded credentials, all query
parameters (including UTM parameters), and fragments are removed before delivery.
Map the Ad Click Reference separately; the connector does not extract it from the
URL. Map a clean Page URL if the path itself contains personal data.

Only defined matching and item fields pass Segment's input validation. Custom
Properties and item Variants allow advertiser-selected values. These fields, event
IDs, item names, and URL paths must not contain credentials, personal data that
belongs in matching fields, or other disallowed data. The connector cannot detect
all sensitive content in arbitrary strings.

Hashing does not make customer data anonymous. Segment receives the source event
before this connector runs; hashing here protects the fields sent to OpenAI, not
the original event inside Segment. Workspace access, consent filters, and Segment's
request/debug logging controls remain part of the deployment review.

## Errors and retries

Missing required fields and invalid mapped values fail before delivery.
API failures retain the status needed for Segment's retry handling.
Credential failures require correction; temporary failures such as HTTP 429/503
can be retried by Segment. The connector does not run a separate retry loop.
It rejects redirects and a success response that does not confirm one accepted event.
Request failures use a generic error without attaching the underlying request or
response. If acceptance is unknown, Segment can retry with the same Event ID.

Each request contains one event. On repeat delivery, the connector keeps the same
event ID, original time, and value. The API requires a time within the last seven
days and at most ten minutes ahead. Do not change an old event's timestamp to make
a replay pass validation.

If Pixel also sends the conversion, the advertiser must supply the same event ID
to both paths. Segment `messageId` alone does not establish Pixel/CAPI deduplication.
Repeated requests can be accepted by the API; downstream deduplication needs a
separate real test.

## Development

From the action-destinations repository:

```sh
yarn cloud test chatgpt-ads-conversions --runInBand
```

The tests use Segment's mapping/runtime harness and simulated API responses.
They do not prove hosted Segment delivery, downstream storage, matching,
attribution, reporting, or Pixel deduplication.

Generated types and metadata use Segment's own generators. No catalog ID is
invented. Segment must supply the destination registration before it can be added
to the package manifest and enabled for a private test.

Email hashing uses the repository's `processHashing` helper. Explicit raw Customer
ID hashing intentionally bypasses hash auto-detection: a raw 64-character hex ID
must still be hashed. Pre-hashed IDs belong in the separate matching fields.

API contract: https://developers.openai.com/ads/conversions-api
