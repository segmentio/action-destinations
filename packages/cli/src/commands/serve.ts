import { Command, flags } from '@oclif/command'
import { ChildProcess, fork } from 'child_process'
import { autoPrompt } from '../lib/prompt'
import chalk from 'chalk'
import chokidar from 'chokidar'
import ora from 'ora'
import path from 'path'
import globby from 'globby'
import { WebSocketServer } from 'ws'
import open from 'open'
import execa from 'execa'
export default class Serve extends Command {
  private spinner: ora.Ora = ora()

  static description = `Starts a local development server to test your integration.`

  static examples = [`$ ./bin/run serve`, `$ PORT=3001 ./bin/run serve`, `$ ./bin/run serve --destination=slack`]

  // Needed to support passing Node flags to the server process
  static strict = false

  static args = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static flags: flags.Input<any> = {
    help: flags.help({ char: 'h' }),
    destination: flags.string({
      char: 'd',
      description: 'destination to serve'
    }),
    directory: flags.string({
      char: 'b',
      description: 'destination actions directory',
      default: './packages/destination-actions/src/destinations'
    }),
    noUI: flags.boolean({
      char: 'n',
      description: 'do not open actions tester UI in browser'
    }),
    browser: flags.boolean({
      char: 'r',
      description: 'serve browser destinations'
    })
  }

  async run() {
    const { argv, flags } = this.parse(Serve)
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
        type: 'select',
        name: 'selectedDestination',
        message: 'Which destination?',
        choices: integrationDirs.map((integrationPath) => {
          const [name] = integrationPath.split(path.sep).reverse()
          return {
            title: name,
            value: { name: name }
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

    const DEFAULT_PORT = 3000
    const port = parseInt(process.env.PORT ?? '', 10) || DEFAULT_PORT

    if (!flags.noUI) {
      const wss = new WebSocketServer({ port: port + 1 })

      wss.on('connection', function connection(ws) {
        watcher.on('change', () => {
          ws.send('change')
        })
      })
    }

    const start = () => {
      child = fork(require.resolve('../lib/server.ts'), {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DESTINATION: destinationName,
          DIRECTORY: flags.directory,
          TS_NODE_PROJECT: require.resolve('../../tsconfig.json'),
          ENTRY: isBrowser ? path.join('src', 'index.ts') : 'index.ts'
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

      if (flags.browser) {
        execa.command('yarn browser dev').stdout
      }
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

      if (!flags.noUI) {
        this.log(
          chalk.greenBright`Visit https://app.segment.com/dev-center/actions-tester to preview your integration.`
        )
        void open('https://app.segment.com/dev-center/actions-tester')
      }
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
