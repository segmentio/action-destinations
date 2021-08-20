import { Command, flags } from '@oclif/command'
import { Destination } from '@segment/actions-core'
import { ChildProcess, fork } from 'child_process'
import chalk from 'chalk'
import chokidar from 'chokidar'
import ora from 'ora'
import path from 'path'

export default class Serve extends Command {
  private spinner: ora.Ora = ora()

  static description = `Starts a local development server to test your integration.`

  static strict = false
  static args = [{ name: 'destination', description: 'the destination to serve', required: true }]

  static examples = [`$ ./bin/run serve slack`, `$ PORT=3001 ./bin/run serve slack -p 3001`]

  static flags = {
    help: flags.help({ char: 'h' }),
    port: flags.integer({ default: 3000, description: 'port', env: 'PORT' }),
    directory: flags.string({
      char: 'd',
      description: 'destination actions directory',
      default: './packages/destination-actions/src/destinations'
    })
  }

  static destination: Destination

  async run() {
    const { args, flags } = this.parse(Serve)

    const folderPath = path.join(process.cwd(), flags.directory, args.destination)

    let child: ChildProcess | undefined

    const watcher = chokidar.watch(folderPath, {
      cwd: process.cwd()
    })

    const start = () => {
      child = fork(require.resolve('../lib/server.ts'), {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DESTINATION: args.destination,
          DIRECTORY: flags.directory
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
        stop(child)
        child.on('exit', start)
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
