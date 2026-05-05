import { Command, flags } from '@oclif/command'
import type {
  AudienceDestinationDefinition,
  DestinationDefinition as CloudDestinationDefinition,
  MinimalInputField,
  SyncModeDefinition
} from '@segment/actions-core'
import { fieldsToJsonSchema } from '@segment/actions-core'
import { conditionsToJsonSchema } from '@segment/actions-core/destination-kit/fields-to-jsonschema'
import type { ActionHookDefinition, ActionHookType } from '@segment/actions-core/destination-kit'
import { hookTypeStrings } from '@segment/actions-core/destination-kit'
import type { BrowserDestinationDefinition } from '@segment/destinations-manifest'
import type { JSONSchema4 } from 'json-schema'
import { sortBy } from 'lodash'
import fs from 'fs-extra'
import path from 'path'
import ora from 'ora'
import { getManifest, DestinationDefinition, hasOauthAuthentication } from '../../lib/destinations'
import { RESERVED_FIELD_NAMES } from '../../constants'

// ---- Types (mirroring control-plane-service shapes without the actual client) ----

interface DestinationMetadataOption {
  default?: unknown
  description?: string
  encrypt?: boolean
  hidden?: boolean
  label?: string
  private?: boolean
  scope?: string
  type?: string
  options?: Array<{ value: unknown; label: string; text: string }>
  readOnly?: boolean
  dependsOn?: unknown
  validators?: string[][]
  tags?: string[]
  uIMetadata?: unknown
  fields?: unknown
}

type DestinationMetadataOptions = Record<string, DestinationMetadataOption>

interface ActionFieldPayload {
  fieldKey: string
  type: string
  label?: string
  description?: string
  defaultValue?: unknown
  required?: boolean
  multiple?: boolean
  choices?: Array<{ label: string; value: unknown }> | null
  dynamic?: boolean
  placeholder?: string
  allowNull?: boolean
  defaultObjectUI?: string
  hidden?: boolean
  readOnly?: boolean
  fieldSchema?: JSONSchema4
  dependsOn?: unknown
  minimum?: number
  maximum?: number
  displayMetadata?: JSONSchema4 | null
  hookInputFieldType?: string
}

interface ActionPayload {
  slug: string
  name: string
  description: string
  platform: string
  hidden: boolean
  defaultTrigger: string | null
  fields: ActionFieldPayload[]
}

interface DestinationPayload {
  name: string
  description?: string
  basicOptions: string[]
  options: DestinationMetadataOptions
  platforms: {
    browser: boolean
    server: boolean
    mobile: boolean
    warehouse: boolean
    cloudAppObject?: boolean
  }
  authenticationScheme?: string
  supportedRegions: string[]
  supportsAudiences: boolean
  actions: ActionPayload[]
  presets: unknown[]
}

// ---- OAUTH constant (matches action-cli) ----

const OAUTH_OPTIONS: DestinationMetadataOption = {
  default: {},
  description: 'Authorizes Segment to OAuth to the Destination API',
  encrypt: false,
  hidden: true,
  label: 'OAuth',
  private: true,
  scope: 'event_destination',
  type: 'oauth',
  fields: [
    {
      'access-token': {
        description: 'The (legacy) access token provided by Destination API after the OAuth handshake.',
        type: 'string'
      },
      access_token: {
        description: 'The access token provided by Destination API after the OAuth handshake.',
        type: 'string'
      },
      appId: { description: 'The App ID, retrieved via Destination API post-auth.', type: 'string' },
      appName: {
        description: 'The authorized user App, retrieved via Destination API on settings view load.',
        type: 'string'
      },
      createdAt: { description: 'Date of OAuth connection.', type: 'string' },
      createdBy: { description: 'Email address of segment user who connected OAuth.', type: 'string' },
      displayName: {
        description: 'The authorized user, retrieved via Destination API on settings view load.',
        type: 'string'
      },
      refresh_token: {
        description: 'The refresh token provided by Destination API after the OAuth handshake.',
        type: 'string'
      },
      token_type: { description: '', type: 'string' }
    }
  ]
}

// ---- Payload generation helpers (ported from action-cli/src/lib/cmd/push.ts) ----

function getFieldPropertySchema(fieldKey: string, field: MinimalInputField): JSONSchema4 {
  const tmp: Record<string, MinimalInputField> = {}
  const { default: _def, ...fieldWODefault } = field as any
  tmp[fieldKey] = fieldWODefault
  if (field.type === 'object') {
    return fieldsToJsonSchema(tmp, { additionalProperties: (field as any)?.additionalProperties || false })
  }
  return fieldsToJsonSchema(tmp)
}

function getFieldPropertySchemaForHookDefinition(
  hookKey: string,
  hook: ActionHookDefinition<any, any, any, any, any>
): JSONSchema4 {
  const outputs = (hook as any).outputTypes ?? {}
  const hookSchema: MinimalInputField = {
    type: 'object',
    required: false,
    label: hook.label,
    description: hook.description,
    properties: { ...outputs }
  }
  return fieldsToJsonSchema({ [hookKey]: hookSchema })
}

function getDisplayMetadata(field: any, fieldKey: string, action: any): JSONSchema4 | null {
  const displayMetadata: any = {}

  if (field.category) {
    displayMetadata.category = field.category
  }
  if (field.displayMode) {
    displayMetadata.displayMode = field.displayMode
  }
  if (field.disabledInputMethods) {
    displayMetadata.disabledInputMethods = field.disabledInputMethods
  }
  if (typeof field.required === 'object') {
    displayMetadata.conditionallyRequired = field.required
  }

  if (field.type === 'object') {
    let dynamicProperties: string[] = []
    if (field.properties) {
      dynamicProperties = Object.keys(field.properties).filter((key: string) => field.properties[key].dynamic)
      const propertiesMetadata: any = {}
      for (const propertyKey of Object.keys(field.properties)) {
        const propertyDef = field.properties[propertyKey]
        if (propertyDef.disabledInputMethods) {
          propertiesMetadata[propertyKey] = {
            ...propertiesMetadata[propertyKey],
            disabledInputMethods: propertyDef.disabledInputMethods
          }
        }
      }
      if (Object.keys(propertiesMetadata).length > 0) {
        displayMetadata.propertiesMetadata = propertiesMetadata
      }
    }
    if (field.dynamic) {
      action.dynamicFields?.[fieldKey]?.__keys__ && dynamicProperties.push('__keys__')
      action.dynamicFields?.[fieldKey]?.__values__ && dynamicProperties.push('__values__')
    }
    if (dynamicProperties.length > 0) {
      displayMetadata.dynamicProperties = dynamicProperties
    }
  }

  return Object.keys(displayMetadata).length === 0 ? null : displayMetadata
}

function getUIMetadataForTopLevelSetting(field: MinimalInputField): any {
  const uiMetadata: any = {}
  if (field.required && typeof field.required === 'object') {
    uiMetadata.conditionallyRequired = field.required
  }
  return Object.keys(uiMetadata).length === 0 ? null : uiMetadata
}

function getOptions(definition: DestinationDefinition): DestinationMetadataOptions {
  const options: DestinationMetadataOptions = {}

  const publicSettings = (definition as BrowserDestinationDefinition).settings
  const authFields = (definition as CloudDestinationDefinition).authentication?.fields
  const audienceFields = (definition as AudienceDestinationDefinition).audienceFields

  const settings: Record<string, any> = {
    ...publicSettings,
    ...authFields,
    ...audienceFields
  }

  for (const [fieldKey, schema] of Object.entries(settings)) {
    const validators: string[][] = []

    const scope = audienceFields && fieldKey in audienceFields ? 'audience_destination' : 'event_destination'

    if (RESERVED_FIELD_NAMES.includes(fieldKey.toLowerCase()) && hasOauthAuthentication(definition)) {
      throw new Error(`Schema contains a field definition that uses a reserved name: ${fieldKey}`)
    }

    if (schema.required === true) {
      validators.push(['required', `The ${fieldKey} property is required.`])
    }

    if (schema.required && typeof schema.required === 'object') {
      const baseSchema = fieldsToJsonSchema({ [fieldKey]: { ...schema, default: undefined } })
      const conditionalSchema = conditionsToJsonSchema({ [fieldKey]: schema.required })
      validators.push(['conditional', JSON.stringify({ ...baseSchema, ...conditionalSchema })])
    }

    const isAuth = typeof authFields === 'object' && fieldKey in authFields
    const isPrivateSetting = isAuth

    let type: string = schema.type
    if (Array.isArray(schema.choices)) {
      type = 'select'
    }
    if (schema.multiple) {
      type = 'array'
    }

    const defaultValues: Record<string, unknown> = { number: 0, boolean: false, string: '', password: '' }

    const tags: string[] = []
    if (isAuth) {
      tags.push('authentication:test')
    }

    options[fieldKey] = {
      tags,
      default: schema.default ?? defaultValues[schema.type],
      description: schema.description,
      encrypt: schema.type === 'password',
      hidden: false,
      label: schema.label,
      private: isPrivateSetting,
      scope,
      type,
      options: schema.choices?.map((choice: any) => ({
        value: choice.value,
        label: choice.label,
        text: choice.label
      })),
      readOnly: false,
      dependsOn: schema.depends_on ?? null,
      validators,
      uIMetadata: getUIMetadataForTopLevelSetting(schema)
    }
  }

  if (hasOauthAuthentication(definition)) {
    options['oauth'] = OAUTH_OPTIONS
  }

  const audienceConfig = (definition as AudienceDestinationDefinition).audienceConfig
  if (audienceConfig) {
    const defaultAttributes = { private: true, hidden: true, encrypt: false, readOnly: false, validators: [] }
    if (audienceConfig.mode.type === 'synced') {
      options['__segment_internal_engage_batch_sync'] = {
        ...defaultAttributes,
        label: 'Indicates that this is a batched (or synced) destination on some schedule',
        type: 'boolean',
        description: 'Indicates that this is a batched (or synced) destination on some schedule',
        default: true,
        scope: 'event_destination',
        readOnly: true
      }
      if (audienceConfig.mode.full_audience_sync) {
        options['__segment_internal_engage_force_full_sync'] = {
          ...defaultAttributes,
          label: 'Perform a full audience sync if true',
          type: 'boolean',
          description: 'Perform a full audience sync if true',
          default: audienceConfig.mode.full_audience_sync,
          scope: 'event_destination',
          readOnly: true
        }
      }
    }

    const instanceOfWithCreateGet = (obj: any): boolean => 'createAudience' in obj && 'getAudience' in obj
    if (instanceOfWithCreateGet(audienceConfig)) {
      options['__segment_internal_engage_support_audience_functions'] = {
        ...defaultAttributes,
        label: 'Supports Audience Functions (getAudience/createAudience)',
        type: 'boolean',
        description: 'Supports Audience Functions (getAudience/createAudience)',
        default: true,
        scope: 'event_destination',
        readOnly: true
      }
    }
  }

  if (Object.keys(options).length === 0) {
    options['required_hidden_token'] = {
      label: 'Required Hidden Token',
      type: 'string',
      description: 'This token is hidden because it is unused and destinations must have one setting.',
      default: '',
      private: true,
      hidden: true,
      scope: 'event_destination'
    }
  }

  return options
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
      dynamic: processedField.dynamic ?? false,
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

      for (const [hookInputFieldKey, hookInputField] of Object.entries(hookInputFields) as [string, any][]) {
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
