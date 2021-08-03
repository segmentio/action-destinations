import { Command, flags } from '@oclif/command'
import globby from 'globby'
import ora from 'ora'
import path from 'path'
import os from 'os'
import { loadDestination } from '../lib/destinations'
import { controlPlaneService } from '../lib/control-plane-service'
import type { CreateDestinationMetadataInput } from '../lib/control-plane-service'
import { autoPrompt, prompt } from '../lib/prompt'
import { generateSlug } from '../lib/slugs'

const NOOP_CONTEXT = {}

export default class Register extends Command {
  private spinner: ora.Ora = ora()

  static description = `Creates a new integration on Segment.`

  static examples = [`$ ./bin/run register`]

  static flags = {
    help: flags.help({ char: 'h' }),
    path: flags.string({ char: 'p', description: 'Path to the destination to register.' }),
    env: flags.enum({
      char: 'e',
      description: 'Create the destination in a specific environment',
      options: ['production', 'stage'],
      default: 'production',
      // We don't want to show this in `--help`
      hidden: true
    })
  }

  async run() {
    const { flags } = this.parse(Register)

    let destinationPath = flags.path
    if (!destinationPath) {
      const integrationsGlob = './packages/destination-actions/src/destinations/*'
      const integrationDirs = await globby(integrationsGlob, {
        expandDirectories: false,
        onlyDirectories: true,
        gitignore: true,
        ignore: ['node_modules']
      })

      const { selectedDestination } = await autoPrompt<{ selectedDestination: { path: string; name: string } }>(flags, {
        type: 'select',
        name: 'selectedDestination',
        message: 'Which integration?',
        choices: integrationDirs.map((integrationPath) => {
          const [name] = integrationPath.split(path.sep).reverse()
          return {
            title: name,
            value: { path: integrationPath, name }
          }
        })
      })

      if (selectedDestination) {
        destinationPath = selectedDestination.path
      }
    }

    if (!destinationPath) {
      this.warn('You must select a destination. Exiting.')
      this.exit()
    }

    this.spinner.start(`Introspecting definition`)
    const destination = await loadDestination(destinationPath)

    if (!destination) {
      this.spinner.fail()
      this.warn('No destination definition found. Exiting.')
      this.exit()
    } else {
      this.spinner.succeed()
    }

    const name = destination.name.includes('Actions') ? destination.name : `${destination.name} (Actions)`
    const slug = generateSlug(destination.slug ?? name)

    if (destination.slug && destination.slug !== slug) {
      this.warn(`Your destination slug does not meet the requirements. Try \`${slug}\` instead`)
      this.exit()
    }

    // Ensure we don't already have a destination with this slug...
    await this.isDestinationSlugAvailable(slug)

    this.spinner.start(`Preparing destination definition`)

    const actions = Object.values(destination.actions)
    const hasBrowserActions = actions.some((action) => action.platform === 'web')
    const hasCloudActions = actions.some((action) => !action.platform || action.platform === 'cloud')

    const definition: CreateDestinationMetadataInput['input'] = {
      name,
      slug,
      type: 'action_destination',
      description: destination.description ?? `${name}`,
      status: 'PRIVATE_BUILDING',
      methods: {
        pageview: true,
        identify: true,
        alias: true,
        track: true,
        group: true
      },
      platforms: {
        browser: hasBrowserActions,
        server: hasCloudActions,
        mobile: false
      },
      options: {},
      basicOptions: []
    }

    this.spinner.succeed()

    this.log(`Please review the definition before continuing:`)
    this.log(`\n${JSON.stringify(definition, null, 2)}`)

    // Loosely verify that we are on the production workbench, unless explicitly targeting stage
    const hostname = os.hostname()
    const isWorkbench = hostname.startsWith('workbench-') && hostname.includes(`-${flags.env}-`)
    if (!isWorkbench && flags.env !== 'stage') {
      this.warn(`You must be logged into the ${flags.env} workbench to register your destination. Exiting.`)
      this.exit()
    }

    const { shouldContinue } = await prompt({
      type: 'confirm',
      name: 'shouldContinue',
      message: `Do you want to register "${name}"?`,
      initial: false
    })

    if (!shouldContinue) {
      this.log('Exiting without registering.')
    }

    await this.createDestinationMetadata(definition)
  }

  async catch(error: unknown) {
    if (this.spinner?.isSpinning) {
      this.spinner.fail()
    }
    throw error
  }

  private async isDestinationSlugAvailable(slug: string): Promise<boolean> {
    this.spinner.start(`Checking availability for ${slug}`)

    const { error } = await controlPlaneService.getDestinationMetadataBySlug(NOOP_CONTEXT, { slug })
    if (error?.statusCode === 404) {
      this.spinner.succeed()
      return true
    } else if (error) {
      this.spinner.fail()
      this.error(`Error checking availablity for ${slug}: ${error.message}`)
    } else {
      this.spinner.warn()
      this.warn(`There is already a destination with the slug "${slug}". Exiting.`)
      this.exit()
    }
  }

  private async createDestinationMetadata(input: CreateDestinationMetadataInput['input']): Promise<void> {
    this.spinner.start(`Registering ${input.name}`)

    const { data, error } = await controlPlaneService.createDestinationMetadata(NOOP_CONTEXT, { input })

    if (data?.metadata) {
      this.spinner.succeed()
      this.log(`Successfully registered destination with id:`)
      this.log(`\n${data.metadata.id}`)
    } else {
      this.spinner.fail()
      this.error(`Error registering destination: ${error?.message}`)
    }
  }
}
