import { Command, flags } from '@oclif/command'
import chalk from 'chalk'
import globby from 'globby'
import ora from 'ora'
import * as path from 'path'
import { autoPrompt } from '../lib/prompt'
import { loadDestination } from '../lib/destinations'
import type { JSONSchema7 } from 'json-schema'
import { DestinationDefinition } from '@segment/actions-core'

export default class GenerateTestPayload extends Command {
  private spinner: ora.Ora = ora()

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
    })
  }

  static args = []

  async run() {
    const { flags } = this.parse(GenerateTestPayload)
    let destinationName = flags.destination

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

    const targetDirectory = path.join(process.cwd(), flags.directory, destinationName, 'index.ts')
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
        await this.generatePayloadForAction(destination, slug, action, flags.port)
      }
    } else {
      const action = actions.find(([slug]) => slug === actionToGenerate)
      if (!action) {
        this.warn(`Action "${actionToGenerate}" not found. Exiting.`)
        this.exit(1)
        return
      }

      await this.generatePayloadForAction(destination, action[0], action[1], flags.port)
    }

    this.log(chalk.green(`\nDone generating test payloads! 🎉`))
  }

  async generatePayloadForAction(destination: DestinationDefinition, actionSlug: string, action: any, port: number) {
    this.spinner.start(`Generating test payload for action: ${actionSlug}`)

    try {
      // Generate sample settings based on destination settings schema
      const settings = this.generateSampleFromSchema(destination.settings || {})

      // Generate sample mapping based on action fields
      const mapping = {}
      const fields = action.fields || {}

      for (const [fieldKey, field] of Object.entries(fields)) {
        if (field.default) {
          mapping[fieldKey] = field.default
        } else if (field.required) {
          mapping[fieldKey] = this.generatePlaceholderValue(field)
        }
      }

      // Generate sample payload based on the fields
      const payload = this.generateSamplePayloadFromMapping(mapping)

      // Generate final sample request
      const sampleRequest = {
        settings,
        mapping,
        payload
      }

      this.spinner.succeed(`Generated test payload for action: ${actionSlug}`)

      // Print the curl command to the terminal
      this.log(chalk.cyan(`\n# Test payload for ${chalk.bold(destination.name)} - ${chalk.bold(actionSlug)}`))
      this.log(chalk.yellow(`curl -X POST http://localhost:${port}/${actionSlug} \\`))
      this.log(chalk.yellow(`  -H "Content-Type: application/json" \\`))
      this.log(chalk.yellow(`  -d '${JSON.stringify(sampleRequest).replace(/'/g, "\\'")}'`))
      this.log(chalk.green(`\n# Pretty version (save to a file and use with curl -d "@payload.json"):`))
      this.log(chalk.white(JSON.stringify(sampleRequest, null, 2)))
      this.log(`\n${chalk.grey('------------------------------------------------------')}\n`)
    } catch (error) {
      this.spinner.fail(`Failed to generate payload for ${actionSlug}: ${(error as Error).message}`)
    }
  }

  generateSampleFromSchema(schema: JSONSchema7): Record<string, any> {
    const result: Record<string, any> = {}

    if (!schema.properties) {
      return result
    }

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const prop = propSchema as JSONSchema7

      if (prop.default !== undefined) {
        result[propName] = prop.default
      } else if ((schema.required || []).includes(propName)) {
        result[propName] = this.generatePlaceholderForSchema(prop)
      }
    }

    return result
  }

  generatePlaceholderForSchema(schema: JSONSchema7): any {
    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type

    switch (type) {
      case 'string':
        if (schema.enum && schema.enum.length > 0) {
          return schema.enum[0]
        }
        return `YOUR_${schema.title || 'VALUE'}`
      case 'number':
      case 'integer':
        return 0
      case 'boolean':
        return false
      case 'object':
        return this.generateSampleFromSchema(schema)
      case 'array':
        if (schema.items && !Array.isArray(schema.items)) {
          return [this.generatePlaceholderForSchema(schema.items as JSONSchema7)]
        }
        return []
      default:
        return null
    }
  }

  generatePlaceholderValue(field: any): any {
    if (field.type === 'boolean') {
      return false
    } else if (field.type === 'number') {
      return 0
    } else if (field.type === 'object') {
      return {}
    } else if (field.type === 'array') {
      return []
    }

    // For string type
    return `YOUR_${field.label || field.title || 'VALUE'}`
  }

  generateSamplePayloadFromMapping(mapping: Record<string, any>): Record<string, any> {
    const payload: Record<string, any> = {}

    // Basic sample with common fields
    payload.userId = 'user123'
    payload.anonymousId = 'anon456'
    payload.event = 'Example Event'
    payload.type = 'track'
    payload.timestamp = new Date().toISOString()
    payload.properties = {}
    payload.context = {
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      page: {
        path: '/',
        url: 'https://example.com/',
        referrer: '',
        title: 'Example Page'
      }
    }

    // Add properties based on mapping
    for (const [key, value] of Object.entries(mapping)) {
      if (typeof value === 'string' && value.startsWith('$.')) {
        // Handle field value from mapping path
        const path = value.substring(2).split('.')
        if (path[0] === 'properties') {
          const propName = path.slice(1).join('.')
          payload.properties[propName] = `SAMPLE_${key.toUpperCase()}`
        } else if (path[0] === 'context') {
          const nestedPath = path.slice(1)
          let current = payload.context

          for (let i = 0; i < nestedPath.length - 1; i++) {
            if (!current[nestedPath[i]]) {
              current[nestedPath[i]] = {}
            }
            current = current[nestedPath[i]]
          }

          if (nestedPath.length > 0) {
            current[nestedPath[nestedPath.length - 1]] = `SAMPLE_${key.toUpperCase()}`
          }
        } else if (path[0] === 'traits') {
          if (!payload.traits) {
            payload.traits = {}
          }
          const propName = path.slice(1).join('.')
          payload.traits[propName] = `SAMPLE_${key.toUpperCase()}`
        } else if (path[0] === 'userId' || path[0] === 'anonymousId' || path[0] === 'event') {
          // These are already set
        } else {
          // Handle top-level fields
          payload[path[0]] = `SAMPLE_${key.toUpperCase()}`
        }
      } else if (typeof value === 'string') {
        // Handle literal values from mappings
        payload.properties[key] = value
      }
    }

    return payload
  }

  async catch(error: unknown) {
    if (this.spinner?.isSpinning) {
      this.spinner.fail()
    }
    throw error
  }
}
