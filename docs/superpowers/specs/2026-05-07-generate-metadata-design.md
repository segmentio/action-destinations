# Design: Replace generate:metadata-payload with Public Metadata Schema

**Date:** 2026-05-07  
**Status:** Approved  
**Scope:** `packages/cli/src/commands/generate/metadata-payload.ts` + its tests

---

## Goal

Replace the existing `generate:metadata-payload` CLI command with a new implementation that outputs a clean, public-facing `metadata.json` schema instead of the current control-plane-shaped payload. The bot service (`action-destinations-bot`) reads this file and transforms it using private knowledge of the control plane API — no internal field structures are exposed in the public repo.

---

## What Changes

### File locations (unchanged)

- **Command**: `packages/cli/src/commands/generate/metadata-payload.ts`
- **Tests**: `packages/cli/src/__tests__/generate-metadata-payload.test.ts`
- **Invocation**: `./bin/run generate:metadata-payload` (unchanged), root yarn script `generate:metadata-payload` (unchanged)

### Output file location (unchanged)

Each destination's source directory: e.g. `packages/destination-actions/src/destinations/amplitude/metadata.json`

---

## New Output Schema

```typescript
interface PublicDestinationMetadata {
  slug: string
  name: string
  mode: 'cloud' | 'device' | 'warehouse'
  description: string | undefined
  authentication: {
    scheme: string
    fields: Record<string, PublicAuthField>
  } | null
  audienceConfig: {
    mode: AudienceConfigMode // only the mode sub-object (type, full_audience_sync, etc.)
    audienceFields: Record<string, PublicAuthField>
  } | null
  actions: Record<string, PublicAction>
  presets: PublicPreset[]
}

interface PublicAuthField {
  label: string | undefined
  description: string | undefined
  type: string
  required: boolean // always boolean — conditional required objects become false
  choices: Array<{ label: string; value: unknown }> | null
  default: unknown
}

interface PublicAction {
  title: string
  description: string
  platform: 'cloud' | 'web'
  defaultSubscription: string | null
  hidden: boolean
  hasPerformBatch: boolean
  syncMode: { default: string; supportedModes: string[] } | null
  hooks: string[] // list of hook type names present (e.g. ['onMappingSave'])
  fields: Record<string, PublicActionField>
}

interface PublicActionField {
  label: string | undefined
  description: string | undefined
  type: string
  required: boolean
  multiple: boolean
  allowNull: boolean
  dynamic: boolean // always boolean (functions normalized to true)
  default: unknown
  choices: Array<{ label: string; value: unknown }> | null
  placeholder: string | null
  properties: Record<string, PublicActionField> | null // nested schema for type=object
  category: string | null
  depends_on: unknown
  readOnly: boolean
  hidden: boolean // from unsafe_hidden
  minimum: number | null
  maximum: number | null
  defaultObjectUI: string | null
  disabledInputMethods: string[] | null
}

interface PublicPreset {
  name: string
  type: string | undefined
  partnerAction: string
  subscribe: string
  mapping: Record<string, unknown>
  eventSlug: string | null
}
```

---

## Serialization Rules

### Authentication / Settings

- **Cloud destinations**: source from `definition.authentication.fields`
- **Browser destinations**: source from `(definition as BrowserDestinationDefinition).settings`
- Strip all non-data fields: `testAuthentication`, validators, encrypt, private, scope, tags
- `required`: if `schema.required === true` → `true`; otherwise → `false` (conditional required objects are a control-plane concern, dropped here)
- `choices`: normalize `string[]` to `Array<{ label, value }>` (same as today)

### Actions (keyed object, not sorted array)

- Key = action slug (the key in `definition.actions`)
- `platform`: default `"cloud"` unless `action.platform === 'web'`
- `hasPerformBatch`: `typeof action.performBatch === 'function'`
- `syncMode`: `{ default: syncMode.default, supportedModes: syncMode.choices.map(c => c.value) }` or `null`
- `hooks`: `Object.keys(action.hooks ?? {}).filter(k => hookTypeStrings.includes(k))`

### Action Fields (keyed object, not array)

- Key = field key
- `dynamic`: `typeof field.dynamic === 'function' ? true : field.dynamic ?? false`
- `properties`: if `field.type === 'object' && field.properties`, serialize each property recursively with the same `PublicActionField` shape; otherwise `null`
- `hidden`: from `field.unsafe_hidden ?? false`
- Drop the following (control-plane-only): `fieldSchema` (JSON Schema), `displayMetadata`, `hookInputFieldType`, `category` used for `hashedPII` description mutation (plain `category` value is passed through unchanged)
- Do NOT append the "If not hashed, Segment will hash this value." suffix — that's a control-plane display concern
- No auto-injected fields: `enable_batching`, `__segment_internal_sync_mode`, `__segment_internal_matching_key` are NOT added

### AudienceConfig

- `null` if `definition.audienceConfig` is absent
- Otherwise: `{ mode: audienceConfig.mode, audienceFields: serialized audienceFields }`
- Strip functions: `createAudience`, `getAudience`, `updateAudience`, `createAudienceBatch`

### Presets

Passed through as-is from `definition.presets ?? []`. No sorting. Each preset includes `partnerAction`, `name`, `subscribe`, `mapping ?? {}`, `type`, `eventSlug ?? null`.

---

## What's Removed Compared to Old Command

| Old field                                                         | Reason removed                                 |
| ----------------------------------------------------------------- | ---------------------------------------------- |
| `basicOptions`                                                    | Control-plane API shape                        |
| `options` (with validators, encrypt, private, scope, tags)        | Control-plane API shape                        |
| `platforms` object                                                | Bot infers from action `platform` field        |
| `supportedRegions`                                                | Internal control-plane config                  |
| `supportsAudiences`                                               | Bot derives from `audienceConfig` presence     |
| `authenticationScheme` top-level                                  | Now nested under `authentication.scheme`       |
| Auto-injected fields (`enable_batching`, sync mode, matching key) | Bot responsibility                             |
| `fieldSchema` (JSONSchema4)                                       | Bot generates this from the public field shape |
| `displayMetadata`                                                 | Internal UI metadata, bot concern              |
| `hookInputFieldType` on fields                                    | Bot uses `hooks[]` list instead                |
| hashedPII description mutation                                    | Bot display concern                            |

---

## Command Behavior (Unchanged)

- `--slug <slug>` (multiple allowed): filter to specific destinations
- Default: process all destinations from manifest
- `resolveSourceDir()` utility: unchanged, stays as exported helper
- Writes `metadata.json` with 2-space indentation via `fs-extra`
- Gracefully skips destinations where `resolveSourceDir` returns null
- Continues processing after per-destination errors (catches and warns)

---

## Tests

Fully rewrite `generate-metadata-payload.test.ts` to match the new schema. Key cases:

1. **Top-level shape**: slug, name, mode, description all present
2. **Auth fields**: cloud auth fields serialized correctly; `required` boolean flattening
3. **Browser settings**: `settings` used as auth fields for device-mode destinations
4. **Conditional required → false**: conditional required object serialized as `false`
5. **Action field shape**: keyed object, all PublicActionField fields present
6. **`hasPerformBatch`**: true when `performBatch` defined, false otherwise
7. **`syncMode`**: present when defined, null otherwise
8. **`hooks`**: correct list extracted from action.hooks keys
9. **`dynamic` normalization**: function → `true`, boolean passthrough
10. **`properties`**: nested object fields serialized recursively
11. **AudienceConfig**: functions stripped, mode + audienceFields present
12. **Presets passthrough**: mapping, type, eventSlug all present
13. **No auto-injected fields**: `enable_batching`, sync mode, matching key absent
14. **Command E2E**: slug filtering, source dir resolution, writeJson calls (same mock pattern as today)

---

## Migration Notes

- The root yarn script `generate:metadata-payload` continues to work unchanged
- The `generateDestinationPayload` export is renamed to `generatePublicMetadata` (breaking export change — only tests import it directly)
- `resolveSourceDir` export stays as-is
