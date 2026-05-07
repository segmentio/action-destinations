# Generate Metadata Public Schema Replacement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the control-plane-shaped `generate:metadata-payload` command output with a clean public-facing `metadata.json` schema that exposes no internal API field structures.

**Architecture:** Rewrite `packages/cli/src/commands/generate/metadata-payload.ts` in-place — new TypeScript interfaces, new serialization helpers (`serializeAuthField`, `serializeActionField`, `serializeAction`, `generatePublicMetadata`), same command class I/O. The `resolveSourceDir` export is unchanged. Tests are fully rewritten to match the new schema.

**Tech Stack:** TypeScript, oclif (CLI framework), fs-extra (file I/O), Jest (tests). Key imports from `@segment/actions-core` and `@segment/destinations-manifest`.

---

### Task 1: Replace interfaces — remove old, add new

**Files:**

- Modify: `packages/cli/src/commands/generate/metadata-payload.ts`

Remove every interface/type defined in the current file above the `// ---- OAUTH constant ----` comment block (lines 22–93 in the current file: `DestinationMetadataOption`, `DestinationMetadataOptions`, `ActionFieldPayload`, `ActionPayload`, `DestinationPayload`).

Also remove the unused imports that only served those old types:

- `fieldsToJsonSchema` from `@segment/actions-core`
- `conditionsToJsonSchema` from `@segment/actions-core/destination-kit/fields-to-jsonschema`
- `ActionHookDefinition` from `@segment/actions-core/destination-kit`
- `JSONSchema4` from `json-schema`
- `sortBy` from `lodash`

Replace with the new public interfaces and keep only the imports they need.

- [ ] **Step 1: Open the file and delete the old interface block**

In `packages/cli/src/commands/generate/metadata-payload.ts`, replace everything from line 1 through the end of `interface DestinationPayload { ... }` (the closing `}` before `// ---- OAUTH constant ----`) with the following:

```typescript
import { Command, flags } from '@oclif/command'
import type {
  AudienceDestinationDefinition,
  DestinationDefinition as CloudDestinationDefinition
} from '@segment/actions-core'
import { hookTypeStrings } from '@segment/actions-core/destination-kit'
import type { BrowserDestinationDefinition } from '@segment/destinations-manifest'
import fs from 'fs-extra'
import path from 'path'
import ora from 'ora'
import { getManifest, DestinationDefinition, hasOauthAuthentication } from '../../lib/destinations'

// ---- Public output interfaces ----

export interface PublicAuthField {
  label: string | undefined
  description: string | undefined
  type: string
  required: boolean
  choices: Array<{ label: string; value: unknown }> | null
  default: unknown
}

export interface PublicActionField {
  label: string | undefined
  description: string | undefined
  type: string
  required: boolean
  multiple: boolean
  allowNull: boolean
  dynamic: boolean
  default: unknown
  choices: Array<{ label: string; value: unknown }> | null
  placeholder: string | null
  properties: Record<string, PublicActionField> | null
  category: string | null
  depends_on: unknown
  readOnly: boolean
  hidden: boolean
  minimum: number | null
  maximum: number | null
  defaultObjectUI: string | null
  disabledInputMethods: string[] | null
}

export interface PublicAction {
  title: string
  description: string
  platform: 'cloud' | 'web'
  defaultSubscription: string | null
  hidden: boolean
  hasPerformBatch: boolean
  syncMode: { default: string; supportedModes: string[] } | null
  hooks: string[]
  fields: Record<string, PublicActionField>
}

export interface PublicPreset {
  name: string
  type: string | undefined
  partnerAction: string
  subscribe: string
  mapping: Record<string, unknown>
  eventSlug: string | null
}

export interface PublicDestinationMetadata {
  slug: string
  name: string
  mode: string
  description: string | undefined
  authentication: { scheme: string; fields: Record<string, PublicAuthField> } | null
  audienceConfig: { mode: unknown; audienceFields: Record<string, PublicAuthField> } | null
  actions: Record<string, PublicAction>
  presets: PublicPreset[]
}
```

- [ ] **Step 2: Delete the OAUTH_OPTIONS block**

Delete the `const OAUTH_OPTIONS: DestinationMetadataOption = { ... }` block (lines 97–134 in the current file). It is not used in the new implementation.

- [ ] **Step 3: Verify TypeScript still compiles (errors expected — functions below still use old types)**

```bash
cd packages/cli && yarn typecheck 2>&1 | head -40
```

Expected: TypeScript errors referencing missing old types in the functions below — that is fine. We fix those in subsequent tasks.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/commands/generate/metadata-payload.ts
git commit -m "refactor: replace control-plane interfaces with public metadata types"
```

---

### Task 2: Implement `serializeAuthField`

**Files:**

- Modify: `packages/cli/src/commands/generate/metadata-payload.ts`

Replace the entire `getOptions()` function (and the helpers it calls: `getUIMetadataForTopLevelSetting`, `getFieldPropertySchema`, `getFieldPropertySchemaForHookDefinition`, `getDisplayMetadata`) with a single focused helper.

- [ ] **Step 1: Delete the four old helper functions**

Delete these functions from the file:

- `getFieldPropertySchema`
- `getFieldPropertySchemaForHookDefinition`
- `getDisplayMetadata`
- `getUIMetadataForTopLevelSetting`
- `getOptions`

- [ ] **Step 2: Add `serializeAuthField` and `serializeAuthFields`**

Insert after the interface block:

```typescript
function normalizeChoices(choices: unknown): Array<{ label: string; value: unknown }> | null {
  if (!Array.isArray(choices) || choices.length === 0) return null
  return choices.map((c: string | { label: string; value: unknown }) =>
    typeof c === 'string' ? { label: c, value: c } : c
  )
}

function serializeAuthField(schema: any): PublicAuthField {
  return {
    label: schema.label,
    description: schema.description,
    type: schema.type,
    required: schema.required === true,
    choices: normalizeChoices(schema.choices),
    default: schema.default ?? null
  }
}

function serializeAuthFields(fields: Record<string, any>): Record<string, PublicAuthField> {
  const result: Record<string, PublicAuthField> = {}
  for (const [key, schema] of Object.entries(fields)) {
    result[key] = serializeAuthField(schema)
  }
  return result
}
```

- [ ] **Step 3: Verify no compile errors in the new helpers**

```bash
cd packages/cli && yarn typecheck 2>&1 | grep "serializeAuthField\|normalizeChoices" | head -10
```

Expected: no errors referencing these new functions.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/commands/generate/metadata-payload.ts
git commit -m "refactor: add serializeAuthField helper for public auth field serialization"
```

---

### Task 3: Implement `serializeActionField`

**Files:**

- Modify: `packages/cli/src/commands/generate/metadata-payload.ts`

- [ ] **Step 1: Delete `buildActionFields`**

Delete the entire `buildActionFields(action: any): ActionFieldPayload[]` function from the file.

- [ ] **Step 2: Add `serializeActionField`**

Insert after `serializeAuthFields`:

```typescript
function serializeActionField(field: any): PublicActionField {
  let properties: Record<string, PublicActionField> | null = null
  if (field.type === 'object' && field.properties && typeof field.properties === 'object') {
    properties = {}
    for (const [propKey, propSchema] of Object.entries(field.properties as Record<string, any>)) {
      properties[propKey] = serializeActionField(propSchema)
    }
  }

  return {
    label: field.label,
    description: field.description,
    type: field.type,
    required: field.required === true,
    multiple: field.multiple ?? false,
    allowNull: field.allowNull ?? false,
    dynamic: typeof field.dynamic === 'function' ? true : field.dynamic ?? false,
    default: field.default ?? null,
    choices: normalizeChoices(field.choices),
    placeholder: field.placeholder ?? null,
    properties,
    category: field.category ?? null,
    depends_on: field.depends_on ?? null,
    readOnly: field.readOnly ?? false,
    hidden: field.unsafe_hidden ?? false,
    minimum: field.minimum ?? null,
    maximum: field.maximum ?? null,
    defaultObjectUI: field.defaultObjectUI ?? null,
    disabledInputMethods: field.disabledInputMethods ?? null
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/commands/generate/metadata-payload.ts
git commit -m "refactor: add serializeActionField helper for public action field serialization"
```

---

### Task 4: Implement `serializeAction`

**Files:**

- Modify: `packages/cli/src/commands/generate/metadata-payload.ts`

- [ ] **Step 1: Add `serializeAction`**

Insert after `serializeActionField`:

```typescript
function serializeAction(actionKey: string, action: any): PublicAction {
  const fields: Record<string, PublicActionField> = {}
  for (const [fieldKey, fieldDef] of Object.entries(action.fields ?? ({} as Record<string, any>))) {
    fields[fieldKey] = serializeActionField(fieldDef)
  }

  let syncMode: PublicAction['syncMode'] = null
  if (action.syncMode) {
    syncMode = {
      default: action.syncMode.default,
      supportedModes: (action.syncMode.choices ?? []).map((c: { value: string }) => c.value)
    }
  }

  const hooks: string[] = Object.keys(action.hooks ?? {}).filter((k) => hookTypeStrings.includes(k as any))

  return {
    title: action.title ?? actionKey,
    description: action.description ?? '',
    platform: action.platform === 'web' ? 'web' : 'cloud',
    defaultSubscription: action.defaultSubscription ?? null,
    hidden: action.hidden ?? false,
    hasPerformBatch: typeof action.performBatch === 'function',
    syncMode,
    hooks,
    fields
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/cli/src/commands/generate/metadata-payload.ts
git commit -m "refactor: add serializeAction helper"
```

---

### Task 5: Implement `generatePublicMetadata`

**Files:**

- Modify: `packages/cli/src/commands/generate/metadata-payload.ts`

- [ ] **Step 1: Delete `generateDestinationPayload`**

Delete the entire `generateDestinationPayload(slug, definition)` function.

- [ ] **Step 2: Add `generatePublicMetadata`**

Insert after `serializeAction`:

```typescript
export function generatePublicMetadata(slug: string, definition: DestinationDefinition): PublicDestinationMetadata {
  const cloudDef = definition as CloudDestinationDefinition
  const browserDef = definition as BrowserDestinationDefinition
  const audienceDef = definition as AudienceDestinationDefinition

  // Authentication fields: cloud uses authentication.fields, browser uses settings
  let authentication: PublicDestinationMetadata['authentication'] = null
  const authFields = cloudDef.authentication?.fields
  const browserSettings = browserDef.settings
  const rawFields = authFields ?? browserSettings
  if (rawFields && Object.keys(rawFields).length > 0) {
    authentication = {
      scheme: cloudDef.authentication?.scheme ?? 'custom',
      fields: serializeAuthFields(rawFields)
    }
  }

  // audienceConfig: strip functions, keep mode + audienceFields
  let audienceConfig: PublicDestinationMetadata['audienceConfig'] = null
  if (audienceDef.audienceConfig) {
    audienceConfig = {
      mode: audienceDef.audienceConfig.mode,
      audienceFields: serializeAuthFields(audienceDef.audienceFields ?? {})
    }
  }

  // Actions: keyed object
  const actions: Record<string, PublicAction> = {}
  for (const [actionKey, action] of Object.entries(definition.actions as Record<string, any>)) {
    actions[actionKey] = serializeAction(actionKey, action)
  }

  // Presets: pass through
  const presets: PublicPreset[] = ((definition as any).presets ?? []).map((preset: any) => ({
    name: preset.name,
    type: preset.type,
    partnerAction: preset.partnerAction,
    subscribe: preset.subscribe,
    mapping: preset.mapping ?? {},
    eventSlug: preset.eventSlug ?? null
  }))

  const mode: string =
    (definition as any).mode ?? ((definition as BrowserDestinationDefinition).settings ? 'device' : 'cloud')

  return {
    slug,
    name: definition.name,
    mode,
    description: definition.description,
    authentication,
    audienceConfig,
    actions,
    presets
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd packages/cli && yarn typecheck 2>&1 | head -30
```

Expected: no errors (or only errors in the old command `run()` method which still references `generateDestinationPayload` — fix in next task).

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/commands/generate/metadata-payload.ts
git commit -m "feat: implement generatePublicMetadata replacing generateDestinationPayload"
```

---

### Task 6: Update command class + clean up

**Files:**

- Modify: `packages/cli/src/commands/generate/metadata-payload.ts`

- [ ] **Step 1: Update `run()` to call `generatePublicMetadata`**

In the `run()` method of `GenerateMetadataPayload`, find the line:

```typescript
const payload = generateDestinationPayload(slug, definition)
```

Replace it with:

```typescript
const payload = generatePublicMetadata(slug, definition)
```

- [ ] **Step 2: Remove the unused `hasOauthAuthentication` import**

In the import line at the top:

```typescript
import { getManifest, DestinationDefinition, hasOauthAuthentication } from '../../lib/destinations'
```

Change to:

```typescript
import { getManifest, DestinationDefinition } from '../../lib/destinations'
```

- [ ] **Step 3: Verify full compile is clean**

```bash
cd packages/cli && yarn typecheck 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/commands/generate/metadata-payload.ts
git commit -m "refactor: wire command run() to generatePublicMetadata, remove unused imports"
```

---

### Task 7: Rewrite tests — part A (unit: serializeAuthField, serializeActionField)

**Files:**

- Modify: `packages/cli/src/__tests__/generate-metadata-payload.test.ts`

Replace the entire file content with the following (this is part A — unit tests for the two serialization helpers):

- [ ] **Step 1: Replace the test file with part A**

```typescript
jest.mock('../lib/destinations', () => ({
  getManifest: jest.fn(),
  hasOauthAuthentication: jest.requireActual('../lib/destinations').hasOauthAuthentication
}))

jest.mock('fs-extra', () => ({
  __esModule: true,
  default: { writeJson: jest.fn().mockResolvedValue(undefined) }
}))

import fs from 'fs-extra'
import { generatePublicMetadata, PublicDestinationMetadata } from '../commands/generate/metadata-payload'
import GenerateMetadataPayload from '../commands/generate/metadata-payload'
import { getManifest } from '../lib/destinations'
import type { DestinationDefinition } from '../lib/destinations'

// ---- Fixtures ----

const cloudDef: DestinationDefinition = {
  name: 'Cloud Dest',
  mode: 'cloud',
  description: 'A cloud destination.',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: { label: 'API Key', description: 'Your key.', type: 'password', required: true },
      region: { label: 'Region', description: 'Your region.', type: 'string', required: false },
      mode: {
        label: 'Mode',
        description: 'Select mode.',
        type: 'string',
        required: { conditions: [{ fieldKey: 'x', operator: 'is', value: 'y' }] }
      }
    },
    testAuthentication: () => Promise.resolve()
  },
  actions: {
    trackEvent: {
      title: 'Track Event',
      description: 'Send track.',
      defaultSubscription: 'type = "track"',
      fields: {
        userId: {
          label: 'User ID',
          description: 'ID.',
          type: 'string',
          required: true,
          default: { '@path': '$.userId' }
        },
        props: {
          label: 'Props',
          description: 'Properties.',
          type: 'object',
          required: false,
          properties: {
            color: { label: 'Color', description: 'A color.', type: 'string' }
          }
        }
      },
      perform: () => undefined
    }
  }
} as unknown as DestinationDefinition

const browserDef: DestinationDefinition = {
  name: 'Browser Dest',
  mode: 'device',
  settings: {
    sdkKey: { label: 'SDK Key', description: 'Key.', type: 'string', required: true }
  },
  actions: {
    webAction: {
      title: 'Web Action',
      description: 'Does web stuff.',
      platform: 'web',
      fields: {},
      perform: () => undefined
    }
  }
} as unknown as DestinationDefinition

// ---- Top-level shape ----

describe('generatePublicMetadata() — top-level shape', () => {
  it('includes slug, name, mode, description', () => {
    const result = generatePublicMetadata('actions-cloud', cloudDef)
    expect(result).toMatchObject({
      slug: 'actions-cloud',
      name: 'Cloud Dest',
      mode: 'cloud',
      description: 'A cloud destination.'
    })
  })

  it('has authentication, audienceConfig, actions, presets keys', () => {
    const result = generatePublicMetadata('actions-cloud', cloudDef)
    expect(result).toHaveProperty('authentication')
    expect(result).toHaveProperty('audienceConfig')
    expect(result).toHaveProperty('actions')
    expect(result).toHaveProperty('presets')
  })
})

// ---- Auth fields ----

describe('generatePublicMetadata() — authentication fields', () => {
  it('serializes cloud auth fields under authentication.fields', () => {
    const { authentication } = generatePublicMetadata('actions-cloud', cloudDef)
    expect(authentication?.scheme).toBe('custom')
    expect(authentication?.fields).toHaveProperty('apiKey')
    expect(authentication?.fields.apiKey).toMatchObject({
      label: 'API Key',
      type: 'password',
      required: true
    })
  })

  it('flattens conditional required to false', () => {
    const { authentication } = generatePublicMetadata('actions-cloud', cloudDef)
    expect(authentication?.fields.mode.required).toBe(false)
  })

  it('uses browser settings as auth fields for device-mode destinations', () => {
    const { authentication } = generatePublicMetadata('actions-browser', browserDef)
    expect(authentication?.fields).toHaveProperty('sdkKey')
    expect(authentication?.fields.sdkKey.required).toBe(true)
  })

  it('normalizes string choices to {label, value} objects', () => {
    const defWithChoices = {
      ...cloudDef,
      authentication: {
        scheme: 'custom',
        fields: {
          env: { label: 'Env', description: 'Env.', type: 'string', choices: ['prod', 'staging'] }
        }
      }
    } as unknown as DestinationDefinition
    const { authentication } = generatePublicMetadata('slug', defWithChoices)
    expect(authentication?.fields.env.choices).toEqual([
      { label: 'prod', value: 'prod' },
      { label: 'staging', value: 'staging' }
    ])
  })
})

// ---- Action fields ----

describe('generatePublicMetadata() — action fields', () => {
  it('actions is a keyed object (not an array)', () => {
    const { actions } = generatePublicMetadata('actions-cloud', cloudDef)
    expect(Array.isArray(actions)).toBe(false)
    expect(actions).toHaveProperty('trackEvent')
  })

  it('fields within an action is a keyed object', () => {
    const { actions } = generatePublicMetadata('actions-cloud', cloudDef)
    expect(Array.isArray(actions.trackEvent.fields)).toBe(false)
    expect(actions.trackEvent.fields).toHaveProperty('userId')
  })

  it('serializes action field properties correctly', () => {
    const { actions } = generatePublicMetadata('actions-cloud', cloudDef)
    expect(actions.trackEvent.fields.userId).toMatchObject({
      label: 'User ID',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    })
  })

  it('serializes nested properties for object fields', () => {
    const { actions } = generatePublicMetadata('actions-cloud', cloudDef)
    expect(actions.trackEvent.fields.props.properties).toHaveProperty('color')
    expect(actions.trackEvent.fields.props.properties?.color.type).toBe('string')
  })

  it('sets platform=web for web actions', () => {
    const { actions } = generatePublicMetadata('actions-browser', browserDef)
    expect(actions.webAction.platform).toBe('web')
  })

  it('sets platform=cloud for cloud actions', () => {
    const { actions } = generatePublicMetadata('actions-cloud', cloudDef)
    expect(actions.trackEvent.platform).toBe('cloud')
  })
})
```

- [ ] **Step 2: Run part A tests**

```bash
cd packages/cli && yarn jest --testPathPattern="generate-metadata-payload" 2>&1 | tail -30
```

Expected: all tests in part A pass.

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/__tests__/generate-metadata-payload.test.ts
git commit -m "test: rewrite generate-metadata-payload tests part A (auth + action fields)"
```

---

### Task 8: Rewrite tests — part B (hasPerformBatch, syncMode, hooks, audienceConfig, presets, command E2E)

**Files:**

- Modify: `packages/cli/src/__tests__/generate-metadata-payload.test.ts`

- [ ] **Step 1: Append part B tests to the file**

Add the following after the last `})` in the current test file:

```typescript
// ---- hasPerformBatch ----

describe('generatePublicMetadata() — hasPerformBatch', () => {
  it('is true when performBatch is defined', () => {
    const def = {
      ...cloudDef,
      actions: {
        batchAction: {
          title: 'Batch',
          description: 'Batches.',
          fields: {},
          perform: () => undefined,
          performBatch: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    expect(generatePublicMetadata('slug', def).actions.batchAction.hasPerformBatch).toBe(true)
  })

  it('is false when performBatch is not defined', () => {
    expect(generatePublicMetadata('actions-cloud', cloudDef).actions.trackEvent.hasPerformBatch).toBe(false)
  })
})

// ---- syncMode ----

describe('generatePublicMetadata() — syncMode', () => {
  it('is null when action has no syncMode', () => {
    expect(generatePublicMetadata('actions-cloud', cloudDef).actions.trackEvent.syncMode).toBeNull()
  })

  it('serializes syncMode with default and supportedModes', () => {
    const def = {
      ...cloudDef,
      actions: {
        syncAction: {
          title: 'Sync',
          description: 'Syncs.',
          fields: {},
          syncMode: {
            default: 'add',
            label: 'Sync Mode',
            description: 'How to sync.',
            choices: [
              { label: 'Add', value: 'add' },
              { label: 'Delete', value: 'delete' }
            ]
          },
          perform: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    const { syncMode } = generatePublicMetadata('slug', def).actions.syncAction
    expect(syncMode).toEqual({ default: 'add', supportedModes: ['add', 'delete'] })
  })
})

// ---- hooks ----

describe('generatePublicMetadata() — hooks', () => {
  it('is empty array when action has no hooks', () => {
    expect(generatePublicMetadata('actions-cloud', cloudDef).actions.trackEvent.hooks).toEqual([])
  })

  it('lists valid hook type names present on the action', () => {
    const def = {
      ...cloudDef,
      actions: {
        hookAction: {
          title: 'Hook',
          description: 'Has hooks.',
          fields: {},
          hooks: {
            onMappingSave: { label: 'On Save', description: 'Fires on save.', inputFields: {} }
          },
          perform: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    expect(generatePublicMetadata('slug', def).actions.hookAction.hooks).toEqual(['onMappingSave'])
  })
})

// ---- audienceConfig ----

describe('generatePublicMetadata() — audienceConfig', () => {
  it('is null when no audienceConfig is present', () => {
    expect(generatePublicMetadata('actions-cloud', cloudDef).audienceConfig).toBeNull()
  })

  it('serializes audienceConfig mode and audienceFields, strips functions', () => {
    const def = {
      ...cloudDef,
      audienceConfig: {
        mode: { type: 'realtime' },
        createAudience: () => Promise.resolve({ externalId: '1' }),
        getAudience: () => Promise.resolve({ externalId: '1' })
      },
      audienceFields: {
        listId: { label: 'List ID', description: 'The list.', type: 'string', required: true }
      }
    } as unknown as DestinationDefinition
    const { audienceConfig } = generatePublicMetadata('slug', def)
    expect(audienceConfig).not.toBeNull()
    expect(audienceConfig?.mode).toEqual({ type: 'realtime' })
    expect(audienceConfig?.audienceFields).toHaveProperty('listId')
    expect(typeof (audienceConfig as any)?.createAudience).toBe('undefined')
  })
})

// ---- presets ----

describe('generatePublicMetadata() — presets', () => {
  it('passes through presets with all required fields', () => {
    const def = {
      ...cloudDef,
      presets: [
        {
          name: 'Track',
          type: 'automatic',
          partnerAction: 'trackEvent',
          subscribe: 'type = "track"',
          mapping: { a: 1 }
        }
      ]
    } as unknown as DestinationDefinition
    const { presets } = generatePublicMetadata('slug', def)
    expect(presets).toHaveLength(1)
    expect(presets[0]).toMatchObject({
      name: 'Track',
      type: 'automatic',
      partnerAction: 'trackEvent',
      subscribe: 'type = "track"',
      mapping: { a: 1 },
      eventSlug: null
    })
  })

  it('returns empty array when no presets defined', () => {
    expect(generatePublicMetadata('actions-cloud', cloudDef).presets).toEqual([])
  })
})

// ---- no auto-injected fields ----

describe('generatePublicMetadata() — no auto-injected fields', () => {
  it('does not inject enable_batching', () => {
    const def = {
      ...cloudDef,
      actions: {
        batchAction: {
          title: 'Batch',
          description: '',
          fields: {},
          perform: () => undefined,
          performBatch: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    const { actions } = generatePublicMetadata('slug', def)
    expect(actions.batchAction.fields).not.toHaveProperty('enable_batching')
  })

  it('does not inject __segment_internal_sync_mode', () => {
    const def = {
      ...cloudDef,
      actions: {
        syncAction: {
          title: 'Sync',
          description: '',
          fields: {},
          syncMode: { default: 'add', label: '', description: '', choices: [{ label: 'Add', value: 'add' }] },
          perform: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    const { actions } = generatePublicMetadata('slug', def)
    expect(actions.syncAction.fields).not.toHaveProperty('__segment_internal_sync_mode')
  })
})

// ---- Command E2E ----

describe('GenerateMetadataPayload command', () => {
  const mockGetManifest = getManifest as jest.MockedFunction<typeof getManifest>
  const mockWriteJson = fs.writeJson as jest.MockedFunction<typeof fs.writeJson>

  const validEntry = {
    path: '/repo/packages/destination-actions/dist/destinations/test-dest/index.js',
    definition: cloudDef
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockWriteJson.mockResolvedValue(undefined as never)
  })

  it('writes metadata.json to the resolved source dir', async () => {
    mockGetManifest.mockReturnValue({ 'meta-1': validEntry as any })
    await GenerateMetadataPayload.run([])
    expect(mockWriteJson).toHaveBeenCalledWith(
      '/repo/packages/destination-actions/src/destinations/test-dest/metadata.json',
      expect.objectContaining({ name: 'Cloud Dest', slug: expect.any(String) }),
      { spaces: 2 }
    )
  })

  it('skips entries where resolveSourceDir returns null', async () => {
    mockGetManifest.mockReturnValue({
      'meta-bad': { path: '/some/unrecognizable/path/index.js', definition: cloudDef } as any
    })
    await GenerateMetadataPayload.run([])
    expect(mockWriteJson).not.toHaveBeenCalled()
  })

  it('processes all entries when no --slug flag is passed', async () => {
    mockGetManifest.mockReturnValue({
      'meta-1': validEntry as any,
      'meta-2': {
        path: '/repo/packages/destination-actions/dist/destinations/second-dest/index.js',
        definition: { ...cloudDef, name: 'Second Dest' }
      } as any
    })
    await GenerateMetadataPayload.run([])
    expect(mockWriteJson).toHaveBeenCalledTimes(2)
  })

  it('filters to only the matching slug when --slug is passed', async () => {
    mockGetManifest.mockReturnValue({
      'meta-alpha': {
        path: '/repo/packages/destination-actions/dist/destinations/alpha-dest/index.js',
        definition: { ...cloudDef, slug: 'alpha-dest' }
      } as any,
      'meta-beta': {
        path: '/repo/packages/destination-actions/dist/destinations/beta-dest/index.js',
        definition: { ...cloudDef, slug: 'beta-dest', name: 'Beta' }
      } as any
    })
    await GenerateMetadataPayload.run(['--slug=alpha-dest'])
    expect(mockWriteJson).toHaveBeenCalledTimes(1)
    expect(mockWriteJson).toHaveBeenCalledWith(
      '/repo/packages/destination-actions/src/destinations/alpha-dest/metadata.json',
      expect.any(Object),
      { spaces: 2 }
    )
  })

  it('continues processing remaining entries when one fails', async () => {
    const failDef = {
      ...cloudDef,
      slug: 'bad-dest',
      actions: {
        badAction: {
          title: 'Bad',
          description: '',
          get fields() {
            throw new Error('boom')
          },
          perform: () => undefined
        }
      }
    }
    mockGetManifest.mockReturnValue({
      'meta-bad': {
        path: '/repo/packages/destination-actions/dist/destinations/bad-dest/index.js',
        definition: failDef
      } as any,
      'meta-good': {
        path: '/repo/packages/destination-actions/dist/destinations/good-dest/index.js',
        definition: { ...cloudDef, slug: 'good-dest' }
      } as any
    })
    await expect(GenerateMetadataPayload.run([])).resolves.not.toThrow()
    expect(mockWriteJson).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run all tests**

```bash
cd packages/cli && yarn jest --testPathPattern="generate-metadata-payload" 2>&1 | tail -40
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/__tests__/generate-metadata-payload.test.ts
git commit -m "test: rewrite generate-metadata-payload tests part B (hasPerformBatch, syncMode, hooks, audienceConfig, presets, E2E)"
```

---

### Task 9: Smoke test with real destination

**Files:** none modified

- [ ] **Step 1: Build the CLI**

```bash
cd packages/cli && yarn build 2>&1 | tail -10
```

Expected: no TypeScript errors, `dist/` populated.

- [ ] **Step 2: Run against a real destination**

```bash
./bin/run generate:metadata-payload --slug=actions-amplitude 2>&1
```

Expected: spinner output ending with `Actions Amplitude → .../src/destinations/amplitude/metadata.json`

- [ ] **Step 3: Inspect the output**

```bash
cat packages/destination-actions/src/destinations/amplitude/metadata.json | head -60
```

Expected: JSON with `slug`, `name`, `mode`, `authentication.scheme`, `authentication.fields`, `actions` as keyed object, `presets` array. No `basicOptions`, `options`, `platforms`, `supportedRegions`.

- [ ] **Step 4: Commit**

```bash
git add packages/destination-actions/src/destinations/amplitude/metadata.json
git commit -m "chore: regenerate amplitude metadata.json with public schema format"
```
