import { Command, flags } from '@oclif/command'
import { fieldsToJsonSchema } from '@segment/actions-core'
import type { InputField, DestinationDefinition as CloudDestinationDefinition } from '@segment/actions-core'
import type { BrowserDestinationDefinition } from '@segment/destinations-manifest'
import chokidar from 'chokidar'
import fs from 'fs-extra'
import globby from 'globby'
import { JSONSchema4 } from 'json-schema'
import { compile } from 'json-schema-to-typescript'
import path from 'path'
import prettier from 'prettier'
import { loadDestination, hasOauthAuthentication } from '../../lib/destinations'
import { RESERVED_FIELD_NAMES } from '../../constants'
import { AudienceDestinationDefinition, ActionHookType } from '@segment/actions-core/destination-kit'
import { ActionHookDefinition, hookTypeStrings } from '@segment/actions-core/destination-kit'

const pretterOptions = prettier.resolveConfig.sync(process.cwd())

export default class GenerateTypes extends Command {
  static description = `Generates TypeScript definitions for an integration.`

  static examples = [
    `$ ./bin/run generate:types`,
    `$ ./bin/run generate:types --path ./packages/*/src/destinations/*/index.ts`
  ]

  // Allow variable length args (to work with tools like lint-staged)
  static strict = false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static flags: flags.Input<any> = {
    help: flags.help({ char: 'h' }),
    path: flags.string({
      char: 'p',
      description: 'file path for the integration(s). Accepts glob patterns.',
      multiple: true
    }),
    watch: flags.boolean({ char: 'w', description: 'Watch for file changes to regenerate types' })
  }

  static args = []

  async run() {
    const { flags } = this.parse(GenerateTypes)

    const globs = flags.path || [
      './packages/*/src/destinations/*/index.ts',
      './packages/browser-destinations/destinations/*/src/index.ts'
    ]
    const files = await globby(globs, {
      expandDirectories: false,
      gitignore: true,
      ignore: ['node_modules']
    })

    for (const file of files) {
      await this.handleFile(file)
    }

    if (flags.watch) {
      const dirsToWatch = files.map((file) => path.dirname(file))

      const watcher = chokidar.watch(dirsToWatch, {
        cwd: process.cwd(),
        ignored: '**/*/generated-types.ts'
      })

      watcher.on('change', (filePath) => {
        this.debug(`Regenerating types for ${filePath} ..`)

        // Find matching parent directory for the entrypoint file
        const parentDir = dirsToWatch.find((parent) => {
          const relative = path.relative(parent, filePath)
          return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
        })
        if (!parentDir) {
          return
        }

        this.handleFile(parentDir).catch((error) => {
          this.debug(`Error generating types for ${filePath}: ${error.message}`)
        })
      })

      watcher.on('error', (error) => {
        this.error(`Error: ${error.message}`)
      })

      watcher.once('ready', () => {
        this.log('Watching files for changes ..')
      })
    }
  }

  async handleFile(file: string): Promise<void> {
    const destination = await loadDestination(file).catch((error) => {
      this.debug(`Couldn't load ${file}: ${error.message}`)
      return null
    })

    if (!destination) {
      return
    }

    const stats = fs.statSync(file)
    const parentDir = stats.isDirectory() ? file : path.dirname(file)

    const settings = {
      ...(destination as BrowserDestinationDefinition).settings,
      ...(destination as CloudDestinationDefinition).authentication?.fields
    }

    if (settings && hasOauthAuthentication(destination)) {
      for (const key in settings) {
        if (RESERVED_FIELD_NAMES.includes(key.toLowerCase())) {
          throw new Error(`Field definition in destination ${destination.name} is using a reserved name: ${key}`)
        }
      }
    }

    let types = await generateTypes(settings, 'Settings')

    const audienceSettings = {
      ...(destination as AudienceDestinationDefinition)?.audienceFields
    }
    if (Object.keys(audienceSettings).length > 0) {
      const audienceTypes = await generateTypes(audienceSettings, 'AudienceSettings')
      types += audienceTypes
    }

    fs.writeFileSync(path.join(parentDir, './generated-types.ts'), types)

    // TODO how to load directory structure consistently?
    for (const [slug, action] of Object.entries(destination.actions)) {
      const fields = action.fields

      let types = await generateTypes(fields, 'Payload')

      if (action.hooks) {
        const hooks: ActionHookDefinition<any, any, any, any, any> = action.hooks
        let hookBundle = ''
        const hookFields: Record<string, any> = {}
        for (const [hookName, hook] of Object.entries(hooks)) {
          if (!hookTypeStrings.includes(hookName as ActionHookType)) {
            throw new Error(`Hook name ${hookName} is not a valid ActionHookType`)
          }

          const inputs = hook.inputFields
          const outputs = hook.outputTypes
          if (!inputs && !outputs) {
            continue
          }

          const hookSchema = {
            type: 'object',
            required: true,
            properties: {
              inputs: {
                label: `${hookName} hook inputs`,
                type: 'object',
                properties: inputs
              },
              outputs: {
                label: `${hookName} hook outputs`,
                type: 'object',
                properties: outputs
              }
            }
          }
          hookFields[hookName] = hookSchema
        }
        hookBundle = await generateTypes(
          hookFields,
          'HookBundle',
          `// Generated bundle for hooks. DO NOT MODIFY IT BY HAND.`
        )
        types += hookBundle
      }

      if (fs.pathExistsSync(path.join(parentDir, `${slug}`))) {
        fs.writeFileSync(path.join(parentDir, slug, 'generated-types.ts'), types)
      } else {
        fs.writeFileSync(path.join(parentDir, `./${slug}.types.ts`), types)
      }
    }
  }
}

async function generateTypes(fields: Record<string, InputField> = {}, name: string, bannerComment?: string) {
  const schema = prepareSchema(fields)

  return compile(schema, name, {
    bannerComment: bannerComment ?? '// Generated file. DO NOT MODIFY IT BY HAND.',
    style: pretterOptions ?? undefined
  })
}

function prepareSchema(fields: Record<string, InputField>): JSONSchema4 {
  let schema = fieldsToJsonSchema(fields, { tsType: true })
  // Remove extra properties so it produces cleaner output
  schema = removeExtra(schema)
  return schema
}

function removeExtra(schema: JSONSchema4) {
  const copy = { ...schema }

  delete copy.title
  delete copy.enum

  if (copy.type === 'object' && copy.properties) {
    for (const [key, property] of Object.entries(copy.properties)) {
      copy.properties[key] = removeExtra(property)
    }
  } else if (copy.type === 'array' && copy.items) {
    copy.items = removeExtra(copy.items)
  }

  return copy
}
