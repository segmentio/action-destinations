import { Command, flags } from '@oclif/command'
import { renderTemplates } from '../../lib/templates'
import { exec } from 'child_process'
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
    const integrationsGlob = './packages/destination-actions/src/destinations'

    let destinationName = args.destination
    if (!destinationName) {
      const integrationsPath = `${integrationsGlob}/*`
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

    const targetPath = `${integrationsGlob}/${destinationName}`
    const templatePath = path.join(__dirname, '../../../templates/actions/snapshot')

    try {
      this.spinner.start(`Creating snapshot tests for ${chalk.bold(destinationName)} destination`)
      renderTemplates(
        templatePath,
        targetPath,
        {
          destination: destinationName,
          integrationsGlob
        },
        true
      )
      this.spinner.succeed(`Created snapshot tests for ${destinationName} destination`)
    } catch (err) {
      this.spinner.fail(`Snapshot test creation failed: ${chalk.red(err.message)}`)
      this.exit()
    }

    exec(`jest --testPathPattern=${targetPath} --updateSnapshot`, (error, stdout, stderr) => {
      if (error) {
        console.log('error', error)
        return
      }

      if (stderr) {
        console.log(stderr)
        return
      }
      console.log('stdout: ', stdout)
    })
  }
}
