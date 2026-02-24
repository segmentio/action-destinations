# Datadog Implementation Notes

**Generated:** 2026-02-24
**From Analysis:** packages/destination-actions/.claude/openapi-analyses/datadog-analysis.md

## Summary

This destination was generated from a Datadog OpenAPI specification analysis. The generated code provides ~70-80% of the implementation with clear TODOs for completion.

## Generated Files

- `index.ts` — Destination definition with custom authentication (API Key + Application Key + Site)
- `sendEventV2/index.ts` — Send Event V2 action: posts structured alert or change events to Datadog Event Management
- `sendEventV2/__tests__/index.test.ts` — Tests for sendEventV2
- `__tests__/index.test.ts` — Destination-level authentication tests

## Architecture Notes

### Special Base URL

The Datadog V2 Events endpoint uses a different subdomain than all other Datadog API endpoints:

- **All other endpoints:** `https://api.{site}/...`
- **V2 Events:** `https://event-management-intake.{site}/api/v2/events`

The action constructs the full URL using `settings.site` to handle this correctly. The `extendRequest` headers (including `DD-API-KEY` and `DD-APPLICATION-KEY`) still apply to these full-URL requests.

### Nested Request Schema

The Datadog V2 Events API has two levels of `attributes` nesting:

```
data.attributes.title          → top-level event attributes
data.attributes.attributes     → category-specific inner attributes
```

The action flattens this into user-friendly fields and reconstructs the nested structure in `perform`.

## TODO: Required Completions

### 1. Authentication

- [ ] Test `testAuthentication` with real Datadog credentials
- [ ] Confirm `GET /api/v1/validate` returns 200 with valid `DD-API-KEY` (no App Key needed for this endpoint)
- [ ] Verify `extendRequest` headers are applied correctly to the `event-management-intake.*` subdomain

### 2. sendEventV2 Action

- [ ] **Category validation:** Add runtime validation that required category-specific fields are present:
  - When `category = "alert"`: `alertStatus` must be provided
  - When `category = "change"`: `changedResourceName` and `changedResourceType` must be provided
- [ ] **Timestamp validation:** Datadog rejects events older than 18 hours — consider adding a check and appropriate error
- [ ] **Tag truncation:** Tags must be ≤200 characters each; consider truncating or logging a warning
- [ ] **Change event author:** Consider exposing `author` fields (name, type) for the `change` category
- [ ] **Change event impacted_resources:** Consider exposing impacted services list for the `change` category
- [ ] **Change event prev/new_value:** Consider exposing `prev_value`/`new_value` fields for the `change` category
- [ ] Review and test with real Datadog credentials

### 3. Testing

- [ ] Add tests that validate the request body for change events with `changed_resource`
- [ ] Add test for timestamp conversion (ensure ISO 8601 output)
- [ ] Add test for missing required category-specific fields (should throw error after validation TODO is done)
- [ ] Add integration test with real API (credentials required)

### 4. TypeScript Types

- [ ] Run the CLI type generator:
  ```bash
  ./bin/run generate:types --path packages/destination-actions/src/destinations/datadog/index.ts
  ```
  Then replace `generated-types.ts` files with the auto-generated versions.

## Next Steps

1. **Build and verify:**

   ```bash
   yarn build
   ```

2. **Run tests:**

   ```bash
   yarn jest packages/destination-actions/src/destinations/datadog
   ```

3. **Fix any TypeScript errors**, then complete the TODOs above.

4. **Test with real API:**
   - Obtain a Datadog API Key and Application Key
   - Configure a test workspace
   - Send test track events and verify they appear in Datadog Event Management

## API Documentation

- **API Reference:** https://docs.datadoghq.com/api/latest/events/
- **V2 Events:** https://docs.datadoghq.com/api/latest/events/#post-an-event
- **Authentication:** https://docs.datadoghq.com/api/latest/authentication/
- **Datadog Support:** https://www.datadoghq.com/support/
