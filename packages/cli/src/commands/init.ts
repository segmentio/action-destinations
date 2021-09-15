import { Command, flags } from '@oclif/command'
import chalk from 'chalk'
import ora from 'ora'
import path from 'path'
import toTitleCase from 'to-title-case'
import { autoPrompt } from '../lib/prompt'
import { generateSlug } from '../lib/slugs'
import { renderTemplates } from '../lib/templates'
import GenerateTypes from './generate/types'

export default class Init extends Command {
  private spinner: ora.Ora = ora()

  static description = `Scaffolds a new integration with a template. This does not register or deploy the integration.`

  static examples = [
    `$ ./bin/run init my-integration`,
    `$ ./bin/run init my-integration --directory packages/destination-actions --template basic-auth`
  ]

  static flags = {
    help: flags.help({ char: 'h' }),
    directory: flags.string({
      char: 'd',
      description: 'target directory to scaffold the integration',
      default: './packages/destination-actions/src/destinations'
    }),
    name: flags.string({ char: 'n', description: 'name of the integration' }),
    slug: flags.string({ char: 's', description: 'url-friendly slug of the integration' }),
    template: flags.enum({
      char: 't',
      options: ['basic-auth', 'custom-auth', 'oauth2-auth', 'minimal'],
      description: 'the template to use to scaffold your integration'
    })
  }

  static args = [
    {
      name: 'path',
      description: 'path to scaffold the integration'
    }
  ]

  parseFlags() {
    return this.parse(Init)
  }

  async run() {
    const { args, flags } = this.parseFlags()
    const answers = await autoPrompt(flags, [
      {
        type: 'text',
        name: 'name',
        message: 'Integration name:',
        format: (val) => toTitleCase(val)
      },
      {
        type: 'text',
        name: 'slug',
        // @ts-ignore the types are wrong
        initial: (prev) => generateSlug(`actions-${flags.name || prev}`),
        message: 'Integration slug:',
        format: (val) => generateSlug(val)
      },
      {
        type: 'select',
        name: 'template',
        message: 'What template do you want to use?',
        choices: [
          {
            title: 'Custom Auth',
            description: 'Most "API Key" based integrations should use this.',
            value: 'custom-auth'
          },
          {
            title: 'Browser Destination',
            description: 'Creates an Analytics JS compatible Destination.',
            value: 'browser'
          },
          {
            title: 'Basic Auth',
            description: 'Integrations that use Basic Auth: https://tools.ietf.org/html/rfc7617',
            value: 'basic-auth'
          },
          {
            title: 'OAuth2 Auth',
            description: 'Use for APIs that support OAuth2.',
            value: 'oauth2-auth'
          },
          {
            title: 'Minimal',
            value: 'minimal'
          }
        ],
        initial: 0
      }
    ])

    const { name, slug, template } = answers
    if (!name || !slug || !template) {
      this.exit()
    }

    let directory = answers.directory
    if (template === 'browser' && directory === Init.flags.directory.default) {
      directory = './packages/browser-destinations/src/destinations'
    }

    // For now, include the slug in the path, but when we support external repos, we'll have to change this
    const relativePath = path.join(directory, args.path || slug)
    const targetDirectory = path.join(process.cwd(), relativePath)
    const templatePath = path.join(__dirname, '../../templates/destinations', template)
    const snapshotPath = path.join(__dirname, '../../templates/actions/snapshot')

    try {
      this.spinner.start(`Creating ${chalk.bold(name)}`)
      renderTemplates(templatePath, targetDirectory, answers)
      this.spinner.succeed(`Scaffold integration`)
    } catch (err) {
      this.spinner.fail(`Scaffold integration: ${chalk.red(err.message)}`)
      this.exit()
    }

    try {
      this.spinner.start(chalk`Generating types for {magenta ${slug}} destination`)
      await GenerateTypes.run(['--path', `${relativePath}/index.ts`])
      this.spinner.succeed()
    } catch (err) {
      this.spinner.fail(chalk`Generating types for {magenta ${slug}} destination: ${err.message}`)
    }

    try {
      this.spinner.start(`Creating snapshot tests for ${chalk.bold(slug)} destination`)
      renderTemplates(
        snapshotPath,
        targetDirectory,
        {
          destination: slug
        },
        true
      )
      this.spinner.succeed(`Created snapshot tests for ${slug} destination`)
    } catch (err) {
      this.spinner.fail(`Snapshot test creation failed: ${chalk.red(err.message)}`)
      this.exit()
    }

    this.log(chalk.green(`Done creating "${name}" 🎉`))
    this.log(chalk.green(`Start coding! cd ${targetDirectory}`))
  }

  async catch(error: unknown) {
    if (this.spinner?.isSpinning) {
      this.spinner.fail()
    }
    throw error
  }
}
