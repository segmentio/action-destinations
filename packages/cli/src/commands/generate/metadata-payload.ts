import { Command, flags } from '@oclif/command'
import type {
  AudienceDestinationDefinition,
  DestinationDefinition as CloudDestinationDefinition
} from '@segment/actions-core'
import { hookTypeStrings } from '@segment/actions-core/destination-kit'
import { execFileSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import ora from 'ora'
import { getManifest, DestinationDefinition, loadDestination } from '../../lib/destinations'
import type { WarehouseDestinationDefinition } from '@segment/actions-core'

// ---- Public output interfaces ----

export interface PublicAuthField {
  label: string | undefined
  description: string | undefined
  type: string
  required: boolean | { conditions: Array<{ fieldKey: string; operator: string; value: unknown }> }
  multiple: boolean
  choices: Array<{ label: string; value: unknown }> | null
  default: unknown
  depends_on: unknown
}

export interface PublicActionField {
  label: string | undefined
  description: string | undefined
  type: string
  required: boolean | { conditions: Array<{ fieldKey: string; operator: string; value: unknown }> }
  multiple: boolean
  allowNull: boolean
  dynamic: boolean
  default: unknown
  choices: Array<{ label: string; value: unknown }> | null
  format: string | null
  placeholder: string | null
  properties: Record<string, PublicActionField> | null
  category: string | null
  depends_on: unknown
  readOnly: boolean | null
  hidden: boolean | null
  minimum: number | null
  maximum: number | null
  defaultObjectUI: string | null
  disabledInputMethods: string[] | null
  displayMode: string | null
  additionalProperties: boolean
}

export interface PublicAction {
  title: string
  description: string
  platform: 'cloud' | 'web'
  defaultSubscription: string | null
  hidden: boolean
  hasPerformBatch: boolean
  syncMode: {
    default: string
    label: string
    description: string
    choices: Array<{ label: string; value: string }>
  } | null
  hooks: Record<
    string,
    {
      label: string
      description: string
      inputFields: Record<string, PublicActionField>
      outputFields: Record<string, PublicActionField>
    }
  > | null
  dynamicFields: Record<string, string[]> | null
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
  audienceConfig: {
    mode: { type: 'synced'; full_audience_sync: boolean } | { type: 'realtime' }
    audienceFields: Record<string, PublicAuthField>
    supportsAudienceFunctions: boolean
  } | null
  actions: Record<string, PublicAction>
  presets: PublicPreset[]
}

// ---- Serialization helpers ----

export function normalizeChoices(choices: unknown): Array<{ label: string; value: unknown }> | null {
  if (!Array.isArray(choices) || choices.length === 0) return null
  return choices.map((c: unknown) => {
    if (typeof c === 'object' && c !== null && 'label' in c && 'value' in c) {
      return c as { label: string; value: unknown }
    }
    return { label: String(c), value: c }
  })
}

export function serializeAuthField(schema: any): PublicAuthField {
  return {
    label: schema.label,
    description: schema.description,
    type: schema.type,
    required:
      typeof schema.required === 'object' && schema.required !== null ? schema.required : schema.required === true,
    multiple: schema.multiple ?? false,
    choices: normalizeChoices(schema.choices),
    default: schema.default ?? null,
    depends_on: schema.depends_on ?? null
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
    required: typeof field.required === 'object' && field.required !== null ? field.required : field.required === true,
    multiple: field.multiple ?? false,
    allowNull: field.allowNull ?? false,
    dynamic: typeof field.dynamic === 'function' ? true : field.dynamic ?? false,
    default: field.default ?? null,
    choices: normalizeChoices(field.choices),
    placeholder: field.placeholder ?? null,
    properties,
    category: field.category ?? null,
    depends_on: field.depends_on ?? null,
    readOnly: field.readOnly ?? null,
    hidden: field.unsafe_hidden ?? null,
    minimum: field.minimum ?? null,
    maximum: field.maximum ?? null,
    defaultObjectUI: field.defaultObjectUI ?? null,
    disabledInputMethods: field.disabledInputMethods ?? null,
    displayMode: field.displayMode ?? null,
    format: field.format ?? null,
    additionalProperties: field.additionalProperties ?? false
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
      label: action.syncMode.label ?? 'Sync Mode',
      description: action.syncMode.description ?? '',
      choices: (action.syncMode.choices ?? []).map((c: { value: string; label: string }) => ({
        value: c.value,
        label: c.label
      }))
    }
  }

  const hooks: PublicAction['hooks'] = {}
  if (action.hooks) {
    for (const [hookKey, hook] of Object.entries(action.hooks as Record<string, any>)) {
      if (!hookTypeStrings.includes(hookKey as any)) continue
      const inputFields: Record<string, PublicActionField> = {}
      for (const [fieldKey, fieldDef] of Object.entries((hook.inputFields ?? {}) as Record<string, any>)) {
        inputFields[fieldKey] = serializeActionField(fieldDef)
      }
      const outputFields: Record<string, PublicActionField> = {}
      for (const [fieldKey, fieldDef] of Object.entries(
        (hook.outputTypes ?? hook.outputFields ?? {}) as Record<string, any>
      )) {
        outputFields[fieldKey] = serializeActionField(fieldDef)
      }
      hooks[hookKey] = {
        label: hook.label ?? hookKey,
        description: hook.description ?? '',
        inputFields,
        outputFields
      }
    }
  }

  let dynamicFields: Record<string, string[]> | null = null
  if (action.dynamicFields && typeof action.dynamicFields === 'object') {
    dynamicFields = {}
    for (const [fieldKey, fieldDynamic] of Object.entries(action.dynamicFields as Record<string, any>)) {
      if (typeof fieldDynamic === 'function') continue
      if (typeof fieldDynamic === 'object' && fieldDynamic !== null) {
        const keys = Object.keys(fieldDynamic).filter((k) => k === '__keys__' || k === '__values__')
        if (keys.length > 0) {
          dynamicFields[fieldKey] = keys
        }
      }
    }
    if (Object.keys(dynamicFields).length === 0) {
      dynamicFields = null
    }
  }

  return {
    title: action.title ?? actionKey,
    description: action.description ?? '',
    platform: action.platform === 'web' ? 'web' : 'cloud',
    defaultSubscription: action.defaultSubscription ?? null,
    hidden: action.hidden ?? false,
    hasPerformBatch: typeof action.performBatch === 'function',
    syncMode,
    hooks: Object.keys(hooks).length > 0 ? hooks : null,
    dynamicFields,
    fields
  }
}

export function generatePublicMetadata(
  slug: string,
  definition: DestinationDefinition | WarehouseDestinationDefinition
): PublicDestinationMetadata {
  if (!slug) {
    throw new Error(`metadata.json generation requires a slug but received: "${slug}"`)
  }

  const cloudDef = definition as CloudDestinationDefinition
  const browserDef = definition as any // BrowserDestinationDefinition
  const warehouseDef = definition as unknown as WarehouseDestinationDefinition
  const audienceDef = definition as AudienceDestinationDefinition

  // Authentication fields: cloud uses authentication.fields, browser uses settings, warehouse uses settings
  let authentication: PublicDestinationMetadata['authentication'] = null
  const authFields = cloudDef.authentication?.fields
  const browserSettings = browserDef.settings
  const warehouseSettings = warehouseDef.settings
  const rawFields = authFields ?? browserSettings ?? warehouseSettings
  if (cloudDef.authentication || (rawFields && Object.keys(rawFields).length > 0)) {
    authentication = {
      scheme: cloudDef.authentication?.scheme ?? 'custom',
      fields: serializeAuthFields(rawFields ?? {})
    }
  }

  // audienceConfig: strip functions, keep mode + audienceFields + supportsAudienceFunctions
  let audienceConfig: PublicDestinationMetadata['audienceConfig'] = null
  if (audienceDef.audienceConfig) {
    const rawMode = audienceDef.audienceConfig.mode as { type: string; full_audience_sync?: boolean }
    const audienceConfigAny = audienceDef.audienceConfig as any
    const supportsAudienceFunctions =
      typeof audienceConfigAny.createAudience === 'function' && typeof audienceConfigAny.getAudience === 'function'
    const mode =
      rawMode.type === 'synced'
        ? { type: 'synced' as const, full_audience_sync: rawMode.full_audience_sync ?? false }
        : { type: 'realtime' as const }
    audienceConfig = {
      mode,
      audienceFields: serializeAuthFields(audienceDef.audienceFields ?? {}),
      supportsAudienceFunctions
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

// Lazily-built map from browser package name to source directory.
let browserPkgMap: Map<string, string> | null = null

function getBrowserPackageMap(): Map<string, string> {
  if (browserPkgMap) return browserPkgMap
  browserPkgMap = new Map()
  const browsersDir = path.join(process.cwd(), 'packages', 'browser-destinations', 'destinations')
  try {
    const dirs = fs.readdirSync(browsersDir)
    for (const dir of dirs) {
      const pkgPath = path.join(browsersDir, dir, 'package.json')
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
        if (pkg.name) {
          browserPkgMap.set(pkg.name, path.join(browsersDir, dir))
        }
      } catch {
        // skip directories without valid package.json
      }
    }
  } catch {
    // browsersDir doesn't exist
  }
  return browserPkgMap
}

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

  // Compiled warehouse: .../packages/warehouse-destinations/dist/destinations/<name>/index.js
  const warehouseDistMatch = entryPath.match(
    /^(.+\/packages\/warehouse-destinations)\/dist\/destinations\/([^/]+)\/index\.js$/
  )
  if (warehouseDistMatch) {
    return path.join(warehouseDistMatch[1], 'src', 'destinations', warehouseDistMatch[2])
  }

  // Source warehouse: .../packages/warehouse-destinations/src/destinations/<name>/index.ts
  const warehouseSrcMatch = entryPath.match(
    /^(.+\/packages\/warehouse-destinations\/src\/destinations\/[^/]+)\/index\.ts$/
  )
  if (warehouseSrcMatch) {
    return warehouseSrcMatch[1]
  }

  // Browser via node_modules: .../node_modules/@segment/<pkg-name>/dist/cjs/index.js
  const nodeModulesBrowserMatch = entryPath.match(/node_modules\/(@segment\/[^/]+)\/dist\//)
  if (nodeModulesBrowserMatch) {
    const pkgName = nodeModulesBrowserMatch[1]
    const sourceDir = getBrowserPackageMap().get(pkgName)
    if (sourceDir) return sourceDir
  }

  return null
}

export { resolveSourceDir }

// Extracts destination directory names from file paths using known package layout patterns.
export function extractDestinationDirs(paths: string[]): Set<string> {
  const dirs = new Set<string>()
  for (const p of paths) {
    // Cloud: packages/destination-actions/src/destinations/<name>/...
    const cloudMatch = p.match(/packages\/destination-actions\/src\/destinations\/([^/]+)/)
    if (cloudMatch) {
      dirs.add(cloudMatch[1])
      continue
    }
    // Browser: packages/browser-destinations/destinations/<name>/...
    const browserMatch = p.match(/packages\/browser-destinations\/destinations\/([^/]+)/)
    if (browserMatch) {
      dirs.add(browserMatch[1])
      continue
    }
    // Warehouse: packages/warehouse-destinations/src/destinations/<name>/...
    const warehouseMatch = p.match(/packages\/warehouse-destinations\/src\/destinations\/([^/]+)/)
    if (warehouseMatch) {
      dirs.add(warehouseMatch[1])
      continue
    }
  }
  return dirs
}

// ---- Command ----

export default class GenerateMetadataPayload extends Command {
  private spinner: ora.Ora = ora()

  static description = `Generates a metadata.json file inside each destination's source folder containing the destination's configuration metadata. Intended for use in CI/CD pipelines.`

  static examples = [
    `$ ./bin/run generate:metadata-payload`,
    `$ ./bin/run generate:metadata-payload --slug=actions-amplitude`,
    `$ ./bin/run generate:metadata-payload --mode=cloud`,
    `$ ./bin/run generate:metadata-payload -p packages/destination-actions/src/destinations/amplitude/index.ts`
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static flags: flags.Input<any> = {
    help: flags.help({ char: 'h' }),
    slug: flags.string({
      char: 's',
      description: 'Only generate payload for a specific destination slug',
      multiple: true
    }),
    mode: flags.enum({
      char: 'm',
      description: 'Only generate payload for destinations matching this mode (cloud, device, warehouse)',
      options: ['cloud', 'device', 'warehouse'],
      multiple: true
    }),
    path: flags.string({
      char: 'p',
      description: 'Only generate for destinations matching these file paths (extracts directory names)',
      multiple: true
    })
  }

  static args = []

  async run() {
    const { flags: parsedFlags } = this.parse(GenerateMetadataPayload)
    const filterSlugs: string[] | undefined = parsedFlags['slug']
    const filterModes: string[] | undefined = parsedFlags['mode']
    const filterPaths: string[] | undefined = parsedFlags['path']

    // Extract destination directory names from --path values.
    // If --path is provided but no paths match known layouts, generate nothing.
    const filterDirs: Set<string> | undefined = filterPaths ? extractDestinationDirs(filterPaths) : undefined
    if (filterPaths && filterDirs && filterDirs.size === 0) {
      this.log('No destination directories matched the provided --path values. Nothing to generate.')
      return
    }

    this.spinner.start('Loading destination manifest...')
    let manifest: Record<string, any>
    try {
      manifest = getManifest()
    } catch (err) {
      this.spinner.fail('Failed to load manifest')
      throw err
    }

    // Discover unregistered cloud destinations from the filesystem
    const cloudDestDir = path.join(process.cwd(), 'packages', 'destination-actions', 'src', 'destinations')
    const registeredDirs = new Set(
      Object.values(manifest)
        .filter((entry: any) => {
          const entryPath: string = entry.path ?? ''
          return entryPath.startsWith(cloudDestDir) || entryPath.includes('packages/destination-actions')
        })
        .map((entry: any) => entry.directory as string)
    )

    if (await fs.pathExists(cloudDestDir)) {
      const entries = await fs.readdir(cloudDestDir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const dir = entry.name
        if (registeredDirs.has(dir)) continue
        const indexPath = path.join(cloudDestDir, dir, 'index.ts')
        if (!(await fs.pathExists(indexPath))) continue
        try {
          const definition = await loadDestination(indexPath)
          if (!definition) continue
          manifest[`unregistered:${dir}`] = {
            definition,
            directory: dir,
            path: indexPath
          }
        } catch (err) {
          this.debug(`Skipping unregistered destination "${dir}": ${(err as Error).message}`)
        }
      }
    }

    // Discover warehouse destinations from the filesystem
    const warehouseDestDir = path.join(process.cwd(), 'packages', 'warehouse-destinations', 'src', 'destinations')
    if (await fs.pathExists(warehouseDestDir)) {
      const entries = await fs.readdir(warehouseDestDir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const dir = entry.name
        const indexPath = path.join(warehouseDestDir, dir, 'index.ts')
        if (!(await fs.pathExists(indexPath))) continue
        try {
          const definition = await loadDestination(indexPath)
          if (!definition) continue
          manifest[`warehouse:${dir}`] = {
            definition,
            directory: dir,
            path: indexPath
          }
        } catch (err) {
          this.debug(`Skipping warehouse destination "${dir}": ${(err as Error).message}`)
        }
      }
    }

    // Discover ALL browser destinations from the filesystem independently.
    // Browser destinations that share a metadataId with cloud get merged into the cloud entry,
    // which means resolveSourceDir points to the cloud directory — so the browser directory
    // never gets its own metadata.json unless we discover it here unconditionally.
    const browserDestDir = path.join(process.cwd(), 'packages', 'browser-destinations', 'destinations')
    if (await fs.pathExists(browserDestDir)) {
      const browserEntries = await fs.readdir(browserDestDir, { withFileTypes: true })
      for (const entry of browserEntries) {
        if (!entry.isDirectory()) continue
        const dir = entry.name
        const indexPath = path.join(browserDestDir, dir, 'src', 'index.ts')
        if (!(await fs.pathExists(indexPath))) continue
        try {
          const definition = await loadDestination(indexPath)
          if (!definition) continue
          manifest[`browser:${dir}`] = {
            definition,
            directory: dir,
            path: indexPath
          }
        } catch (err) {
          this.debug(`Skipping browser destination "${dir}": ${(err as Error).message}`)
        }
      }
    }

    this.spinner.succeed(`Loaded ${Object.keys(manifest).length} destinations`)

    const entries = Object.entries(manifest)
    const generatedFiles: string[] = []
    let generated = 0
    let skipped = 0
    let failed = 0

    for (const [metadataId, entry] of entries) {
      const definition = entry.definition as DestinationDefinition
      const slug: string = (definition as any).slug ?? entry.directory?.split('/').pop() ?? metadataId

      if (filterSlugs && filterSlugs.length > 0 && !filterSlugs.includes(slug)) {
        skipped++
        continue
      }

      if (filterModes && filterModes.length > 0) {
        const definitionMode = ((definition as any).mode ?? 'cloud') as string
        if (!filterModes.includes(definitionMode)) {
          skipped++
          continue
        }
      }

      if (filterDirs && filterDirs.size > 0) {
        const entryDir: string = entry.directory?.split('/').pop() ?? ''
        if (!filterDirs.has(entryDir)) {
          skipped++
          continue
        }
      }

      this.spinner.start(`Generating payload for ${definition.name} (${slug})...`)

      const sourceDir = resolveSourceDir(entry.path)
      if (!sourceDir) {
        this.spinner.warn(`Could not resolve source directory for ${slug} (path: ${entry.path}), skipping.`)
        skipped++
        continue
      }

      try {
        const payload = generatePublicMetadata(slug, definition)
        const filePath = path.join(sourceDir, 'metadata.json')
        await fs.writeFile(filePath, JSON.stringify(payload, null, 2) + '\n')
        generatedFiles.push(filePath)
        generated++
        this.spinner.succeed(`${definition.name} → ${filePath}`)
      } catch (err) {
        this.spinner.fail(`Failed for ${slug}: ${(err as Error).message}`)
        failed++
      }
    }

    if (generatedFiles.length > 0) {
      this.spinner.start('Formatting generated files with prettier...')
      try {
        execFileSync('npx', ['prettier', '--write', ...generatedFiles], { stdio: 'ignore' })
        this.spinner.succeed('Formatted generated files with prettier')
      } catch {
        this.spinner.warn('prettier formatting failed — files may not match repo style')
      }
    }

    this.log(
      `\nDone. Generated ${generated} payload files.${skipped > 0 ? ` (${skipped} skipped)` : ''}${
        failed > 0 ? ` (${failed} failed)` : ''
      }`
    )

    if (failed > 0) {
      throw new Error(`${failed} destination(s) failed to generate metadata. See above for details.`)
    }

    if (filterSlugs && filterSlugs.length > 0 && generated === 0) {
      throw new Error(`No destinations matched the slug filter: ${filterSlugs.join(', ')}. Check for typos.`)
    }
  }

  async catch(error: unknown) {
    if (this.spinner?.isSpinning) {
      this.spinner.fail()
    }
    throw error
  }
}
