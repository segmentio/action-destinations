import { Command, flags } from '@oclif/command'
import type {
  AudienceDestinationDefinition,
  DestinationDefinition as CloudDestinationDefinition
} from '@segment/actions-core'
import { hookTypeStrings } from '@segment/actions-core/destination-kit'
import fs from 'fs-extra'
import path from 'path'
import ora from 'ora'
import { getManifest, DestinationDefinition } from '../../lib/destinations'

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
  mode: 'cloud' | 'device' | 'warehouse'
  description: string | undefined
  authentication: { scheme: string; fields: Record<string, PublicAuthField> } | null
  audienceConfig: { mode: unknown; audienceFields: Record<string, PublicAuthField> } | null
  actions: Record<string, PublicAction>
  presets: PublicPreset[]
}

// ---- Serialization helpers ----

export function normalizeChoices(choices: unknown): Array<{ label: string; value: unknown }> | null {
  if (!Array.isArray(choices) || choices.length === 0) return null
  return choices.map((c: string | { label: string; value: unknown }) =>
    typeof c === 'string' ? { label: c, value: c } : c
  )
}

export function serializeAuthField(schema: any): PublicAuthField {
  return {
    label: schema.label,
    description: schema.description,
    type: schema.type,
    required: schema.required === true,
    choices: normalizeChoices(schema.choices),
    default: schema.default ?? null
  }
}

export function serializeAuthFields(fields: Record<string, any>): Record<string, PublicAuthField> {
  const result: Record<string, PublicAuthField> = {}
  for (const [key, schema] of Object.entries(fields)) {
    result[key] = serializeAuthField(schema)
  }
  return result
}

export function serializeActionField(field: any): PublicActionField {
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

export function serializeAction(actionKey: string, action: any): PublicAction {
  const fields: Record<string, PublicActionField> = {}
  for (const [fieldKey, fieldDef] of Object.entries(action.fields ?? ({} as Record<string, any>))) {
    fields[fieldKey] = serializeActionField(fieldDef as any)
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

export function generatePublicMetadata(slug: string, definition: DestinationDefinition): PublicDestinationMetadata {
  const cloudDef = definition as CloudDestinationDefinition
  const browserDef = definition as any // BrowserDestinationDefinition
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

  const mode = ((definition as any).mode ?? 'cloud') as 'cloud' | 'device' | 'warehouse'

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

// ---- Path helpers ----

// Derives the source directory for a destination from its compiled entry path.
// Cloud:   .../packages/destination-actions/dist/destinations/<name>/index.js
//       →  .../packages/destination-actions/src/destinations/<name>
// Browser: .../packages/browser-destinations/destinations/<name>/dist/cjs/index.js
//       →  .../packages/browser-destinations/destinations/<name>
function resolveSourceDir(entryPath: string): string | null {
  // Compiled: .../packages/destination-actions/dist/destinations/<name>/index.js
  const cloudDistMatch = entryPath.match(
    /^(.+\/packages\/destination-actions)\/dist\/destinations\/([^/]+)\/index\.js$/
  )
  if (cloudDistMatch) {
    return path.join(cloudDistMatch[1], 'src', 'destinations', cloudDistMatch[2])
  }

  // Source (ts-node): .../packages/destination-actions/src/destinations/<name>/index.ts
  const cloudSrcMatch = entryPath.match(/^(.+\/packages\/destination-actions\/src\/destinations\/[^/]+)\/index\.ts$/)
  if (cloudSrcMatch) {
    return cloudSrcMatch[1]
  }

  // Compiled browser: .../packages/browser-destinations/destinations/<name>/dist/cjs/index.js
  const browserDistMatch = entryPath.match(/^(.+\/packages\/browser-destinations\/destinations\/[^/]+)\/dist\//)
  if (browserDistMatch) {
    return browserDistMatch[1]
  }

  // Source browser: .../packages/browser-destinations/destinations/<name>/src/index.ts
  const browserSrcMatch = entryPath.match(/^(.+\/packages\/browser-destinations\/destinations\/[^/]+)\/src\//)
  if (browserSrcMatch) {
    return browserSrcMatch[1]
  }

  return null
}

export { resolveSourceDir }

// ---- Command ----

export default class GenerateMetadataPayload extends Command {
  private spinner: ora.Ora = ora()

  static description = `Generates a metadata.json file inside each destination's source folder containing the destination's configuration metadata. Intended for use in CI/CD pipelines.`

  static examples = [
    `$ ./bin/run generate:metadata-payload`,
    `$ ./bin/run generate:metadata-payload --slug=actions-amplitude`
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static flags: flags.Input<any> = {
    help: flags.help({ char: 'h' }),
    slug: flags.string({
      char: 's',
      description: 'Only generate payload for a specific destination slug',
      multiple: true
    })
  }

  static args = []

  async run() {
    const { flags: parsedFlags } = this.parse(GenerateMetadataPayload)
    const filterSlugs: string[] | undefined = parsedFlags['slug']

    this.spinner.start('Loading destination manifest...')
    let manifest: Record<string, any>
    try {
      manifest = getManifest()
    } catch (err) {
      this.spinner.fail('Failed to load manifest')
      throw err
    }
    this.spinner.succeed(`Loaded ${Object.keys(manifest).length} destinations`)

    const entries = Object.entries(manifest)
    let generated = 0
    let skipped = 0

    for (const [metadataId, entry] of entries) {
      const definition = entry.definition as DestinationDefinition
      const slug: string = (definition as any).slug ?? entry.directory?.split('/').pop() ?? metadataId

      if (filterSlugs && filterSlugs.length > 0 && !filterSlugs.includes(slug)) {
        skipped++
        continue
      }

      this.spinner.start(`Generating payload for ${definition.name} (${slug})...`)

      const sourceDir = resolveSourceDir(entry.path)
      if (!sourceDir) {
        this.spinner.warn(`Could not resolve source directory for ${slug} (path: ${entry.path}), skipping.`)
        skipped++
        continue
      }

      try {
        const payload = generateDestinationPayload(slug, definition)
        const filePath = path.join(sourceDir, 'metadata.json')
        await fs.writeJson(filePath, payload, { spaces: 2 })
        generated++
        this.spinner.succeed(`${definition.name} → ${filePath}`)
      } catch (err) {
        this.spinner.fail(`Failed for ${slug}: ${(err as Error).message}`)
      }
    }

    this.log(`\nDone. Generated ${generated} payload files.${skipped > 0 ? ` (${skipped} skipped)` : ''}`)
  }

  async catch(error: unknown) {
    if (this.spinner?.isSpinning) {
      this.spinner.fail()
    }
    throw error
  }
}
