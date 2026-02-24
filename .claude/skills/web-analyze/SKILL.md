---
name: web-analyze
description: Analyze API documentation from a website and generate a destination implementation plan
version: 1.0.0
allowed-tools:
  - WebFetch
  - Read
  - Write
  - Bash
  - AskUserQuestion
disable-model-invocation: false
---

# Web Documentation Analyzer

This skill analyzes API documentation from websites and generates comprehensive implementation plans for Segment action-destinations. It produces the same standardized output format as `openapi-analyze`, making it compatible with `openapi-implement`.

## When to Use This Skill

Use `/web-analyze` when:

- ✅ The API doesn't have an OpenAPI specification
- ✅ You have links to API documentation website
- ✅ The docs are publicly accessible (not behind authentication)
- ✅ You want to analyze REST API documentation

## Instructions

### Step 1: Gather Documentation URLs

Ask the user for the API documentation location:

```
Where is the API documentation located? Please provide:
1. **Main API docs URL** (e.g., https://api.example.com/docs)
2. **Additional relevant pages** (optional - authentication, endpoints, etc.)
3. **API name** (e.g., "Acme Marketing API")
```

### Step 2: Fetch and Analyze Documentation

Use WebFetch to retrieve the documentation pages. For each URL provided:

1. **Fetch the main documentation page**
2. **Extract key information:**
   - API name and description
   - Base URL(s)
   - Authentication methods
   - Available endpoints
   - Request/response formats
   - Field descriptions

**What to Look For:**

#### Authentication Section

Look for sections titled:

- "Authentication"
- "Getting Started"
- "API Keys"
- "Authorization"
- "OAuth"

Extract:

- Auth method (API key, OAuth, Basic auth, Bearer token)
- Where credentials go (header, query param)
- Field names (api_key, Authorization, etc.)
- How to obtain credentials

#### Endpoints/API Reference

Look for sections titled:

- "API Reference"
- "Endpoints"
- "Resources"
- "Methods"

For each endpoint, extract:

- HTTP method (POST, GET, PUT, PATCH, DELETE)
- Path (e.g., `/v1/events`)
- Purpose/description
- Request body schema
- Required vs optional fields
- Example requests/responses

#### Field Information

From request examples and descriptions, extract:

- Field names
- Field types (string, number, boolean, object, array)
- Whether required or optional
- Field descriptions
- Example values

### Step 3: Categorize Endpoints as Actions

Apply the same prioritization heuristics as `openapi-analyze`:

**Priority: HIGH**

- POST/PUT/PATCH endpoints
- Paths containing: `/events`, `/track`, `/identify`, `/users`, `/contacts`, `/leads`, `/customers`
- Endpoints that create or update user/event data
- Core tracking or identification functionality

**Priority: MEDIUM**

- General entity creation/updates
- List management, group/company endpoints
- Profile update endpoints

**Priority: LOW**

- GET endpoints (reads, not writes)
- DELETE endpoints
- Configuration/settings endpoints

### Step 4: Map to Segment Patterns

For each high/medium priority endpoint, determine:

1. **Segment Event Type:**

   - If it tracks events → `track`
   - If it creates/updates user profiles → `identify`
   - If it manages groups/companies → `group`

2. **Default Subscription:**

   - Track events: `type = "track"`
   - Identify: `type = "identify"`
   - Group: `type = "group"`
   - Specific events: `type = "track" and event = "Order Completed"`

3. **Field Mappings:**

   - Map API field names to Segment event paths
   - Suggest defaults based on semantic meaning:
     - User IDs → `$.userId`
     - Email → `$.traits.email` or `$.properties.email`
     - Event name → `$.event`
     - Timestamp → `$.timestamp`
     - Properties → `$.properties`

4. **Batch Support:**
   - Check if API accepts arrays of items
   - Look for `/batch` or `/bulk` endpoints
   - Check documentation for batch operations

### Step 5: Generate Analysis Document

Generate a markdown document following the **Standard Analysis Format** (see `.claude/skills/openapi-implement/analysis-format.md`).

**File location:** `packages/destination-actions/.claude/openapi-analyses/[api-slug]-analysis.md`

**Important:** Use the exact format specified in `analysis-format.md` so that `openapi-implement` can consume it.

**Document Template:**

````markdown
# Website Destination Analysis: [API Name]

## Summary

- **API Name:** [from documentation]
- **Version:** [if mentioned, otherwise "Unknown"]
- **Base URL:** [from docs or examples]
- **Authentication:** [custom|basic|oauth2|oauth-managed]
- **Analysis Date:** [current date YYYY-MM-DD]
- **Analysis Source:** Website Documentation

## Authentication Setup

### Recommended Scheme: [custom|basic|oauth2|oauth-managed]

**Authentication Method:** [How auth works based on docs]

**Required Settings:**

1. **[fieldName]** (type: [string|password])
   - Description: [What this credential is]
   - Where to find: [Instructions from docs]
   - Applied as: [Header/query/etc with example]

**Test Authentication Endpoint:**

- Endpoint: `GET [endpoint]`
- Purpose: [What it returns]
- Fallback: TODO - Manual identification needed [if not found in docs]

## Recommended Actions

### Priority: High

#### 1. [Action Name] - [One-line summary]

- **Endpoint:** `[METHOD] [path]`
- **Operation ID:** [generate from path, e.g., trackEvent]
- **Purpose:** [From docs description]
- **Segment Event Type:** [track|identify|group]
- **Default Subscription:** `type = "[track|identify|group]"`
- **Batch Support:** [Yes|No based on docs]
- **Reasoning:** [Why high priority]

**Field Mappings:**

| Field Name | Type   | Required | Description | Suggested Default Path |
| ---------- | ------ | -------- | ----------- | ---------------------- | -------- |
| [field]    | [type] | [Yes     | No]         | [from docs]            | [$.path] |

**Request Body Schema:**

```json
{
  [schema extracted or inferred from examples]
}
```
````

**Additional Notes:**

- [Any special considerations from docs]

[Repeat for each action]

### Priority: Medium

[Medium priority actions]

### Priority: Low

[Low priority actions]

## Global Settings

[If applicable]

## Regional Endpoints

[If docs mention multiple regions]

## Rate Limits

[If mentioned in docs]

## Implementation Notes

- **Batch Operations:** [Recommendations]
- **Error Handling:** [From docs if available]
- **Special Considerations:** [Any quirks noted in docs]
- **API Documentation:** [Links to docs]
- **API Support:** [Support contact if mentioned]

## Next Steps

1. Review the recommended actions above
2. Shortlist 3-5 actions for initial implementation
3. Run `/openapi-implement` skill with your selections to generate the destination code
4. The generated code will be ~70-80% complete with clear TODOs for remaining work

```

### Step 6: Handle Missing Information

Documentation may be incomplete. When information is missing:

**For Authentication:**
- If auth method unclear, ask user or mark TODO
- Suggest common patterns (API key in header is most common)

**For Field Types:**
- Infer from example values:
  - `"string"` → string
  - `123` → integer
  - `12.34` → number
  - `true` → boolean
  - `{"key": "value"}` → object
  - `["item1", "item2"]` → string[] or object[]
- If unclear, default to `string` and add note

**For Required Fields:**
- Check for "required" or "optional" labels in docs
- Look for asterisks (*) or other required indicators
- Check if field appears in all examples
- If unclear, mark as not required (safer default)

**For Base URL:**
- Look in examples
- Check for base URL in getting started
- Look for server/host information
- If multiple environments (sandbox/production), use production

### Step 7: Present Results

Show the user:

1. **Summary of findings:**
   - API name
   - Authentication method
   - Number of actions found (by priority)
   - Base URL

2. **Where analysis was saved:**
   `packages/destination-actions/.claude/openapi-analyses/[slug]-analysis.md`

3. **Any uncertainties or TODOs:**
   List any information that couldn't be determined from docs

4. **Next steps:**
   - Review the analysis document
   - Verify extracted information against docs
   - Shortlist actions to implement
   - Run `/openapi-implement` to generate code

## Tips for Effective Analysis

### Reading Documentation

1. **Start with Getting Started / Overview**
   - Understand the API's purpose
   - Find base URL
   - Identify auth method

2. **Read Authentication Section Carefully**
   - Note exact header names
   - Check for token prefixes (Bearer, Token, etc.)
   - Find instructions for obtaining credentials

3. **Scan API Reference**
   - Identify write operations (POST/PUT/PATCH)
   - Look for user/event-related endpoints
   - Note batch endpoints

4. **Study Examples**
   - Extract field names from example requests
   - Infer field types from example values
   - Identify required vs optional fields

### Handling Common Patterns

**Pattern: API Key in Header**
```

Authentication: custom
Field: apiKey (password)
Applied as: "Authorization: Bearer {apiKey}"

```

**Pattern: Multiple Auth Options**
- Choose the simplest (usually API key)
- Note alternatives in Implementation Notes

**Pattern: Versioned API**
- Include version in base URL
- Note version in analysis

**Pattern: Regional Endpoints**
- List all regions
- Recommend region selector field

### Dealing with Incomplete Docs

- Mark missing information as TODO
- Make reasonable assumptions (note them)
- Suggest user verify against actual API
- Prioritize what can be determined confidently

### Common API Documentation URLs to Check

If user provides just a homepage, suggest checking:
- `/docs`
- `/api-reference`
- `/developers`
- `/documentation`
- `/api/docs`
- `/v1/docs` or `/v2/docs`

## Example Workflow

**User provides:**
- Main URL: `https://docs.acme.com/api`
- API Name: "Acme Marketing"

**Skill actions:**

1. Fetch `https://docs.acme.com/api`
2. Look for authentication section → Find "API key in Authorization header"
3. Look for endpoints → Find `/v1/events` (POST), `/v1/users` (POST), `/v1/users/{id}` (PUT)
4. Extract field schemas from examples
5. Prioritize:
   - High: Track Events (`POST /v1/events`)
   - High: Identify User (`POST /v1/users`)
   - Medium: Update User (`PUT /v1/users/{id}`)
6. Generate analysis document
7. Present findings to user

## Quality Checklist

Before saving the analysis document, verify:

- [ ] Authentication section is complete
- [ ] At least one high-priority action identified
- [ ] Each action has: endpoint, method, event type, subscription
- [ ] Field mappings table exists for each action
- [ ] Field types are standard (string, integer, number, boolean, object, datetime)
- [ ] Base URL is present
- [ ] Batch support is determined (Yes/No)
- [ ] Document follows standard analysis format
- [ ] Links to original docs are included

## Error Handling

**If documentation is not accessible:**
- Report error to user
- Ask for alternative URL or credentials
- Suggest checking if docs are public

**If documentation is in unsupported format:**
- Try to extract what's possible
- Ask user for specific pages
- Suggest using OpenAPI spec if available

**If API is not REST:**
- Inform user this skill is for REST APIs
- Suggest alternatives (GraphQL, SOAP, etc. would need different approach)

## Limitations

- ✗ Cannot access documentation behind authentication
- ✗ May miss information across multiple pages
- ✗ Cannot interact with dynamic API explorers
- ✗ Inferred field types may need verification
- ✗ Complex authentication flows may need manual review

## Advantages Over OpenAPI

- ✓ Works when no OpenAPI spec exists
- ✓ Can extract documentation-specific context
- ✓ May capture best practices from docs
- ✓ Includes human-written descriptions

## Notes

- This skill produces the **same format** as `openapi-analyze`
- Output is **compatible** with `openapi-implement`
- Analysis may require **more manual review** than OpenAPI-based analysis
- User should **verify** extracted information against actual API behavior
```
