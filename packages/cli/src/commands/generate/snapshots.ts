import { Command, flags } from '@oclif/command'
import { renderTemplates } from '../../lib/templates'
import { execSync } from 'child_process'
import { autoPrompt } from '../../lib/prompt'
import chalk from 'chalk'
import path from 'path'
import ora from 'ora'
import globby from 'globby'

export default class GenerateSnapshots extends Command {
  private spinner: ora.Ora = ora()
  static description = `Generates TypeScript definitions for an integration.`

  static examples = [`$ ./bin/run generate:snapshots`, `$ ./bin/run generate:snapshots slack`]

  static flags = {
    help: flags.help({ char: 'h' })
  }

  static args = [{ name: 'destination', description: 'destination name' }]

  async run() {
    const { args } = this.parse(GenerateSnapshots)
    const destinationActionsPath = './packages/destination-actions'
    const destinationsPath = `${destinationActionsPath}/src/destinations`

    let destinationName = args.destination
    if (!destinationName) {
      const integrationsPath = `${destinationsPath}/*`
      const integrationDirs = await globby(integrationsPath, {
        expandDirectories: false,
        onlyDirectories: true,
        gitignore: true,
        ignore: ['node_modules']
      })

      const { selectedDestination } = await autoPrompt<{ selectedDestination: { name: string } }>(args, {
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

    const targetPath = `${destinationsPath}/${destinationName}`
    const templatePath = path.join(__dirname, '../../../templates/actions/snapshot')

    try {
      this.spinner.start(`Creating snapshot tests for ${chalk.bold(destinationName)} destination`)
      renderTemplates(
        templatePath,
        targetPath,
        {
          destination: destinationName,
          destinationsPath
        },
        true
      )
      this.spinner.succeed(`Created snapshot tests for ${destinationName} destination`)
    } catch (err) {
      this.spinner.fail(`Snapshot test creation failed: ${chalk.red(err.message)}`)
      this.exit()
    }

    try {
      execSync(`jest --testPathPattern=${targetPath} --config ${destinationActionsPath}/package.json`)
    } catch (err) {
      this.spinner.fail(`Failed running snapshot tests: ${err}`)
    }
  }
}
