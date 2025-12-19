import { Command, flags } from '@oclif/command'
import { loadDestination } from '../lib/destinations'
import globby from 'globby'
import type { DestinationDefinition as CloudDestinationDefinition } from '@segment/actions-core'
import type { BrowserDestinationDefinition } from '@segment/destinations-manifest'

export default class ValidateSecretFields extends Command {
  public static enableJsonFlag = true

  static description = `Returns a list of secret fields for each action in the destination.`

  static examples = [
    `$ ./bin/run validate-secret-fields`,
    `$ ./bin/run validate-secret-fields -p ./packages/destination-actions/src/destinations/hubspot/index.ts`
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static flags: flags.Input<any> = {
    help: flags.help({ char: 'h' }),
    path: flags.string({
      char: 'p',
      description: 'file path for the integration(s). Accepts glob patterns.',
      multiple: true
    })
  }

  static args = []

  async run() {
    const { flags } = this.parse(ValidateSecretFields)

    const globs = flags.path || [
      './packages/*/src/destinations/*/index.ts',
      './packages/browser-destinations/destinations/*/src/index.ts'
    ]

    const files = await globby(globs, {
      expandDirectories: false,
      gitignore: true,
      ignore: ['node_modules']
    })

    const destinationMap: Record<string, Record<string, string[]>> = {}
    const actionToSecretFields: Record<string, string[]> = {}

    const cloudDestinationRegex = new RegExp(/packages\/destination-actions\/src\/destinations\/([^/]+)\/*/i)
    const browserDestinationRegex = new RegExp(/packages\/browser-destinations\/destinations\/([^/]+)\/*/i)

    for (const file of files) {
      let filePath = file
      // extract the destination folder name from the file path
      const cloudMatch = cloudDestinationRegex.exec(file)
      const browserMatch = browserDestinationRegex.exec(file)
      if (cloudMatch) {
        const destination = cloudMatch[1]
        if (destinationMap[destination]) {
          continue
        }
        filePath = `packages/destination-actions/src/destinations/${cloudMatch[1]}/index.ts`
      } else if (browserMatch) {
        const destination = browserMatch[1]
        if (destinationMap[destination]) {
          continue
        }
        filePath = `packages/browser-destinations/destinations/${browserMatch[1]}/src/index.ts`
      }

      const destination = await loadDestination(filePath).catch((error) => {
        this.debug(`Couldn't load ${filePath}: ${error.message}`)
        return null
      })

      if (!destination) {
        continue
      }

      const settings = {
        ...(destination as BrowserDestinationDefinition).settings,
        ...(destination as CloudDestinationDefinition).authentication?.fields
      }

      destinationMap[destination.name] = { settings: [] }
      const secretFieldPattern = /(^|[^A-Za-z0-9])(key|token|secret|password|code)($|[^A-Za-z0-9])/i
      for (const [key, field] of Object.entries(settings)) {
        if (secretFieldPattern.test(key) && field.type !== 'password') {
          destinationMap[destination.name].settings.push(key)
        }
      }

      destinationMap[destination.name] = {
        ...destinationMap[destination.name],
        ...actionToSecretFields
      }
    }

    this.log(JSON.stringify(destinationMap, null, 2))
  }
}
