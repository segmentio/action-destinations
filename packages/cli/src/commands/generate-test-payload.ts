import { Command, flags } from '@oclif/command'
import chalk from 'chalk'
import globby from 'globby'
import ora from 'ora'
import * as path from 'path'
import { autoPrompt } from '../lib/prompt'
import { loadDestination } from '../lib/destinations'
import { DestinationDefinition } from '../lib/destinations'
import { BrowserDestinationDefinition } from '@segment/destinations-manifest'
import {
  GlobalSetting,
  isDirective,
  DestinationDefinition as CloudModeDestinationDefinition,
  InputField,
  AudienceDestinationDefinition
} from '@segment/actions-core'
import Chance from 'chance'
import { getRawKeys } from '@segment/actions-core/mapping-kit/value-keys'
import { set } from 'lodash'
export default class GenerateTestPayload extends Command {
  private spinner: ora.Ora = ora()
  private chance: Chance.Chance = new Chance('Payload')

  static description = `Generates sample test payload curl commands for a cloud mode destination.`

  static examples = [
    `$ ./bin/run generate-test-payload`,
    `$ ./bin/run generate-test-payload --destination=slack`,
    `$ ./bin/run generate-test-payload --destination=slack --action=postToChannel`
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static flags: flags.Input<any> = {
    help: flags.help({ char: 'h' }),
    destination: flags.string({
      char: 'd',
      description: 'destination to generate test payloads for'
    }),
    action: flags.string({
      char: 'a',
      description: 'specific action to generate test payload for'
    }),
    directory: flags.string({
      char: 'p',
      description: 'destination actions directory path',
      default: './packages/destination-actions/src/destinations'
    }),
    browser: flags.boolean({
      char: 'r',
      description: 'generate payloads for browser destinations'
    })
  }

  static args = []

  async run() {
    const { flags } = this.parse(GenerateTestPayload)
    let destinationName = flags.destination
    const isBrowser = !!flags.browser

    if (!destinationName) {
      const integrationsGlob = `${flags.directory}/*`
      const integrationDirs = await globby(integrationsGlob, {
        expandDirectories: false,
        onlyDirectories: true,
        gitignore: true,
        ignore: ['node_modules']
      })

      const { selectedDestination } = await autoPrompt<{ selectedDestination: { name: string } }>(flags, {
        type: 'autocomplete',
        name: 'selectedDestination',
        message: 'Which destination?',
        choices: integrationDirs.map((integrationPath: string) => {
          const [name] = integrationPath.split(path.sep).reverse()
          return {
            title: name,
            value: { name }
          }
        })
      })

      if (selectedDestination) {
        destinationName = selectedDestination.name
      }
    }

    if (!destinationName) {
      this.warn('You must select a destination. Exiting.')
      this.exit()
    }

    this.spinner.start(`Loading destination: ${destinationName}`)

    const cloudEntry = path.join(process.cwd(), flags.directory, destinationName, 'index.ts')
    const browserEntry = path.join(process.cwd(), flags.directory, destinationName, 'src', 'index.ts')
    const targetDirectory = isBrowser ? browserEntry : cloudEntry

    const destination = await loadDestination(targetDirectory)
    if (!destination) {
      this.error(`Failed to load destination: ${destinationName}`)
    }

    const actions = Object.entries(destination.actions)

    if (actions.length === 0) {
      this.warn('No actions found for this destination.')
      this.exit()
    }

    let actionToGenerate = flags.action

    if (!actionToGenerate && actions.length > 1) {
      const { selectedAction } = await autoPrompt<{ selectedAction: string }>(flags, {
        type: 'select',
        name: 'selectedAction',
        message: 'Which action to generate test payload for?',
        choices: [
          { title: 'All actions', value: 'all' },
          ...actions.map(([slug, action]) => ({
            title: action.title || slug,
            value: slug
          }))
        ]
      })

      actionToGenerate = selectedAction
    } else if (!actionToGenerate) {
      actionToGenerate = 'all'
    }

    this.log(chalk.bold('\nTest Payload curl commands:'))

    if (actionToGenerate === 'all') {
      for (const [slug, action] of actions) {
        await this.generatePayloadForAction(destination, slug, action)
      }
    } else {
      const action = actions.find(([slug]) => slug === actionToGenerate)
      if (!action) {
        this.warn(`Action "${actionToGenerate}" not found. Exiting.`)
        this.exit(1)
        return
      }

      await this.generatePayloadForAction(destination, action[0], action[1])
    }

    this.log(chalk.green(`\nDone generating test payloads! 🎉`))
  }

  async generatePayloadForAction(destination: DestinationDefinition, actionSlug: string, action: any) {
    this.spinner.start(`Generating test payload for action: ${actionSlug}`)

    try {
      let settings: unknown
      if ((destination as BrowserDestinationDefinition).mode == 'device') {
        // Generate sample settings based on destination settings schema
        const destinationSettings = (destination as BrowserDestinationDefinition).settings
        settings = this.generateSampleFromSchema(destinationSettings || {})
      } else if ((destination as CloudModeDestinationDefinition).mode == 'cloud') {
        const destinationSettings = (destination as CloudModeDestinationDefinition).authentication?.fields
        settings = this.generateSampleFromSchema(destinationSettings || {})
        if ((destination as CloudModeDestinationDefinition).authentication?.scheme === 'oauth2') {
          settings = {
            oauth: {
              accessToken: 'YOUR_ACCESS_TOKEN',
              refreshToken: 'YOUR_REFRESH_TOKEN'
            }
          }
        }
      }

      const audienceSettings = {
        ...(destination as AudienceDestinationDefinition)?.audienceFields
      }

      // Generate sample mapping based on action fields
      const mapping = {} as Record<string, any>
      const fields = (action.fields || {}) as Record<string, InputField>

      for (const [fieldKey, field] of Object.entries(fields)) {
        if (field.default) {
          mapping[fieldKey] = field.default
        } else if (field.choices) {
          // if choices is array of string, pick the first one
          // if choices is array of {label: string, value: string}, then pick the value of the first one
          mapping[fieldKey] = typeof field.choices[0] === 'string' ? field.choices[0] : field.choices[0].value
        }
      }

      // Generate sample payload based on the fields
      const payload = this.generateSamplePayloadFromMapping(mapping)

      // if audience settings exist, add them to the payload
      if (audienceSettings) {
        set(payload, 'context.personas.audience_settings', this.generateSampleFromSchema(audienceSettings || {}))
      }

      // Generate final sample request
      const sampleRequest = {
        settings,
        mapping,
        payload
      }

      this.spinner.succeed(`Generated test payload for action: ${actionSlug}`)

      // Print the curl command to the terminal
      this.log(chalk.cyan(`\n# Test payload for ${chalk.bold(destination.name)} - ${chalk.bold(actionSlug)}`))
      this.log(chalk.yellow(`curl -X POST http://localhost:3000/${actionSlug} \\`))
      this.log(chalk.yellow(`  -H "Content-Type: application/json" \\`))
      this.log(chalk.yellow(`  -d '${JSON.stringify(sampleRequest).replace(/'/g, "\\'")}'`))
    } catch (error) {
      this.spinner.fail(`Failed to generate payload for ${actionSlug}: ${(error as Error).message}`)
    }
  }

  generateSampleFromSchema(schema: Record<string, GlobalSetting>): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [propName, setting] of Object.entries(schema)) {
      if (setting.default !== undefined) {
        result[propName] = setting.default
      } else {
        result[propName] = this.generatePlaceholderForSchema(setting)
      }
    }

    return result
  }

  generatePlaceholderForSchema(schema: GlobalSetting): any {
    const type = schema.type

    switch (type) {
      case 'string':
        if (schema.choices) {
          return schema.choices[0]
        }
        return `<${schema.label || 'VALUE'}>`
      case 'number':
        return 0
      case 'boolean':
        return false
      case 'password':
        return `<${schema.label || 'PASSWORD'}>`
      default:
        return null
    }
  }

  generateSamplePayloadFromMapping(mapping: Record<string, any>): Record<string, any> {
    const chance = new Chance('payload')
    const payload: Record<string, any> = {
      userId: chance.guid(),
      anonymousId: chance.guid(),
      event: 'Example Event',
      type: 'track',
      timestamp: new Date().toISOString(),
      properties: {},
      context: {
        ip: chance.ip(),
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        page: {
          path: `/${chance.word()}`,
          url: chance.url(),
          referrer: chance.url(),
          title: `${chance.capitalize(chance.word())} ${chance.capitalize(chance.word())}`
        },
        locale: chance.locale(),
        library: {
          name: 'analytics.js',
          version: `${chance.integer({ min: 1, max: 5 })}.${chance.integer({ min: 0, max: 20 })}.${chance.integer({
            min: 0,
            max: 99
          })}`
        }
      }
    }

    // Add properties based on mapping with better values
    for (const [_, value] of Object.entries(mapping)) {
      if (isDirective(value)) {
        const [key] = getRawKeys(value)
        const path = key.replace('$.', '')
        set(payload, path, this.generateValueByFieldName(path))
      }
    }

    return payload
  }

  generateValueByFieldName(fieldName: string): any {
    const lowerFieldName = fieldName.toLowerCase()

    // Check for common field name patterns
    if (lowerFieldName.includes('email')) {
      return this.chance.email()
    } else if (lowerFieldName.includes('phone') || lowerFieldName.includes('mobile')) {
      return `+${this.chance.phone({ formatted: false })}`
    } else if (lowerFieldName.includes('name')) {
      if (lowerFieldName.includes('first')) {
        return this.chance.first()
      } else if (lowerFieldName.includes('last')) {
        return this.chance.last()
      } else if (lowerFieldName.includes('full')) {
        return this.chance.name()
      } else {
        return this.chance.name()
      }
    } else if (lowerFieldName.includes('url') || lowerFieldName.includes('link')) {
      return this.chance.url()
    } else if (lowerFieldName.includes('date')) {
      return this.chance.date().toISOString()
    } else if (lowerFieldName.includes('time')) {
      return this.chance.date().toISOString()
    } else if (
      lowerFieldName.includes('price') ||
      lowerFieldName.includes('amount') ||
      lowerFieldName.includes('total')
    ) {
      return this.chance.floating({ min: 1, max: 1000, fixed: 2 })
    } else if (lowerFieldName.includes('currency')) {
      return this.chance.currency().code
    } else if (lowerFieldName.includes('country')) {
      return this.chance.country()
    } else if (lowerFieldName.includes('city')) {
      return this.chance.city()
    } else if (lowerFieldName.includes('state') || lowerFieldName.includes('province')) {
      return this.chance.state()
    } else if (lowerFieldName.includes('zip') || lowerFieldName.includes('postal')) {
      return this.chance.zip()
    } else if (lowerFieldName.includes('address')) {
      return this.chance.address()
    } else if (lowerFieldName.includes('company') || lowerFieldName.includes('organization')) {
      return this.chance.company()
    } else if (lowerFieldName.includes('description')) {
      return this.chance.paragraph()
    } else if (lowerFieldName.includes('id')) {
      return this.chance.guid()
    } else if (lowerFieldName.includes('quantity') || lowerFieldName.includes('count')) {
      return this.chance.integer({ min: 1, max: 10 })
    } else if (lowerFieldName.includes('age')) {
      return this.chance.age()
    } else if (lowerFieldName === 'gender') {
      return this.chance.gender()
    } else if (
      lowerFieldName.includes('boolean') ||
      lowerFieldName.includes('enabled') ||
      lowerFieldName.includes('active')
    ) {
      return this.chance.bool()
    } else {
      // Default fallback
      return this.chance.word()
    }
  }

  async catch(error: unknown) {
    if (this.spinner?.isSpinning) {
      this.spinner.fail()
    }
    throw error
  }
}
