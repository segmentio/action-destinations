import { Command, flags } from '@oclif/command'
import { ChildProcess, fork } from 'child_process'
import chalk from 'chalk'
import chokidar from 'chokidar'
import ora from 'ora'
import path from 'path'
import { prompt } from '../lib/prompt'
import { sortBy, mergeWith } from 'lodash'
import { manifest as cloudManifest, ManifestEntry as CloudManifest } from '@segment/action-destinations'
import { manifest as browserManifest, ManifestEntry as BrowserManifest } from '@segment/browser-destinations'

const DEFAULT_PORT = 3000

const manifest: Record<string, CloudManifest | BrowserManifest> = mergeWith(
  {},
  cloudManifest,
  browserManifest,
  (objValue: any, srcValue: any) => {
    if (Object.keys(objValue?.definition?.actions ?? {}).length === 0) {
      return
    }

    for (const [actionKey, action] of Object.entries(srcValue.definition?.actions ?? {})) {
      if (actionKey in objValue.definition.actions) {
        throw new Error(
          `Could not merge browser + cloud actions because there is already an action with the same key "${actionKey}"`
        )
      }

      objValue.definition.actions[actionKey] = action
    }

    return objValue
  }
)

export default class Serve extends Command {
  private spinner: ora.Ora = ora()

  static description = `Starts a local development server to test your integration.`

  static examples = [`$ ./bin/run serve`, `$ PORT=3001 ./bin/run serve`]

  static flags = {
    help: flags.help({ char: 'h' }),
    port: flags.integer({ default: DEFAULT_PORT, description: 'port', env: 'PORT' }),
    directory: flags.string({
      char: 'd',
      description: 'destination actions directory',
      default: './packages/destination-actions/src/destinations'
    })
  }

  async run() {
    const argv = this.parse(Serve)

    const { metadataId } = await prompt<{ metadataId: string }>({
      type: 'select',
      name: 'metadataId',
      message: 'Choose a definition:',
      choices: sortBy(Object.entries(manifest), '[1].definition.name').map(([metadataId, entry]) => ({
        title: entry.definition.name,
        value: metadataId
      }))
    })

    const destination = manifest[metadataId].directory
    const folderPath = path.join(process.cwd(), argv.flags.directory, destination)

    let child: ChildProcess | undefined

    const watcher = chokidar.watch(folderPath, {
      cwd: process.cwd()
    })

    const start = () => {
      child = fork(require.resolve('../lib/server.ts'), {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DESTINATION: destination,
          DIRECTORY: argv.flags.directory
        },
        execArgv: ['-r', 'ts-node/register/transpile-only']
      })

      child.once('exit', (code?: number) => {
        // @ts-ignore custom property
        if (!child.respawn) process.exit(code)
        child?.removeAllListeners()
        child = undefined
      })
    }

    watcher.on('change', (file) => {
      this.log(chalk.greenBright`Restarting... ${file} has been modified`)

      if (child) {
        // Child is still running, restart upon exit
        child.on('exit', start)
        stop(child)
      } else {
        // Child is already stopped, probably due to a previous error
        start()
      }
    })

    watcher.on('error', (error) => {
      this.error(`Error: ${error.message}`)
    })

    watcher.once('ready', () => {
      this.log(chalk.greenBright`Watching required files for changes .. `)
    })

    start()
  }

  async catch(error: unknown) {
    if (this.spinner?.isSpinning) {
      this.spinner.fail()
    }
    throw error
  }
}

function stop(process?: ChildProcess) {
  if (process) {
    // @ts-ignore custom propertiy
    process.respawn = true
    process.kill('SIGTERM')
  }
}
