# Destination Generator Skills

This directory contains skills that automate the creation of Segment action-destinations from various sources (OpenAPI specs, website documentation, etc.).

## Overview

Building a new Segment destination typically involves:

- Manually analyzing API documentation
- Understanding authentication mechanisms
- Identifying suitable endpoints for actions
- Writing boilerplate TypeScript code
- Defining field mappings from Segment events to API schemas
- Setting up tests

These skills automate 70-80% of this process by:

1. Analyzing API documentation (OpenAPI specs or websites) to identify suitable actions
2. Generating TypeScript destination code with proper types and tests

## Skills

### 1. `/openapi-analyze` - Analyze OpenAPI Specification

**Purpose:** Parse an OpenAPI spec, identify suitable actions, and generate a comprehensive analysis document.

**Best for:** APIs with published OpenAPI 2.0/3.x specifications

**Usage:**

```
/openapi-analyze
```

**What it does:**

1. Prompts for OpenAPI spec location (URL or file path)
2. Parses the OpenAPI specification
3. Analyzes authentication methods
4. Identifies high/medium/low priority action candidates
5. Extracts field mappings and schemas
6. Generates a detailed analysis document

**Output:**

- Analysis document saved to: `packages/destination-actions/.claude/openapi-analyses/[api-name]-analysis.md`
- Contains authentication setup, recommended actions, field mappings, and implementation notes

**Next Step:** Review the analysis document and shortlist 3-5 actions to implement.

---

### 2. `/web-analyze` - Analyze Website Documentation

**Purpose:** Parse API documentation from a website, identify suitable actions, and generate a comprehensive analysis document.

**Best for:** APIs without OpenAPI specs but with good website documentation

**Usage:**

```
/web-analyze
```

**What it does:**

1. Prompts for API documentation URL(s)
2. Fetches and analyzes the documentation pages
3. Extracts authentication methods, endpoints, and field schemas
4. Identifies high/medium/low priority action candidates
5. Maps fields to Segment event patterns
6. Generates a detailed analysis document (same format as OpenAPI analysis)

**Output:**

- Analysis document saved to: `packages/destination-actions/.claude/openapi-analyses/[api-name]-analysis.md`
- Contains authentication setup, recommended actions, field mappings, and implementation notes

**Next Step:** Review and verify the analysis document, then shortlist 3-5 actions to implement.

**Note:** Web-based analysis may require more manual verification than OpenAPI-based analysis.

---

### 3. `/implement-destination` - Generate Destination Code

**Purpose:** Generate complete destination code from any analysis document (OpenAPI or web-based) and user-selected actions.

**Works with:** Analysis documents from `/openapi-analyze` or `/web-analyze`

**Usage:**

```
/implement-destination
```

**What it does:**

1. Prompts for analysis document path (from either analysis skill)
2. Prompts for destination name and slug
3. Prompts for selected actions to implement
4. Generates complete destination structure:
   - Destination `index.ts` with authentication
   - Action files with field definitions
   - TypeScript type placeholders
   - Basic test files
   - Implementation notes with TODOs

**Output:**

- Complete destination at: `packages/destination-actions/src/destinations/[slug]/`
- Generated TypeScript types
- Test files for destination and actions
- `IMPLEMENTATION_NOTES.md` with TODOs

**Next Step:** Review generated code, complete TODOs, and test with real API credentials.

## Workflow Example

### Step 1: Analyze the API

Choose the appropriate analysis skill:

**Option A: OpenAPI Specification**

```bash
/openapi-analyze
```

When prompted:

- Provide OpenAPI spec URL or file path
- Wait for analysis to complete
- Review the generated analysis document

**Option B: Website Documentation**

```bash
/web-analyze
```

When prompted:

- Provide API documentation URL(s)
- Provide API name
- Wait for analysis to complete
- Review and verify the generated analysis document

### Step 2: Review Analysis

Open the analysis document:

```bash
packages/destination-actions/.claude/openapi-analyses/your-api-analysis.md
```

Review:

- Authentication requirements
- High-priority action recommendations
- Field mappings
- Batch support

Shortlist 3-5 actions you want to implement.

### Step 3: Generate Code

```bash
# Run the implement skill
/implement-destination
```

When prompted:

- Provide the analysis document path
- Enter destination name (e.g., "Acme Marketing")
- Confirm or customize the slug (e.g., "acme-marketing")
- List the selected actions (comma-separated)

### Step 4: Complete Implementation

1. Navigate to the generated destination:

   ```bash
   cd packages/destination-actions/src/destinations/[your-slug]
   ```

2. Review the generated code:

   ```bash
   cat index.ts
   cat */index.ts
   ```

3. Generate TypeScript types:

   ```bash
   ./bin/run generate:types --path packages/destination-actions/src/destinations/[your-slug]/index.ts
   ```

4. Build the project:

   ```bash
   yarn build
   ```

5. Fix any TypeScript errors

6. Review `IMPLEMENTATION_NOTES.md` and complete TODOs:

   - Implement `testAuthentication` logic
   - Verify field mappings
   - Add error handling
   - Customize complex transformations

7. Run tests:

   ```bash
   yarn test packages/destination-actions/src/destinations/[your-slug]
   ```

8. Test with real API credentials

## Generated File Structure

```
packages/destination-actions/src/destinations/[slug]/
├── index.ts                       # Destination definition
├── generated-types.ts             # Auto-generated TypeScript types
├── IMPLEMENTATION_NOTES.md        # TODOs and next steps
├── __tests__/
│   └── index.test.ts             # Destination tests
├── [action-1]/
│   ├── index.ts                  # Action definition
│   ├── generated-types.ts        # Action types
│   └── __tests__/
│       └── index.test.ts         # Action tests
└── [action-2]/
    └── ... (same structure)
```

## What Gets Automated

✅ **Fully Automated (70-80%):**

- Destination file structure
- Authentication configuration
- Action definitions
- Field definitions with types
- Default field mappings (e.g., `$.userId`, `$.traits.email`)
- Basic test scaffolding
- TypeScript type generation

⚠️ **Requires Manual Completion (20-30%):**

- Test authentication logic (may need specific endpoint)
- Complex data transformations
- API-specific error handling
- Conditional field logic
- Custom validation
- Rate limiting
- Retry logic

## Tips

### For Analysis

- **Use Official OpenAPI Specs:** The more complete the spec, the better the analysis
- **Check for Batch Endpoints:** Look for `/batch` or `/bulk` paths
- **Review Auth Carefully:** Ensure the detected auth scheme matches your API
- **Consider Regional Endpoints:** Note if the API has multiple regions

### For Implementation

- **Start Small:** Implement 3-5 core actions first
- **Test Incrementally:** Test each action as you complete it
- **Review Field Mappings:** Ensure Segment event paths match your data model
- **Read Existing Destinations:** Look at similar destinations in the codebase for patterns
- **Check API Docs:** OpenAPI specs may not capture all nuances

### Common Issues

**Issue:** TypeScript errors after generation
**Solution:** Run `./bin/run generate:types` and rebuild

**Issue:** Authentication test not working
**Solution:** Check `IMPLEMENTATION_NOTES.md` for TODO - may need to implement custom logic

**Issue:** Field mappings don't match my data
**Solution:** Customize the `default` paths in action field definitions

**Issue:** API requires complex transformation
**Solution:** Add custom logic in the `perform` function - TODOs mark these areas

## Supported Authentication Schemes

| OpenAPI Scheme    | Segment Scheme  | Generated Code         |
| ----------------- | --------------- | ---------------------- |
| `apiKey` (header) | `custom`        | API key in header      |
| `apiKey` (query)  | `custom`        | API key in query param |
| `http` (basic)    | `basic`         | Username/password      |
| `http` (bearer)   | `custom`        | Bearer token           |
| `oauth2`          | `oauth-managed` | Managed OAuth flow     |

## Examples

### Example 1: Analyzing an API with OpenAPI Spec

```bash
/openapi-analyze
```

Input: `https://api.example.com/openapi.json`

Output: `packages/destination-actions/.claude/openapi-analyses/example-api-analysis.md`

### Example 2: Analyzing an API from Website Docs

```bash
/web-analyze
```

Inputs:

- Documentation URL: `https://docs.example.com/api-reference`
- API Name: `Example API`

Output: `packages/destination-actions/.claude/openapi-analyses/example-api-analysis.md`

### Example 3: Implementing from Analysis

```bash
/implement-destination
```

Inputs:

- Analysis: `packages/destination-actions/.claude/openapi-analyses/example-api-analysis.md`
- Name: `Example API`
- Slug: `example-api` (auto-suggested)
- Actions: `trackEvent, identifyUser, updateProfile`

Output: Complete destination at `packages/destination-actions/src/destinations/example-api/`

## Reference

### Key Files in Codebase

**Destination Examples:**

- `packages/destination-actions/src/destinations/courier/` - Custom auth with regions
- `packages/destination-actions/src/destinations/attio/` - OAuth-managed
- `packages/destination-actions/src/destinations/apolloio/` - Good action examples

**Core Types:**

- `packages/core/src/destination-kit/index.ts` - DestinationDefinition, ActionDefinition
- `packages/core/src/destination-kit/types.ts` - InputField, field types

**Testing:**

- `packages/actions-core/src/create-test-integration.ts` - Test utilities

## Limitations

1. **Complex Auth Flows:** Multi-step OAuth or custom token refresh requires manual implementation
2. **Advanced Schemas:** `allOf`, `oneOf`, `anyOf` are simplified - may need refinement
3. **Dynamic Fields:** Cannot auto-generate fields that depend on API calls
4. **Error Mapping:** API-specific error codes not automatically mapped
5. **OpenAPI 2.0:** Best results with OpenAPI 3.x (2.0 supported but may be less accurate)

## Future Enhancements

- Interactive field mapping refinement
- Preview generated code before writing
- Integration test generation with realistic mocks
- Documentation generation for Segment docs site
- Support for more complex auth patterns

## Support

If you encounter issues or have suggestions:

1. Check `IMPLEMENTATION_NOTES.md` in generated destinations
2. Review existing destinations for patterns
3. Consult OpenAPI specification for API details
4. Ask for help with specific TODO items

---

**Happy Destination Building! 🚀**
