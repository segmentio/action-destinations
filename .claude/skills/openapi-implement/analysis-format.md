# Standard Analysis Format

This document defines the standard analysis format that both `openapi-analyze` and `web-analyze` skills produce, and that `openapi-implement` consumes.

## Purpose

By standardizing the analysis output format, we enable multiple analysis sources (OpenAPI specs, website documentation, API explorers, etc.) to feed into the same implementation generator.

## Format Specification

### File Location

`packages/destination-actions/.claude/openapi-analyses/[api-slug]-analysis.md`

**Note:** Despite the directory name "openapi-analyses", this directory stores analyses from all sources (OpenAPI, web docs, etc.).

### Document Structure

````markdown
# [Source] Destination Analysis: [API Name]

## Summary

- **API Name:** [Name of the API/service]
- **Version:** [API version if known, or "Unknown"]
- **Base URL:** [Base URL for API calls]
- **Authentication:** [custom|basic|oauth2|oauth-managed]
- **Analysis Date:** [YYYY-MM-DD]
- **Analysis Source:** [OpenAPI Spec|Website Documentation|Manual]

## Authentication Setup

### Recommended Scheme: [custom|basic|oauth2|oauth-managed]

**Authentication Method:** [Description of how auth works]

**Required Settings:**

1. **[fieldName]** (type: [string|password])
   - Description: [What this field is]
   - Where to find: [Instructions for user to obtain this credential]
   - Applied as: [How it's used - e.g., "Bearer token in Authorization header"]

**Test Authentication Endpoint:**

- Endpoint: `GET [endpoint path]`
- Purpose: [What it returns - e.g., "Returns current user information"]
- Fallback: TODO - Manual identification needed [if not found]

## Recommended Actions

### Priority: High

#### N. [Action Name] - [One-line summary]

- **Endpoint:** `[METHOD] [path]`
- **Operation ID:** [operationId or generated name]
- **Purpose:** [What this action does]
- **Segment Event Type:** [track|identify|group]
- **Default Subscription:** `type = "[track|identify|group]"` [with any additional filters]
- **Batch Support:** [Yes|No]
- **Reasoning:** [Why this is high priority]

**Field Mappings:**

| Field Name  | Type    | Required | Description | Suggested Default Path |
| ----------- | ------- | -------- | ----------- | ---------------------- | ------ | --------- | ---- | --- | ------------- | ----------------- |
| [fieldName] | [string | integer  | number      | boolean                | object | datetime] | [Yes | No] | [Description] | [$.path.to.field] |

**Request Body Schema:**

```json
{
  "field1": "string",
  "field2": "integer",
  "nested": {
    "field3": "boolean"
  }
}
```
````

**Additional Notes:**

- [Any special considerations, nested objects, transformations needed]

[Repeat for each action]

### Priority: Medium

[Medium-priority actions with same structure]

### Priority: Low

[Low-priority actions with same structure]

## Global Settings

[Optional section if there are destination-level settings]

Recommended destination-level settings:

1. **[settingName]**
   - Type: [string|boolean|integer]
   - Description: [Purpose of this setting]
   - Required: [Yes|No]
   - Default: [default value if applicable]

## Regional Endpoints

[Optional section if API has multiple regions]

The API supports multiple regions:

- **US:** [url]
- **EU:** [url]
- **[Region]:** [url]

Recommendation: Add a region selector field in authentication.

## Rate Limits

[Optional section if rate limit info available]

- [Rate limit details]
- Recommendation: [Batching or throttling suggestions]

## Implementation Notes

- **Batch Operations:** [Which actions should support batching]
- **Error Handling:** [Common error responses]
- **Special Considerations:** [Edge cases, data transformations]
- **API Documentation:** [Link to official docs]
- **API Support:** [Support contact if available]

## Next Steps

1. Review the recommended actions above
2. Shortlist 3-5 actions for initial implementation
3. Run `/openapi-implement` skill with your selections to generate the destination code
4. The generated code will be ~70-80% complete with clear TODOs for remaining work

````

## Field Requirements

### Summary Section (Required)
- **API Name:** Must be present
- **Base URL:** Must be present (implementation needs this)
- **Authentication:** Must be one of: custom, basic, oauth2, oauth-managed
- **Analysis Date:** Should be current date
- **Analysis Source:** Helps track where analysis came from

### Authentication Setup (Required)
- Must specify scheme (custom/basic/oauth2/oauth-managed)
- Must list required credential fields with types
- Should suggest test endpoint if possible
- Must describe how credentials are applied

### Recommended Actions (Required)
At least one action with:
- **Endpoint:** HTTP method + path (required for implementation)
- **Segment Event Type:** track, identify, or group (required)
- **Default Subscription:** Subscription pattern (required)
- **Batch Support:** Yes or No (affects code generation)
- **Field Mappings Table:** With columns: Field Name, Type, Required, Description, Suggested Default Path

### Optional Sections
- Global Settings
- Regional Endpoints
- Rate Limits
- Implementation Notes (recommended but optional)

## Field Type Values

Must use these exact values for the Type column in field mappings:

- `string` - Text field
- `integer` - Whole number
- `number` - Decimal number
- `boolean` - True/false
- `object` - Nested object (can have properties)
- `datetime` - ISO 8601 timestamp
- `string[]` or `object[]` - Arrays (implementation will use `multiple: true`)

## Suggested Default Path Format

Use JSONPath notation with `$` prefix:
- `$.userId` - Top-level user ID
- `$.traits.email` - Email in traits
- `$.properties.productId` - Property from track event
- `$.event` - Event name
- `$.timestamp` - Event timestamp
- `$.context.ip` - IP from context

Common patterns:
- User identifiers → `$.userId` or `$.anonymousId`
- Email → `$.traits.email` or `$.properties.email`
- Event name → `$.event`
- Timestamp → `$.timestamp`
- Profile attributes → `$.traits.[attribute]`
- Event properties → `$.properties.[property]`

## Validation Checklist

Before using an analysis document with `openapi-implement`:

- [ ] API Name is present
- [ ] Base URL is present
- [ ] Authentication scheme is specified (custom/basic/oauth2/oauth-managed)
- [ ] At least one authentication field is defined
- [ ] At least one action is defined
- [ ] Each action has: Endpoint, Segment Event Type, Default Subscription
- [ ] Each action has a field mappings table
- [ ] Field types use standard values (string, integer, etc.)
- [ ] Batch Support is specified for each action (Yes/No)

## Examples

### Example: Custom Auth (API Key)

```markdown
## Authentication Setup

### Recommended Scheme: custom

**Authentication Method:** API Key in Authorization header

**Required Settings:**
1. **apiKey** (type: password)
   - Description: Your Acme API key
   - Where to find: Available in your Acme dashboard under Settings > API Keys
   - Applied as: Bearer token in Authorization header

**Test Authentication Endpoint:**
- Endpoint: `GET /v1/account`
- Purpose: Returns current account information
````

### Example: OAuth2

```markdown
## Authentication Setup

### Recommended Scheme: oauth-managed

**Authentication Method:** OAuth 2.0 with authorization code flow

**Required Settings:**
[No additional fields required - managed by Segment]

**Test Authentication Endpoint:**

- Endpoint: `GET /v1/me`
- Purpose: Returns current user profile
```

### Example: Action with Batch

````markdown
#### 1. Track Event - Send custom event data

- **Endpoint:** `POST /v1/events`
- **Operation ID:** createEvent
- **Purpose:** Track custom events with properties
- **Segment Event Type:** track
- **Default Subscription:** `type = "track"`
- **Batch Support:** Yes
- **Reasoning:** Core tracking functionality, supports high-volume event ingestion

**Field Mappings:**

| Field Name | Type     | Required | Description             | Suggested Default Path |
| ---------- | -------- | -------- | ----------------------- | ---------------------- |
| userId     | string   | Yes      | Unique user identifier  | $.userId               |
| event      | string   | Yes      | Name of the event       | $.event                |
| timestamp  | datetime | No       | When the event occurred | $.timestamp            |
| properties | object   | No       | Event properties        | $.properties           |

**Request Body Schema:**

```json
{
  "user_id": "string",
  "event": "string",
  "timestamp": "2024-01-01T00:00:00Z",
  "properties": {
    "key": "value"
  }
}
```
````

```

## Tips for Analysis Authors

### For OpenAPI Analysis
- Extract exact field names from schemas
- Use operation summaries for descriptions
- Check for batch endpoints explicitly
- Include all required fields from schema

### For Web Documentation Analysis
- Look for API reference sections
- Check authentication/getting started guides
- Find example requests/responses
- Note any rate limits or best practices
- Extract field descriptions from docs

### General Tips
- Prioritize actions that align with Segment use cases (tracking, identification)
- Suggest realistic default paths based on field semantics
- Note when batch operations are available
- Include links to official documentation
- Mark TODOs clearly when information is missing
```
