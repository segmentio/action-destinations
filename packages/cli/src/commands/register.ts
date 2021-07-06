import { Command, flags } from '@oclif/command'
import globby from 'globby'
import ora from 'ora'
import path from 'path'
import slugify from 'slugify'
import { loadDestination } from '../lib/destinations'
// @ts-ignore it's ok shhh
import type { CreateDestinationMetadataInput, DestinationMetadataOptions } from '../lib/control-plane-service'
import { autoPrompt } from '../lib/prompt'

const NOOP_CONTEXT = {}

export default class Register extends Command {
  private spinner: ora.Ora = ora()

  static description = `Creates a new integration on Segment.`

  static examples = [`$ segment register`]

  static flags = {
    help: flags.help({ char: 'h' })
  }

  async run() {
    const { flags } = this.parse(Register)

    // TODO support a command flag for this
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

    if (!selectedDestination) {
      this.warn('You must choose a destination. Exiting.')
      return
    }

    this.spinner.start(`Introspecting definition`)
    const destination = await loadDestination(selectedDestination.path)

    if (!destination) {
      this.spinner.fail()
      this.warn('No destination definition found. Exiting.')
      return
    } else {
      this.spinner.succeed()
    }

    const name = `Actions ${destination.name}`
    const slug = slugify(destination.slug ?? name).toLowerCase()

    if (destination.slug && destination.slug !== slug) {
      this.warn(`Your destination slug does not meet the requirements. Try \`${slug}\` instead`)
      return
    }

    // Ensure we don't already have a destination with this slug...
    this.spinner.start(`Checking availability for ${slug}`)

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { controlPlaneService } = require('../lib/control-plane-service')

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const { data, error } = await controlPlaneService.getDestinationMetadataBySlug(NOOP_CONTEXT, { slug })
    if (error?.statusCode === 404) {
      this.spinner.succeed()
    } else if (error) {
      this.spinner.fail()
      this.error(`Error checking availablity for ${slug}: ${error.message}`)
    } else if (data?.metadata) {
      this.spinner.fail()
      this.error(
        `There is already a destination registered for ${slug} named "${data.metadata.name}" that was created ${data.metadata.createdAt}.`
      )
    }

    this.spinner.start(`Preparing destination definition`)

    // We store the destination-level JSON Schema in an option with key `metadata`
    // Currently this is needed to render the UI views for action destinations
    const initialOptions: DestinationMetadataOptions = {
      // This setting is required until we switch off the legacy "data model"
      subscriptions: {
        label: 'subscriptions',
        type: 'string',
        scope: 'event_destination',
        private: false,
        encrypt: false,
        hidden: false,
        validators: [['required', `The subscriptions property is required.`]]
      }
    }

    const definition: CreateDestinationMetadataInput['input'] = {
      name,
      slug,
      type: 'action_destination',
      description: destination.description ?? '',
      status: 'PRIVATE_BUILDING',
      methods: {
        pageview: true,
        identify: true,
        alias: true,
        track: true,
        group: true
      },
      platforms: {
        browser: false,
        mobile: false,
        server: true
      },
      options: initialOptions,
      basicOptions: Object.keys(initialOptions)
    }

    this.spinner.succeed()
    this.log(`Here is the JSON you need to use to create your destination in Partner Portal:`)
    this.log(JSON.stringify(definition, null, 2))

    // TODO actually create the destination
    // const { data, error } = await controlPlaneService.createDestinationMetadata(NOOP_CONTEXT, {
    //   input: {
    //     options: metadata.options,
    //   }
    // })

    return
  }

  async catch(error: unknown) {
    if (this.spinner?.isSpinning) {
      this.spinner.fail()
    }
    throw error
  }
}
