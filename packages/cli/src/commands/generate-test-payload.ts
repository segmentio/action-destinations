import { Command, flags } from '@oclif/command'
import chalk from 'chalk'
import globby from 'globby'
import ora from 'ora'
import * as path from 'path'
import { autoPrompt } from '../lib/prompt'
import { loadDestination } from '../lib/destinations'
import { DestinationDefinition } from '../lib/destinations'
import { InputField, BaseActionDefinition } from '@segment/actions-core'
import {
  generateSamplePayloadFromMapping,
  generateDestinationSettings,
  generateAudienceSettings,
  addAudienceSettingsToPayload,
  generateSampleFromSchema
} from '../lib/payload-generator/payload'
import {
  API_ENDPOINTS,
  ApiEndpoint,
  getApiEndpointByName,
  getFormattedPath
} from '../lib/payload-generator/api-definitions'

export default class GenerateTestPayload extends Command {
  private spinner: ora.Ora = ora()

  static description = `Generates sample test payload curl commands for different APIs in a cloud mode destination.`

  static examples = [
    `$ ./bin/run generate-test-payload`,
    `$ ./bin/run generate-test-payload --destination=slack`,
    `$ ./bin/run generate-test-payload --destination=slack --action=postToChannel`,
    `$ ./bin/run generate-test-payload --destination=slack --api="Execute Action"`,
    `$ ./bin/run generate-test-payload --destination=slack --api="Create Audience"`
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
    api: flags.boolean({
      description: 'prompt for API Selection'
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
    let selectedApiEndpoint: ApiEndpoint | undefined = getApiEndpointByName('Execute Action')

    // Get the API endpoint based on the flag if provided
    if (flags.api) {
      // Prompt for API selection instead of exiting
      const { selectedApi } = await autoPrompt<{ selectedApi: string }>(flags, {
        type: 'select',
        name: 'selectedApi',
        message: 'Please select a valid API endpoint:',
        choices: API_ENDPOINTS.map((api) => ({
          title: api.name === 'Execute Action' ? 'Execute Action (default)' : api.name,
          value: api.name
        }))
      })
      selectedApiEndpoint = getApiEndpointByName(selectedApi)
    }

    if (!selectedApiEndpoint) {
      this.warn('No valid API endpoint selected. Exiting.')
      this.exit(1)
    }

    this.spinner.info(`Generating test payload for API: ${selectedApiEndpoint.name}`)

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

    this.spinner.succeed(`Successfully loaded destination: ${destinationName}`)

    // If Execute Action API is selected, proceed with action selection
    if (selectedApiEndpoint.name === 'Execute Action') {
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
    } else {
      // Generate payload for selected API endpoint
      await this.generatePayloadForApi(destination, selectedApiEndpoint)
    }

    this.log(chalk.green(`\nDone generating test payloads! 🎉`))
  }

  async generatePayloadForAction(destination: DestinationDefinition, actionSlug: string, action: any) {
    this.spinner.start(`Generating test payload for action: ${actionSlug}`)

    try {
      // Generate destination settings and auth
      const { settings, auth } = generateDestinationSettings(destination)

      // Get audience settings
      const audienceSettings = generateAudienceSettings(destination)

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

      const defaultSubscription = (action as BaseActionDefinition).defaultSubscription

      // Generate sample payload based on the fields.
      let payload = generateSamplePayloadFromMapping(mapping, fields, defaultSubscription)

      // Add audience settings to payload if they exist
      if (Object.keys(audienceSettings).length > 0) {
        payload = addAudienceSettingsToPayload(payload, destination)
      }

      // Generate final sample request
      const sampleRequest = this.generateSampleRequest(settings, mapping, payload, auth)

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

  /**
   * Generates a complete test request for a destination action.
   */
  generateSampleRequest(
    settings: unknown,
    mapping: Record<string, any>,
    payload: Record<string, any>,
    auth?: unknown
  ): Record<string, any> {
    return {
      settings,
      mapping,
      payload,
      auth,
      features: {
        feature1: true,
        feature2: false
      },
      subscriptionMetadata: {
        actionConfigId: 'YOUR_ACTION_CONFIG_ID',
        destinationConfigId: 'YOUR_DESTINATION_CONFIG_ID',
        actionId: 'YOUR_ACTION_ID',
        sourceId: 'YOUR_SOURCE_ID'
      }
    }
  }

  /**
   * Generate payload for a specific API endpoint
   */
  async generatePayloadForApi(destination: DestinationDefinition, apiEndpoint: ApiEndpoint) {
    this.spinner.start(`Generating test payload for API: ${apiEndpoint.name}`)

    try {
      // Generate destination settings and auth
      const { settings, auth } = generateDestinationSettings(destination)

      // Get audience settings if needed
      const audienceSettings = generateAudienceSettings(destination)
      const audienceSettingsValues =
        Object.keys(audienceSettings).length > 0 ? generateSampleFromSchema(audienceSettings || {}) : {}

      // Start with the template payload from the API definition
      const request = { ...apiEndpoint.requestTemplate }

      // Fill in settings and auth if the payload has those fields
      if ('settings' in request && !Object.keys(request.settings).length) {
        request.settings = settings
      }

      if ('auth' in request && !Object.keys(request.auth || {}).length && auth) {
        request.auth = auth
      }

      // Fill in audience settings if applicable
      if ('audienceSettings' in request && !Object.keys(request.audienceSettings || {}).length) {
        request.audienceSettings = audienceSettingsValues
      }

      if ('payload' in request) {
        const baseEvent = generateSamplePayloadFromMapping({}, {})
        const isDeleteHandler = apiEndpoint.name === 'Invoke Delete Handler'
        request.payload = {
          ...baseEvent,
          type: isDeleteHandler ? 'delete' : 'track',
          traits: {}
        }
      }

      // Handle path parameters if needed
      const pathParams: Record<string, string> = {}
      if (apiEndpoint.pathParams) {
        // For now we'll use placeholders, but in the future we could prompt for these values
        for (const param of apiEndpoint.pathParams) {
          pathParams[param.key] = param.placeholder
        }
      }

      // Format the path with any parameters
      const formattedPath = getFormattedPath(apiEndpoint, pathParams)

      this.spinner.succeed(`Generated test payload for API: ${apiEndpoint.name}`)

      // Print the curl command to the terminal
      this.log(chalk.cyan(`\n# Test payload for ${chalk.bold(destination.name)} - ${chalk.bold(apiEndpoint.name)}`))

      if (apiEndpoint.method === 'GET') {
        this.log(chalk.yellow(`curl -X GET http://localhost:3000${formattedPath}`))
      } else {
        this.log(chalk.yellow(`curl -X ${apiEndpoint.method} http://localhost:3000${formattedPath} \\`))
        this.log(chalk.yellow(`  -H "Content-Type: application/json" \\`))
        this.log(chalk.yellow(`  -d '${JSON.stringify(request).replace(/'/g, "\\'")}'`))
      }
    } catch (error) {
      this.spinner.fail(`Failed to generate payload for API ${apiEndpoint.name}: ${(error as Error).message}`)
    }
  }

  async catch(error: unknown) {
    if (this.spinner?.isSpinning) {
      this.spinner.fail()
    }
    throw error
  }
}
