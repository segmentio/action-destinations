import { Command, flags } from '@oclif/command'
import { prompt } from '@segment/actions-cli/lib/prompt'
import { diffString } from 'json-diff'
import execa from 'execa'
import chalk from 'chalk'
import { manifest } from '@segment/destinations-manifest'
import ora from 'ora'
import { assetPath } from '../config'
import type { RemotePlugin } from '../lib/control-plane-service'
import {
  getDestinationMetadatas,
  getRemotePluginByDestinationIds,
  createRemotePlugin,
  updateRemotePlugin
} from '../lib/control-plane-client'
import { build, webBundles } from '@segment/actions-cli/lib/web-bundles'
import deprecationWarning from '../lib/warning'

export default class PushBrowserDestinations extends Command {
  private spinner: ora.Ora = ora()

  static description = `Builds and uploads browser destinations to Segment's database and s3 instance. Requires \`robo stage.ssh\` or \`robo prod.ssh\` and platform-write access.`

  static examples = [`$ ./bin/run push-browser-destinations`]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static flags: flags.Input<any> = {
    help: flags.help({ char: 'h' }),
    env: flags.string({
      char: 'e',
      default: 'stage',
      env: 'NODE_ENV'
    })
  }

  static args = []

  async run() {
    const { flags } = this.parse(PushBrowserDestinations)
    await deprecationWarning(this.warn)

    const { destinationIds } = await prompt<{ destinationIds: string[] }>({
      type: 'multiselect',
      name: 'destinationIds',
      message: 'Browser Destinations:',
      choices: Object.entries(manifest).map(([id, entry]) => ({
        title: entry.definition.name,
        value: id
      }))
    })

    const path = assetPath(flags.env)

    if (!destinationIds.length) {
      this.warn(`You must select at least one destination. Exiting...`)
      this.exit()
    }

    this.spinner.start(
      `Fetching existing definitions for ${destinationIds
        .map((id) => chalk.greenBright(manifest[id].definition.name))
        .join(', ')}...`
    )
    const metadatas = await getDestinationMetadatas(destinationIds)

    this.spinner.stop()

    const notFound = destinationIds.filter((destId) => !metadatas.map((m) => m.id).includes(destId))
    if (notFound.length) {
      this.log(`Could not find destination definitions for ${notFound.map((id) => manifest[id].definition.name)}.`)
    }

    const remotePlugins: RemotePlugin[] = await getRemotePluginByDestinationIds(destinationIds)

    try {
      this.spinner.start(`Building libraries`)
      build(flags.env)
    } catch (e) {
      this.error(e)
    } finally {
      this.spinner.stop()
    }

    const pluginsToCreate = []
    const pluginsToUpdate = []

    // These destinations differ from their creation name but were published before we added that check.
    // These are exempted from the creation name check for backwards-compabitibility reasons.
    const definitionCreationNameExceptions = new Set(['Amplitude (Actions)', 'Fullstory (Actions)'])

    for (const metadata of metadatas) {
      this.spinner.start(`Saving remote plugin for ${metadata.name}`)
      const entry = manifest[metadata.id]

      const input = {
        metadataId: metadata.id,
        // The name of the remote plugin should match the creationName for consistency with our other systems,
        // as users might rely on the name of the name of the remote plugin in the integrations object.
        name: definitionCreationNameExceptions.has(entry.definition.name)
          ? entry.definition.name
          : metadata.creationName,
        // This MUST match the way webpack exports the libraryName in the umd bundle
        // TODO make this more automatic for consistency
        libraryName: `${entry.directory}Destination`,
        url: `${path}/${entry.directory}/${webBundles()[entry.directory]}`
      }

      // We expect that each definition produces a single Remote Plugin bundle
      // `metadataId` is guaranteed to be unique
      const existingPlugin = remotePlugins.find((p) => p.metadataId === metadata.id)

      if (
        metadata.creationName !== entry.definition.name &&
        !definitionCreationNameExceptions.has(entry.definition.name)
      ) {
        this.spinner.fail()
        throw new Error(
          `The definition name '${entry.definition.name}' should always match the control plane creationName '${metadata.creationName}'.`
        )
      }

      if (existingPlugin) {
        pluginsToUpdate.push(input)
      } else {
        pluginsToCreate.push(input)
      }
    }

    const diff = diffString(asJson(remotePlugins), asJson([...pluginsToUpdate, ...pluginsToCreate]))

    if (diff) {
      this.spinner.warn(`Please review the following changes:`)
      this.log(`\n${diff}`)
    } else {
      this.spinner.info(`No changes. Skipping.`)
      this.exit()
    }

    const { shouldContinue } = await prompt({
      type: 'confirm',
      name: 'shouldContinue',
      message: `Publish changes?`,
      initial: false
    })

    if (!shouldContinue) {
      this.exit()
    }

    try {
      this.spinner.start(`Syncing all plugins to s3`)
      await syncToS3(flags.env)
      this.spinner.stop()
      this.log(`Plugins synced to s3`)
    } catch (e) {
      this.error(e)
    } finally {
      this.spinner.stop()
    }

    try {
      this.spinner.start('Persisting changes')
      await Promise.all([
        pluginsToUpdate.map((p) => updateRemotePlugin(p)),
        pluginsToCreate.map((p) => createRemotePlugin(p))
      ])
    } catch (e) {
      this.error(e)
    } finally {
      this.spinner.stop()
    }
  }
}

async function syncToS3(env: string): Promise<string> {
  if (env === 'production') {
    return execa.commandSync(`yarn lerna run deploy-prod`).stdout
  }

  return execa.commandSync(`yarn lerna run deploy-stage`).stdout
}

function asJson(obj: unknown) {
  return JSON.parse(JSON.stringify(obj))
}
