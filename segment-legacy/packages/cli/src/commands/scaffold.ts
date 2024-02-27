import { Command, flags } from '@oclif/command'
import chalk from 'chalk'
import ora from 'ora'
import path from 'path'
import { autoPrompt } from '../lib/prompt'
import globby from 'globby'
import { renderTemplates } from '../lib/templates'
import fs from 'fs-extra'
import { camelCase, startCase } from 'lodash'
import { fieldsToJsonSchema } from '@segment/actions-core'
import type { InputField, DestinationDefinition as CloudDestinationDefinition } from '@segment/actions-core'
import type { BrowserDestinationDefinition } from '@segment/destinations-manifest'
import { JSONSchema4 } from 'json-schema'
import { compile } from 'json-schema-to-typescript'
import prettier from 'prettier'
import { loadDestination, hasOauthAuthentication } from '../lib/destinations'
import { RESERVED_FIELD_NAMES } from '../constants'

const pretterOptions = prettier.resolveConfig.sync(process.cwd())

export default class Init extends Command {
  private spinner: ora.Ora = ora()

  static description = `Scaffolds a new integration given a JSON configuration`

  static examples = [`$ ./bin/run scaffold`]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static flags: flags.Input<any> = {
    help: flags.help({ char: 'h' }),
    directory: flags.string({
      char: 'd',
      description: 'target directory to scaffold the integration',
      default: './packages/destination-actions/src/destinations'
    }),
    path: flags.string({
      char: 'p',
      description: 'file path for the integration(s). Accepts glob patterns.',
      multiple: true
    })
  }

  static args = [
    {
      name: 'path',
      description: 'path to scaffold the integration'
    }
  ]

  async integrationDirs(glob: string) {
    const integrationDirs = await globby(glob, {
      expandDirectories: false,
      onlyDirectories: true,
      gitignore: true,
      ignore: ['node_modules']
    })

    return integrationDirs
  }

  parseFlags() {
    return this.parse(Init)
  }

  async run() {
    const { args, flags } = this.parseFlags()
    const answers = await autoPrompt(flags, [
      {
        type: 'text',
        name: 'json',
        message: 'JSON: ',
        format: (val) => JSON.parse(val)
      }
    ])

    const name = answers.json.name
    const slug = answers.json.slug
    const authenticationScheme = answers.json.authenticationScheme
    const actions = answers.json.actions
    const directory = answers.directory

    // For now, include the slug in the path, but when we support external repos, we'll have to change this
    const slugWithoutActions = String(slug).replace('actions-', '')
    const folderName = args.path || slugWithoutActions
    const relativePath = path.join(directory, folderName)
    const targetDirectory = path.join(process.cwd(), relativePath)
    const templatePath = path.join(__dirname, '../../templates/destinations/lowcode', authenticationScheme)
    const snapshotPath = path.join(__dirname, '../../templates/actions/snapshot')

    const destinationFolder = path.parse(directory).base
    const destination = startCase(camelCase(destinationFolder)).replace(/ /g, '')
    const actionsSnapshotPath = path.join(__dirname, '../../templates/actions/action-snapshot')
    const actionsTemplatePath = path.join(__dirname, '../../templates/actions/empty-action-lowcode')

    const overwriteExisting = true

    try {
      this.spinner.start(`Creating ${chalk.bold(name)}`)
      renderTemplates(templatePath, targetDirectory, answers, overwriteExisting)
      this.spinner.succeed(`Scaffold integration`)
    } catch (err: any) {
      this.spinner.fail(`Scaffold integration: ${chalk.red(err.message)}`)
      this.exit()
    }

    try {
      renderTemplates(
        snapshotPath,
        targetDirectory,
        {
          destination: slug
        },
        overwriteExisting
      )
      this.spinner.succeed(chalk`Created snapshot tests for {magenta ${slug}} destination`)
    } catch (err: any) {
      this.spinner.fail(`Snapshot test creation failed: ${chalk.red(err.message)}`)
      this.exit()
    }

    for (const action of actions) {
      const actionsTargetDirectory = `${targetDirectory}/${action.key}`

      action.fields.forEach((field: any) => {
        const hasDefault = field.hasDefault && field.defaultValue
        if (hasDefault) {
          const defaultValue = JSON.stringify(field.defaultValue)
          if (defaultValue.includes('@template')) {
            field.isTemplate = true
            field.directiveType = '@template'
            const templateValue: string = field.defaultValue['@template']
            // Replace double curly braces with square brackets so that it can be properly rendered in Mustache template
            field.value = templateValue.replace(/\{\{([^{}]+)\}\}/g, '[[$1]]')
          }
          field.defaultValue = defaultValue
        }
      })

      try {
        renderTemplates(
          actionsTemplatePath,
          actionsTargetDirectory,
          {
            name: action.name,
            description: action.description,
            hasDefaultSubscription: action.hasDefaultSubscription,
            trigger: action.trigger,
            slug,
            destination,
            fields: action.fields,
            apiEndpoint: action.apiEndpoint,
            httpMethod: action.httpMethod,
            performJSON: action.mappings
          },
          overwriteExisting
        )
        this.spinner.succeed(chalk`Scaffold action {magenta ${action.name}}`)
      } catch (err: any) {
        this.spinner.fail(chalk`Scaffold action {magenta ${action.name}}: ${chalk.red(err.message)}`)
        this.exit()
      }

      try {
        this.spinner.start(`Creating snapshot tests for ${chalk.bold(`${destination}'s ${slug}`)} destination action`)
        renderTemplates(
          actionsSnapshotPath,
          actionsTargetDirectory,
          {
            destination: destination,
            actionSlug: slug
          },
          overwriteExisting
        )
        this.spinner.succeed(chalk`Creating snapshot tests for action {magenta ${action.name}}`)
      } catch (err: any) {
        this.spinner.fail(chalk`Snapshot test creation failed {magenta ${action.name}}: ${chalk.red(err.message)}`)
        this.exit()
      }

      // In order to generate templates, we had to replace curly braces with square brackets. This reverts them back to curly braces.
      const entryFile = `${actionsTargetDirectory}/index.ts`
      try {
        this.spinner.start(chalk`Updating action field templates for action: ${action.name}`)
        const actionsStr = fs.readFileSync(entryFile, 'utf8')
        const result = actionsStr.replace(/\[\[([^[\]]+)\]\]/g, '{{$1}}')
        fs.writeFileSync(entryFile, result, 'utf8')
        this.spinner.succeed()
      } catch (err) {
        this.spinner.fail(chalk`Failed to update your action field templates for action: ${action.name}`)
        this.exit()
      }
    }

    const glob = `${relativePath}/index.ts`
    const files = await globby(glob, {
      expandDirectories: false,
      gitignore: true,
      ignore: ['node_modules']
    })

    for (const file of files) {
      await this.handleFile(file)
    }

    this.log(chalk.green(`Done creating "${name}" 🎉`))
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

    const types = await generateTypes(settings, 'Settings')
    fs.writeFileSync(path.join(parentDir, './generated-types.ts'), types)

    // TODO how to load directory structure consistently?
    for (const [slug, action] of Object.entries(destination.actions)) {
      const types = await generateTypes(action.fields, 'Payload')
      if (fs.pathExistsSync(path.join(parentDir, `${slug}`))) {
        fs.writeFileSync(path.join(parentDir, slug, 'generated-types.ts'), types)
      } else {
        fs.writeFileSync(path.join(parentDir, `./${slug}.types.ts`), types)
      }
    }
  }

  async catch(error: unknown) {
    if (this.spinner?.isSpinning) {
      this.spinner.fail()
    }
    throw error
  }
}

async function generateTypes(fields: Record<string, InputField> = {}, name: string) {
  const schema = prepareSchema(fields)

  return compile(schema, name, {
    bannerComment: '// Generated file. DO NOT MODIFY IT BY HAND.',
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
