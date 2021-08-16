import { Command, flags } from '@oclif/command'
import chalk from 'chalk'
import ora from 'ora'
import path from 'path'
import http, { IncomingMessage, ServerResponse } from 'http'
import { Destination, DestinationDefinition } from '@segment/actions-core'
import getExchanges from '../lib/http'

export default class Serve extends Command {
  private spinner: ora.Ora = ora()
  private destination: Destination<any> // TODO Set by configured destination

  static description = `Starts a long-running local destination actions server.`

  static examples = [
    `$ ./bin/run generate:serve`,
    `$ ./bin/run generate:serve slack`
  ]

  static flags = {
    help: flags.help({ char: 'h' }),
    port: flags.integer({ char: 'p', default: 3000, description: 'port' }),
    directory: flags.string({
      char: 'd',
      description: 'destination actions directory',
      default: './packages/destination-actions/src/destinations'
    })
  }

  static args = [
    { name: 'destination', description: 'the destination to serve', required: true }
  ]

  parseArgs() {
    return this.parse(Serve)
  }

  async run() {
    const { args, flags } = this.parseArgs()

    // For now, include the slug in the path, but when we support external repos, we'll have to change this
    const relativePath = path.join(flags.directory, args.destination, 'index.ts')
    const targetDirectory = path.join(process.cwd(), relativePath)

    let def: DestinationDefinition
    try {
      this.spinner.start(chalk`loading destination from '${args.destination}'`)

      def = await import(targetDirectory)
        .then((mod) => mod.default)
    } catch (err) {
      this.spinner.fail()
      this.error(`Failed to import default export from '${targetDirectory}': ${err.message}`)
    }

    // Loose validation on a destination definition
    if (!def?.name || typeof def?.actions !== 'object') {
      this.spinner.fail()
      this.error(`No valid destination definition found in '${targetDirectory}'`)
    }

    this.destination = new Destination(def)

    try {
      this.spinner.start(chalk`attaching actions server to port ${flags.port}`)
      const server = http.createServer()
      server.on('request', this.handleRequest)
      server.listen(flags.port)
      this.spinner.succeed()
    } catch (err) {
      this.spinner.fail(chalk`attaching actions server to port ${flags.port}: ${err.message}`)
      this.exit()
    }
  }

  async catch(error: unknown) {
    if (this.spinner?.isSpinning) {
      this.spinner.fail()
    }
    throw error
  }

  async handleRequest(req: IncomingMessage, res: ServerResponse) {
    switch (req.url) {
      case '/action':
        await this.handleAction(req, res)
        break
      default:
        res.writeHead(404)
        res.end('Endpoint not find. Try /action.')
    }
  }

  async handleAction(req: IncomingMessage, res: ServerResponse) {
    const { args } = this.parseArgs()

    try {
      this.spinner.start(chalk`Handling ${args.destination} action request`)
      const { action: actionSlug, payload } = await this.parseJsonBody(req)
      const action = this.destination.actions[actionSlug]
      await action.execute({
        payload,
        cachedFields: {},
        settings: {}
      })
      const debug = await getExchanges(this.destination.responses)
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(200)
      res.write(JSON.stringify(debug, null, 4))
      res.end()
      this.spinner.succeed(chalk`${this.destination.name} action '${actionSlug}' completed with some code`)
    } catch (err) {
      res.writeHead(500)
      res.write(err.message)
      res.end()
    }
  }

  parseJsonBody(req: IncomingMessage): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      let data = ''

      req.on('data', chunk => {
        data += chunk
      })
      req.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (err) {
          reject(err)
        }
      })
      req.on('error', reject)
    })
  }
}