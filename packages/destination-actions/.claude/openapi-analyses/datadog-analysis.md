# OpenAPI Destination Analysis: Datadog

## Summary

- **API Name:** Datadog
- **Version:** V1 and V2 (both current)
- **Base URL:** `https://api.datadoghq.com`
- **Authentication:** custom
- **Analysis Date:** 2026-02-24
- **Analysis Source:** OpenAPI Spec (GitHub: DataDog/datadog-api-client-go)

## Authentication Setup

### Recommended Scheme: custom

**Authentication Method:** Dual API Key authentication. Most data-ingestion endpoints only require the Datadog API Key (`DD-API-KEY` header). The Application Key (`DD-APPLICATION-KEY`) is additionally required for the V2 Events endpoint.

**Required Settings:**

1. **apiKey** (type: password)

   - Description: Your Datadog API Key
   - Where to find: Datadog dashboard → Organization Settings → API Keys
   - Applied as: `DD-API-KEY` request header

2. **appKey** (type: password)

   - Description: Your Datadog Application Key (only required for Send Event V2 action)
   - Where to find: Datadog dashboard → Organization Settings → Application Keys
   - Applied as: `DD-APPLICATION-KEY` request header

3. **site** (type: string)
   - Description: Your Datadog site region
   - Default: `datadoghq.com`
   - Options: `datadoghq.com`, `us3.datadoghq.com`, `us5.datadoghq.com`, `ap1.datadoghq.com`, `ap2.datadoghq.com`, `datadoghq.eu`, `ddog-gov.com`
   - Applied as: Substituted into base URL `https://api.{site}`

**Test Authentication Endpoint:**

- Endpoint: `GET /api/v1/validate`
- Purpose: Validates the API key and returns `{"valid": true}` if successful
- Auth required: `DD-API-KEY` only

## Recommended Actions

### Priority: High

#### 1. Send Log - Send a Segment event as a Datadog log entry

- **Endpoint:** `POST /api/v2/logs`
- **Operation ID:** submitLog
- **Purpose:** Sends Segment events (track, identify, group, page, screen) as structured log entries to Datadog Log Management. Supports arbitrary JSON properties making it the most flexible mapping.
- **Segment Event Type:** track
- **Default Subscription:** `type = "track" or type = "identify" or type = "page" or type = "screen" or type = "group"`
- **Batch Support:** Yes (body is an array of log items; max 1000 entries, 5MB uncompressed)
- **Reasoning:** Most flexible endpoint for Segment integration — accepts arbitrary additional JSON properties alongside reserved fields. Only requires API Key. Excellent for forwarding any Segment event with full fidelity.

**Field Mappings:**

| Field Name | Type   | Required | Description                                           | Suggested Default Path                        |
| ---------- | ------ | -------- | ----------------------------------------------------- | --------------------------------------------- |
| message    | string | Yes      | Log message body; indexed for full-text search        | `$.event`                                     |
| ddsource   | string | No       | Technology/integration origin (e.g. "segment")        | (hardcode "segment")                          |
| ddtags     | string | No       | Comma-separated tags, e.g. "env:prod,userId:123"      | (constructed from userId, event, anonymousId) |
| hostname   | string | No       | Name of originating host                              | `$.context.ip`                                |
| service    | string | No       | Application or service name; links logs to APM traces | (hardcode "segment")                          |

**Request Body Schema:**

```json
[
  {
    "message": "string",
    "ddsource": "segment",
    "ddtags": "userId:abc123,event:Order Completed,anonymousId:xyz",
    "hostname": "string",
    "service": "segment",
    "userId": "string",
    "anonymousId": "string",
    "email": "string",
    "timestamp": "2024-01-01T00:00:00Z",
    "properties": {}
  }
]
```

**Additional Notes:**

- `HTTPLogItem` accepts arbitrary additional properties alongside reserved fields — map all Segment `properties`, `traits`, `context`, `userId`, `anonymousId`, `timestamp` as top-level or nested JSON keys.
- The `message` field is the primary indexed text; recommend setting it to the event name and/or a JSON summary of properties.
- `ddtags` format is comma-separated `key:value` pairs (no spaces around commas).
- Batch endpoint: body is an array, so all events in a batch share the same API call.
- Optional `Content-Encoding: gzip` header supported for compressed payloads.

---

#### 2. Send Event (V1) - Post an event to the Datadog event stream

- **Endpoint:** `POST /api/v1/events`
- **Operation ID:** createEvent
- **Purpose:** Posts a custom event to the Datadog event stream. Useful for correlating Segment track events with infrastructure events in Datadog dashboards.
- **Segment Event Type:** track
- **Default Subscription:** `type = "track"`
- **Batch Support:** No (single event per request)
- **Reasoning:** Classic Datadog event ingestion endpoint. Only requires API Key. Well-established for custom event streams and easy to map Segment track events to.

**Field Mappings:**

| Field Name       | Type     | Required | Description                                                                                  | Suggested Default Path                        |
| ---------------- | -------- | -------- | -------------------------------------------------------------------------------------------- | --------------------------------------------- |
| title            | string   | Yes      | Event title (maps well to Segment event name)                                                | `$.event`                                     |
| text             | string   | Yes      | Event body text; supports markdown (max 4000 chars)                                          | `$.properties` (JSON stringified)             |
| aggregation_key  | string   | No       | Arbitrary string for event grouping/deduplication (max 100 chars)                            | `$.userId`                                    |
| alert_type       | string   | No       | Severity: `error`, `warning`, `info`, `success`, `user_update`, `recommendation`, `snapshot` | (hardcode "info")                             |
| date_happened    | integer  | No       | POSIX timestamp of when the event occurred (max 18 hrs old)                                  | `$.timestamp` (convert to epoch seconds)      |
| device_name      | string   | No       | Device name                                                                                  | `$.context.device.name`                       |
| host             | string   | No       | Hostname; tags on that host also apply to this event                                         | `$.context.ip`                                |
| priority         | string   | No       | Event priority: `normal` or `low`                                                            | (hardcode "normal")                           |
| source_type_name | string   | No       | Source type identifier (e.g. "segment")                                                      | (hardcode "segment")                          |
| tags             | string[] | No       | Tags in `key:value` format, e.g. `["env:prod", "userId:abc"]`                                | (constructed from userId, anonymousId, email) |

**Request Body Schema:**

```json
{
  "title": "string",
  "text": "string",
  "aggregation_key": "string",
  "alert_type": "info",
  "date_happened": 1704067200,
  "device_name": "string",
  "host": "string",
  "priority": "normal",
  "related_event_id": 0,
  "source_type_name": "segment",
  "tags": ["userId:abc123", "email:user@example.com"]
}
```

**Additional Notes:**

- `title` and `text` are both required.
- `date_happened` must be within 18 hours of now; older timestamps are rejected.
- `tags` are strings in `key:value` format — recommend building these from `userId`, `anonymousId`, `email`, and `event` name.
- This endpoint does **not** support batching; use Send Log for high-volume workloads.

---

### Priority: Medium

#### 3. Submit Metrics (V2) - Submit time-series metric data

- **Endpoint:** `POST /api/v2/series`
- **Operation ID:** submitMetrics
- **Purpose:** Submits time-series metric data to Datadog. Useful for counting Segment track events as Datadog metrics (e.g. `segment.order_completed.count`).
- **Segment Event Type:** track
- **Default Subscription:** `type = "track"`
- **Batch Support:** Yes (body contains a `series` array; max 500KB per payload)
- **Reasoning:** Enables building Datadog dashboards and monitors from Segment event counts. Good for product analytics use cases.

**Field Mappings:**

| Field Name                  | Type     | Required | Description                                                   | Suggested Default Path                        |
| --------------------------- | -------- | -------- | ------------------------------------------------------------- | --------------------------------------------- |
| series[].metric             | string   | Yes      | Metric name in dot notation (e.g. "segment.order_completed")  | `$.event` (transformed to dot notation)       |
| series[].points[].timestamp | integer  | No       | POSIX epoch seconds. Must be within 10 min future / 1 hr past | `$.timestamp` (convert to epoch seconds)      |
| series[].points[].value     | number   | No       | Numeric value of the metric point                             | (hardcode 1 for event counts)                 |
| series[].type               | integer  | No       | Metric type: 0=unspecified, 1=count, 2=rate, 3=gauge          | (hardcode 1 for count)                        |
| series[].tags               | string[] | No       | Tags in `key:value` format                                    | (constructed from userId, anonymousId, event) |
| series[].resources[].name   | string   | No       | Resource name (e.g. hostname)                                 | `$.context.ip`                                |
| series[].resources[].type   | string   | No       | Resource type (e.g. "host")                                   | (hardcode "host")                             |
| series[].source_type_name   | string   | No       | Source type identifier                                        | (hardcode "segment")                          |

**Request Body Schema:**

```json
{
  "series": [
    {
      "metric": "segment.order_completed",
      "points": [
        {
          "timestamp": 1704067200,
          "value": 1
        }
      ],
      "type": 1,
      "tags": ["userId:abc123", "event:Order Completed"],
      "resources": [{ "name": "api.example.com", "type": "host" }],
      "source_type_name": "segment"
    }
  ]
}
```

**Additional Notes:**

- `series[].points[].timestamp` must be no more than 10 minutes in the future and no more than 1 hour in the past; otherwise the data point is silently dropped.
- Recommend transforming Segment event names to dot-notation metric names (e.g. "Order Completed" → "segment.order_completed").
- `type: 1` (count) is appropriate for tracking event occurrences.
- V2 uses named `{timestamp, value}` objects for points (not V1 tuple arrays).

---

#### 4. Send Event (V2) - Post a structured change or alert event

- **Endpoint:** `POST /api/v2/events`
- **Operation ID:** createEventV2
- **Purpose:** Posts a structured event of category `change` (e.g. feature flag change, deployment) or `alert` to Datadog Event Management. More structured than V1 events.
- **Segment Event Type:** track
- **Default Subscription:** `type = "track"`
- **Batch Support:** No (single event per request)
- **Reasoning:** Useful for forwarding application change events (e.g. "Feature Flag Updated", "Deployment Started") or alert events from Segment to Datadog Event Management.

**Field Mappings:**

| Field Name                        | Type     | Required        | Description                                                        | Suggested Default Path                       |
| --------------------------------- | -------- | --------------- | ------------------------------------------------------------------ | -------------------------------------------- |
| data.attributes.title             | string   | Yes             | Event title (1–500 chars)                                          | `$.event`                                    |
| data.attributes.category          | string   | Yes             | Event category: `change` or `alert`                                | (user-configured or derived from event name) |
| data.attributes.attributes.status | string   | Yes (for alert) | Alert status: `warn`, `error`, `ok`                                | (hardcode "ok" or user-configured)           |
| data.attributes.message           | string   | No              | Free-form text body (1–4000 chars)                                 | `$.properties` (JSON stringified)            |
| data.attributes.aggregation_key   | string   | No              | Deduplication key (1–100 chars)                                    | `$.userId`                                   |
| data.attributes.host              | string   | No              | Associated hostname (1–255 chars)                                  | `$.context.ip`                               |
| data.attributes.integration_id    | string   | No              | Must be `"custom-events"` for custom use                           | (hardcode "custom-events")                   |
| data.attributes.tags              | string[] | No              | Tags in `key:value` format (max 100, each max 200 chars)           | (constructed from userId, event)             |
| data.attributes.timestamp         | datetime | No              | ISO 8601 event timestamp (max 18 hrs old)                          | `$.timestamp`                                |
| data.attributes.attributes.custom | object   | No              | Arbitrary JSON for alert events (max 100 props, 10 nesting levels) | `$.properties`                               |

**Request Body Schema:**

```json
{
  "data": {
    "type": "event",
    "attributes": {
      "title": "string",
      "category": "alert",
      "message": "string",
      "aggregation_key": "string",
      "host": "string",
      "integration_id": "custom-events",
      "tags": ["userId:abc123", "event:Order Completed"],
      "timestamp": "2024-01-01T00:00:00Z",
      "attributes": {
        "status": "ok",
        "priority": "5",
        "custom": {}
      }
    }
  }
}
```

**Additional Notes:**

- **Requires both** `DD-API-KEY` and `DD-APPLICATION-KEY` headers (unlike all other endpoints which need only the API key).
- **Special base URL:** `https://event-management-intake.{site}/api/v2/events` (not `api.{site}`).
- Only `change` and `alert` categories are generally available; other categories may be in beta.
- `data.attributes.attributes` schema differs by category: `alert` requires `status`; `change` requires `changed_resource`.

---

### Priority: Low

#### 5. Submit Metrics (V1) - Submit time-series metrics (legacy format)

- **Endpoint:** `POST /api/v1/series`
- **Operation ID:** submitMetricsV1
- **Purpose:** Submits time-series metric data using the V1 format (tuple arrays for points). Superseded by V2 series endpoint.
- **Segment Event Type:** track
- **Default Subscription:** `type = "track"`
- **Batch Support:** Yes (`series` array; max 3.2MB uncompressed)
- **Reasoning:** Lower priority than V2 series due to older point format, but included for completeness. Use V2 series instead.

**Field Mappings:**

| Field Name      | Type     | Required | Description                        | Suggested Default Path           |
| --------------- | -------- | -------- | ---------------------------------- | -------------------------------- |
| series[].metric | string   | Yes      | Metric name in dot notation        | `$.event` (transformed)          |
| series[].points | object   | Yes      | Array of [timestamp, value] tuples | `[[epochSeconds, 1]]`            |
| series[].host   | string   | No       | Hostname                           | `$.context.ip`                   |
| series[].type   | string   | No       | `count`, `gauge`, `rate`, or `""`  | (hardcode "count")               |
| series[].tags   | string[] | No       | Tags in `key:value` format         | (constructed from userId, event) |

**Request Body Schema:**

```json
{
  "series": [
    {
      "metric": "segment.order_completed",
      "points": [[1704067200, 1.0]],
      "host": "string",
      "type": "count",
      "tags": ["userId:abc123", "event:Order Completed"]
    }
  ]
}
```

**Additional Notes:**

- V1 uses `[[timestamp_float, value_float]]` tuple arrays for points (not named objects like V2).
- Prefer V2 (`POST /api/v2/series`) for new implementations.

---

## Global Settings

Recommended destination-level settings:

1. **apiKey**

   - Type: password
   - Description: Datadog API Key. Found in Organization Settings → API Keys.
   - Required: Yes

2. **appKey**

   - Type: password
   - Description: Datadog Application Key. Required only for the Send Event V2 action. Found in Organization Settings → Application Keys.
   - Required: No

3. **site**
   - Type: string
   - Description: Your Datadog site region. Determines the base URL used for all API calls.
   - Required: No
   - Default: `datadoghq.com`

## Regional Endpoints

The API supports multiple regional sites via a configurable `site` parameter:

- **US1 (default):** `https://api.datadoghq.com`
- **US3:** `https://api.us3.datadoghq.com`
- **US5:** `https://api.us5.datadoghq.com`
- **AP1:** `https://api.ap1.datadoghq.com`
- **AP2:** `https://api.ap2.datadoghq.com`
- **EU1:** `https://api.datadoghq.eu`
- **US1-FED (GovCloud):** `https://api.ddog-gov.com`

Recommendation: Add a `site` selector field in destination settings. Construct the base URL as `https://api.${settings.site}`.

**Note for V2 Events:** Uses a different subdomain pattern: `https://event-management-intake.${settings.site}/api/v2/events`.

## Rate Limits

- **Metrics (V1/V2):** Max payload 500KB per request (5MB decompressed); max 3.2MB per request (62MB decompressed) for V1.
- **Logs (V2):** Max 5MB uncompressed per payload; max 1MB per individual log entry; max 1000 entries per array.
- **Events (V1/V2):** Max 18 hours old for timestamp; single event per request.
- Recommendation: Use batch mode for logs and metrics. Implement retry logic with exponential backoff for `429 Too Many Requests` responses.

## Implementation Notes

- **Batch Operations:** `POST /api/v2/logs` and `POST /api/v2/series` support batching (array body). Implement `performBatch` for these actions in addition to `perform`.
- **Error Handling:** Common errors: `400 Bad Request` (invalid payload), `403 Forbidden` (invalid API key), `429 Too Many Requests` (rate limit exceeded).
- **Timestamp Conversion:** Datadog V1 events and metrics expect POSIX epoch seconds (integer); V2 metrics also use epoch seconds; V2 events expect ISO 8601 string. Segment timestamps are ISO 8601 strings — convert as needed.
- **Tag Construction:** Build Datadog tags from Segment fields using the `key:value` format. Recommended tags: `userId:{userId}`, `anonymousId:{anonymousId}`, `event:{event}`, `email:{traits.email}`.
- **Metric Name Sanitization:** Datadog metric names must use dot-notation and contain only ASCII alphanumerics, underscores, and dots. Transform Segment event names (e.g. "Order Completed" → "segment.order_completed").
- **V2 Events Base URL:** Uses `event-management-intake.{site}` subdomain, not `api.{site}` — handle separately in the action.
- **API Documentation:** https://docs.datadoghq.com/api/latest/
- **API Support:** https://www.datadoghq.com/support/

## Next Steps

1. Review the recommended actions above
2. Shortlist 3-5 actions for initial implementation
3. Run `/openapi-implement` skill with your selections to generate the destination code
4. The generated code will be ~70-80% complete with clear TODOs for remaining work
