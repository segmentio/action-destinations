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
  mode: string
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

function buildActionFields(action: any): ActionFieldPayload[] {
  const fields: ActionFieldPayload[] = []

  for (const fieldKey of Object.keys(action.fields)) {
    const field = action.fields[fieldKey]

    let choices: ActionFieldPayload['choices'] = null
    if (Array.isArray(field.choices) && field.choices.length > 0) {
      choices = field.choices.map((choice: string | { label: string; value: string }) => {
        if (typeof choice === 'string') return { label: choice, value: choice }
        return choice
      })
    }

    if (field?.default && field.type === 'object') {
      if (!field?.multiple && field?.default?.['@arrayPath']) {
        throw new Error(`The field key "${fieldKey}" is an object field with an incompatible default value.`)
      }
    }

    const processedField = { ...field }
    if (processedField.category === 'hashedPII') {
      const hasPeriod = processedField.description?.at(-1) === '.'
      processedField.description = `${processedField.description}${
        hasPeriod ? '' : '.'
      } If not hashed, Segment will hash this value.`
    }

    fields.push({
      fieldKey,
      type: processedField.type,
      label: processedField.label,
      description: processedField.description,
      defaultValue: processedField.default,
      required: processedField.required === true ?? false,
      multiple: processedField.multiple ?? false,
      choices,
      dynamic: typeof processedField.dynamic === 'function' ? true : processedField.dynamic ?? false,
      placeholder: processedField.placeholder ?? '',
      allowNull: processedField.allowNull ?? false,
      defaultObjectUI: processedField.defaultObjectUI,
      hidden: processedField.unsafe_hidden,
      readOnly: processedField.readOnly,
      fieldSchema: getFieldPropertySchema(fieldKey, processedField),
      dependsOn: processedField.depends_on ?? null,
      minimum: processedField.minimum,
      maximum: processedField.maximum,
      displayMetadata: getDisplayMetadata(processedField, fieldKey, action)
    })
  }

  // Hook fields
  if (action.hooks) {
    for (const [hookKey, hook] of Object.entries(action.hooks)) {
      if (!hookTypeStrings.includes(hookKey as ActionHookType)) {
        throw new Error(`Invalid actions hook: ${hookKey}. Valid hooks are: ${hookTypeStrings.join(', ')}`)
      }

      const castedHook = hook as ActionHookDefinition<any, any, any, any, any>
      const hookInputFields = castedHook.inputFields ?? {}

      for (const [hookInputFieldKey, hookInputField] of Object.entries(hookInputFields)) {
        let choices: ActionFieldPayload['choices'] = null
        if (Array.isArray(hookInputField.choices) && hookInputField.choices.length > 0) {
          choices = hookInputField.choices.map((choice: string | { label: string; value: string }) => {
            if (typeof choice === 'string') return { label: choice, value: choice }
            return choice
          })
        }

        fields.push({
          fieldKey: hookInputFieldKey,
          type: hookInputField.type,
          label: hookInputField.label,
          description: hookInputField.description,
          defaultValue: hookInputField.default,
          required: hookInputField.required === true ?? false,
          multiple: hookInputField.multiple ?? false,
          choices,
          dynamic: typeof hookInputField.dynamic === 'function' ? true : false,
          placeholder: hookInputField.placeholder ?? '',
          allowNull: hookInputField.allowNull ?? false,
          defaultObjectUI: hookInputField.defaultObjectUI,
          hidden: hookInputField.unsafe_hidden,
          readOnly: hookInputField.readOnly,
          fieldSchema: getFieldPropertySchema(hookInputFieldKey, hookInputField as MinimalInputField),
          dependsOn: hookInputField.depends_on ?? null,
          hookInputFieldType: hookKey,
          displayMetadata: getDisplayMetadata(hookInputField, hookInputFieldKey, action)
        })
      }

      const hookSchema = getFieldPropertySchemaForHookDefinition(hookKey, castedHook)
      fields.push({
        fieldKey: hookKey,
        type: 'object',
        label: castedHook.label,
        description: castedHook.description,
        defaultValue: null,
        required: false,
        multiple: false,
        choices: null,
        dynamic: false,
        allowNull: false,
        hidden: false,
        readOnly: false,
        fieldSchema: hookSchema,
        hookInputFieldType: hookKey
      })
    }
  }

  // Sync mode field
  if (action.syncMode) {
    const syncMode = action.syncMode as SyncModeDefinition
    fields.push({
      fieldKey: '__segment_internal_sync_mode',
      type: 'string',
      label: syncMode.label,
      description: syncMode.description,
      defaultValue: syncMode.default,
      required: false,
      multiple: false,
      choices: syncMode.choices,
      dynamic: false,
      allowNull: false,
      hidden: true,
      readOnly: false,
      dependsOn: null
    })
  }

  // Identifier matching field
  const identifierFields = Object.keys(action.fields).filter(
    (fieldKey: string) => action.fields[fieldKey].category === 'identifier'
  )
  if (identifierFields.length > 0) {
    fields.push({
      fieldKey: '__segment_internal_matching_key',
      type: 'string',
      label: 'Record Matching',
      description: 'Select the field used to match incoming event data to existing records in the destination.',
      required: false,
      multiple: false,
      choices: identifierFields.map((fieldKey: string) => ({
        label: action.fields[fieldKey].label,
        value: fieldKey
      })),
      dynamic: false,
      allowNull: false,
      hidden: true,
      readOnly: false,
      dependsOn: null
    })
  }

  // Auto batching field
  const builderDefinedBatchingField = fields.find((f) => f.fieldKey === 'enable_batching')
  const isBatchingDestination = typeof action.performBatch === 'function'

  if (isBatchingDestination && !builderDefinedBatchingField) {
    fields.push({
      fieldKey: 'enable_batching',
      type: 'boolean',
      label: 'Enable Batching?',
      description: 'When enabled, Segment will send events in batches.',
      defaultValue: false,
      required: false,
      multiple: false,
      dynamic: false,
      allowNull: false,
      choices: null
    })
  }

  return fields
}

function generateDestinationPayload(slug: string, definition: DestinationDefinition): DestinationPayload {
  const warehouseSupportDestinations = ['actions-segment', 'actions-segment-profiles']
  const supportWarehouse = warehouseSupportDestinations.includes(slug)
  const supportCloudAppObject = slug === 'actions-segment-profiles'

  const hasBrowserActions =
    !supportWarehouse && Object.values(definition.actions).some((a: any) => a.platform === 'web')
  const hasCloudActions =
    !supportWarehouse && Object.values(definition.actions).some((a: any) => !a.platform || a.platform === 'cloud')

  const platforms = {
    browser: hasBrowserActions || hasCloudActions,
    server: hasCloudActions,
    mobile: false,
    warehouse: supportWarehouse,
    cloudAppObject: supportCloudAppObject
  }

  const options = getOptions(definition)
  const basicOptions = Object.keys(options).filter((k) => k !== 'oauth')

  const audienceConfig = (definition as AudienceDestinationDefinition).audienceConfig
  let supportsAudiences = !!audienceConfig
  if (slug === 'actions-liveramp-audiences') {
    supportsAudiences = true
  }

  const actions: ActionPayload[] = sortBy(
    Object.entries(definition.actions).map(([actionKey, action]: [string, any]) => {
      const platform = action.platform ?? 'cloud'
      const fields = buildActionFields(action)

      return {
        slug: actionKey,
        name: action.title ?? 'Unnamed Action',
        description: action.description ?? '',
        platform,
        hidden: action.hidden ?? false,
        defaultTrigger: action.defaultSubscription ?? null,
        fields
      }
    }),
    'name'
  )

  const presets = sortBy(
    ((definition as any).presets ?? []).map((preset: any) => ({
      partnerAction: preset.partnerAction,
      name: preset.name,
      subscribe: preset.subscribe,
      mapping: preset.mapping ?? {},
      type: preset.type,
      eventSlug: preset.eventSlug
    })),
    'name'
  )

  const authScheme = (definition as CloudDestinationDefinition).authentication?.scheme

  return {
    name: definition.name,
    description: definition.description,
    basicOptions,
    options,
    platforms,
    authenticationScheme: authScheme,
    supportedRegions: ['us-west-2', 'eu-west-1'],
    supportsAudiences,
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

export { generateDestinationPayload, resolveSourceDir }

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
