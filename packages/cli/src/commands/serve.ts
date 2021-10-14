import { Command, flags } from '@oclif/command'
import { ChildProcess, fork } from 'child_process'
import { autoPrompt } from '../lib/prompt'
import chalk from 'chalk'
import chokidar from 'chokidar'
import ora from 'ora'
import path from 'path'
import globby from 'globby'

export default class Serve extends Command {
  private spinner: ora.Ora = ora()

  static description = `Starts a local development server to test your integration.`

  static examples = [`$ ./bin/run serve`, `$ PORT=3001 ./bin/run serve`, `$ ./bin/run serve --destination=slack`]

  // Needed to support passing Node flags to the server process
  static strict = false

  static args = []

  static flags = {
    help: flags.help({ char: 'h' }),
    destination: flags.string({
      char: 'd',
      description: 'destination to serve'
    }),
    directory: flags.string({
      char: 'b',
      description: 'destination actions directory',
      default: './packages/destination-actions/src/destinations'
    })
  }

  async run() {
    const { argv, flags } = this.parse(Serve)
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
        type: 'select',
        name: 'selectedDestination',
        message: 'Which destination?',
        choices: integrationDirs.map((integrationPath) => {
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

    const folderPath = path.join(process.cwd(), flags.directory, destinationName)

    let child: ChildProcess | null | undefined = null

    const watcher = chokidar.watch(folderPath, {
      cwd: process.cwd()
    })

    const start = () => {
      child = fork(require.resolve('../lib/server.ts'), {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DESTINATION: destinationName,
          DIRECTORY: flags.directory,
          TS_NODE_PROJECT: require.resolve('../../tsconfig.json')
        },
        execArgv: [
          '-r',
          'ts-node/register/transpile-only',
          '-r',
          'tsconfig-paths/register',
          '-r',
          'dotenv/config',
          ...argv
        ]
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
