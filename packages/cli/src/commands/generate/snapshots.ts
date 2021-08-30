import { Command, flags } from '@oclif/command'
import chalk from 'chalk'
import path from 'path'
import ora from 'ora'
import { renderTemplates } from '../../lib/templates'
import { exec } from 'child_process'

export default class GenerateSnapshots extends Command {
  private spinner: ora.Ora = ora()
  static description = `Generates TypeScript definitions for an integration.`

  static examples = [`$ ./bin/run generate:snapshots`]

  // Allow variable length args (to work with tools like lint-staged)
  static strict = false

  static flags = {
    help: flags.help({ char: 'h' })
  }

  static args = [{ name: 'destination', description: 'destination name', required: true }]

  async run() {
    const { args } = this.parse(GenerateSnapshots)
    const integrationsGlob = './packages/destination-actions/src/destinations'
    const targetPath = `${integrationsGlob}/${args.destination}`
    const templatePath = path.join(__dirname, '../../../templates/actions/snapshot')

    try {
      this.spinner.start(`Creating ${chalk.bold(args.name)}`)
      renderTemplates(
        templatePath,
        targetPath,
        {
          destination: args.destination,
          integrationsGlob
        },
        true
      )
      this.spinner.succeed(`Create snapshot test for ${args.destination} ${args.action} action`)
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
        console.log('stderr: ', stderr)
        return
      }
      console.log('stdout: ', stdout)
    })
  }
}
