---
name: openapi-analyze
description: Analyze an OpenAPI specification and generate a destination implementation plan with action recommendations
version: 1.0.0
allowed-tools:
  - WebFetch
  - Read
  - Write
  - Bash
  - AskUserQuestion
disable-model-invocation: false
---

# OpenAPI Destination Analyzer

This skill analyzes OpenAPI specifications (2.0/3.x) and generates comprehensive implementation plans for Segment action-destinations.

## Instructions

### Step 1: Gather OpenAPI Specification

Ask the user where their OpenAPI spec is located (URL or file path). If URL, use WebFetch to retrieve it. If file path, use Read to load it.

Validate that the content is a valid OpenAPI/Swagger specification by checking for:

- OpenAPI 3.x: `openapi` field starting with "3."
- OpenAPI 2.0: `swagger` field with value "2.0"

### Step 2: Parse OpenAPI Structure

Extract these key sections:

- `info` - API name, version, description
- `servers` (3.x) or `host` + `basePath` (2.0) - Base URLs
- `paths` - All available endpoints
- `components.schemas` (3.x) or `definitions` (2.0) - Data models
- `securitySchemes` - Authentication methods
- `security` - Global security requirements

### Step 3: Analyze Authentication

Map OpenAPI security schemes to Segment authentication schemes:

**OpenAPI → Segment Mapping:**

- `apiKey` in header → `custom` auth with string field
- `apiKey` in query → `custom` auth (note: less common, may need manual setup)
- `http` with scheme `basic` → `basic` auth
- `http` with scheme `bearer` → `custom` auth with password field
- `oauth2` → `oauth2` or `oauth-managed` auth (recommend oauth-managed for simplicity)

Extract required credential field names and descriptions.

**Find Test Endpoint:**
Look for authentication test endpoints in paths:

- `/me`, `/user`, `/account`, `/profile`
- `/auth/verify`, `/token/verify`, `/validate`
- Any GET endpoint that requires authentication and returns user/account info

### Step 4: Identify Action Candidates

Scan all endpoints in `paths` and prioritize using these heuristics:

**Priority: HIGH**

- HTTP methods: POST, PUT, PATCH
- Path patterns: `/events`, `/track`, `/identify`, `/users`, `/contacts`, `/leads`, `/customers`
- OperationIds: containing track, send, create, update, identify, upsert
- Request bodies accepting user data, event data, or profile data
- Endpoints that create or modify entities

**Priority: MEDIUM**

- POST endpoints for general entity creation
- PUT/PATCH for entity updates
- List/audience management endpoints
- Group or company endpoints

**Priority: LOW**

- GET endpoints (query operations)
- DELETE endpoints (may be useful for some use cases)
- Configuration/settings endpoints
- Webhook registration

**Batch Support Detection:**

- Request body schema type is `array`
- Path or operationId contains: `/batch`, `/bulk`, `batch`, `bulk`
- Description mentions batch operations

For each recommended action, note:

- Endpoint path and HTTP method
- Operation ID and summary
- Suggested Segment event type (track/identify/group)
- Default subscription pattern
- Whether batch is supported

### Step 5: Extract Field Mappings

For each action's request body schema, map OpenAPI types to Segment field types:

**Type Mapping:**

- `string` → `string`
- `string` with `format: email` → `string` (but note email validation)
- `string` with `format: date-time` → `datetime`
- `string` with `format: date` → `datetime`
- `string` with `format: uri` → `string`
- `integer` → `integer`
- `number` → `number`
- `boolean` → `boolean`
- `object` → `object` with properties
- `array` → `string` with `multiple: true` or `object` with `multiple: true`
- `enum` → `string` with `choices` array

**Required Fields:**

- Map `required` arrays from schema to `required: true` in fields

**Default Value Suggestions:**
Suggest Segment default paths based on field names:

- `email`, `user_email` → `$.traits.email` or `$.properties.email`
- `userId`, `user_id`, `external_id` → `$.userId`
- `timestamp`, `created_at`, `occurred_at` → `$.timestamp`
- `event`, `event_name`, `event_type` → `$.event`
- `name`, `full_name` → `$.traits.name`
- `phone`, `phone_number` → `$.traits.phone`
- `properties`, `traits`, `attributes` → `$.properties` or `$.traits`

### Step 6: Generate Analysis Document

Create a markdown document at: `packages/destination-actions/.claude/openapi-analyses/[api-slug]-analysis.md`

The API slug should be derived from the API name (lowercase, hyphens instead of spaces).

**IMPORTANT:** Follow the **Standard Analysis Format** defined in `.claude/skills/openapi-implement/analysis-format.md` to ensure compatibility with `openapi-implement`. The format below is the OpenAPI-specific implementation of that standard.

**Document Structure:**

````markdown
# OpenAPI Destination Analysis: [API Name]

## Summary

- **API Name:** [from info.title]
- **Version:** [from info.version]
- **Base URL:** [from servers[0].url or host+basePath]
- **Authentication:** [recommended Segment scheme]
- **Analysis Date:** [current date]
- **Analysis Source:** OpenAPI Specification

## Authentication Setup

### Recommended Scheme: [custom|basic|oauth2|oauth-managed]

**OpenAPI Security Scheme:** [name and type from spec]

**Required Settings:**

1. **[fieldName]** (type: [string|password])
   - Description: [from security scheme description]
   - Where to find: [instructions for user]
   - Applied as: [header/query parameter details]

**Test Authentication Endpoint:**

- Endpoint: `GET [endpoint]`
- Purpose: [what it returns]
- Fallback: TODO - Manual identification needed

## Recommended Actions

### Priority: High

#### 1. [Action Name] - [One-line summary]

- **Endpoint:** `[METHOD] [path]`
- **Operation ID:** [operationId]
- **Purpose:** [description from OpenAPI]
- **Segment Event Type:** [track|identify|group]
- **Default Subscription:** `type = "[track|identify|group]"` [and additional filters if applicable]
- **Batch Support:** [Yes/No]
- **Reasoning:** [Why this is high priority]

**Field Mappings:**

| Field Name | Type   | Required | Description   | Suggested Default Path |
| ---------- | ------ | -------- | ------------- | ---------------------- |
| [field]    | [type] | [Yes/No] | [description] | [$.path]               |

**Request Body Schema:**

```json
[Pretty-printed JSON schema from OpenAPI]
```
````

**Additional Notes:**

- [Any special considerations, nested objects, arrays, etc.]

[Repeat for each high-priority action]

### Priority: Medium

[Medium-priority actions with same structure]

### Priority: Low

[Low-priority actions with same structure]

## Global Settings

[If there are common parameters across actions that should be destination-level settings]

Recommended destination-level settings:

1. **[settingName]**
   - Type: [string|boolean|etc]
   - Description: [purpose]
   - Required: [Yes/No]
   - Default: [if applicable]

## Regional Endpoints

[If multiple servers are detected or regions mentioned]

The API supports multiple regions:

- **US:** [url]
- **EU:** [url]
- **[Other]:** [url]

Recommendation: Add a region selector field in authentication.

## Rate Limits

[If rate limit information is available in OpenAPI extensions or descriptions]

- [Rate limit details]
- Recommendation: [Any batching or throttling suggestions]

## Implementation Notes

- **Batch Operations:** [Which actions should support batching]
- **Error Handling:** [Common error responses from OpenAPI]
- **Special Considerations:** [Edge cases, data transformations needed]
- **Dependencies:** [If actions depend on each other]

## Next Steps

1. Review the recommended actions above
2. Shortlist 3-5 actions for initial implementation
3. Run `/openapi-implement` skill with your selections to generate the destination code
4. The generated code will be ~70-80% complete with clear TODOs for remaining work

```

### Step 7: Present Results

After generating the analysis document, show the user:

1. A summary of findings:
   - Authentication method
   - Number of actions found (by priority)
   - Base URL and API name

2. Where the analysis was saved

3. Next steps:
   - Review the analysis document
   - Shortlist actions to implement
   - Run `/openapi-implement` to generate code

## Tips

- If the OpenAPI spec is malformed or unclear, ask the user for clarification
- When suggesting default paths, consider both track and identify event structures
- For complex nested schemas, flatten them into dot-notation fields where possible
- If you can't determine a good test authentication endpoint, explicitly mark it as TODO
- Prioritize actions that align with common Segment use cases (tracking events, updating user profiles)
- Look for batch endpoints specifically - they're valuable for high-volume use cases
```
