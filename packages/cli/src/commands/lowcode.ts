import { Command, flags } from '@oclif/command'
import chalk from 'chalk'
import ora from 'ora'
import path from 'path'
import { autoPrompt } from '../lib/prompt'
import globby from 'globby'
import { renderTemplates } from '../lib/templates'
import GenerateTypes from './generate/types'
import fs from 'fs-extra'
import { camelCase, startCase } from 'lodash'
import { addKeyToExport } from '../lib/codemods'

export default class Init extends Command {
  private spinner: ora.Ora = ora()

  static description = `Scaffolds a new integration with a template. This does not register or deploy the integration.`

  static examples = [
    `$ ./bin/run init my-integration`,
    `$ ./bin/run init my-integration --directory packages/destination-actions --template basic-auth`
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static flags: flags.Input<any> = {
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

  async integrationDirs(glob: string) {
    const integrationDirs = await globby(glob, {
      expandDirectories: false,
      onlyDirectories: true,
      gitignore: true,
      ignore: ['node_modules']
    })

    return integrationDirs
  }

  parseFlags() {
    return this.parse(Init)
  }

  async run() {
    const { args, flags } = this.parseFlags()
    const answers = await autoPrompt(flags, [
      {
        type: 'text',
        name: 'json',
        message: 'JSON: ',
        format: (val) => JSON.parse(val)
      }
    ])

    const name = answers.json.name
    const slug = answers.json.slug
    const authenticationScheme = answers.json.authenticationScheme
    const actions = answers.json.actions

    console.log('actions: ', actions)

    const directory = answers.directory

    // For now, include the slug in the path, but when we support external repos, we'll have to change this
    const slugWithoutActions = String(slug).replace('actions-', '')
    const relativePath = path.join(directory, args.path || slugWithoutActions)
    const targetDirectory = path.join(process.cwd(), relativePath)
    const templatePath = path.join(__dirname, '../../templates/destinations/lowcode', authenticationScheme)
    const snapshotPath = path.join(__dirname, '../../templates/actions/snapshot')

    const destinationFolder = path.parse(directory).base
    const destination = startCase(camelCase(destinationFolder)).replace(/ /g, '')
    const actionsSnapshotPath = path.join(__dirname, '../../templates/actions/action-snapshot')

    let actionsTemplatePath = path.join(__dirname, '../../templates/actions/empty-action-lowcode')

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
          destination: slug,
          // json: JSON.parse(answers.json)
        },
        true
      )
      this.spinner.succeed(`Created snapshot tests for ${slug} destination`)
    } catch (err) {
      this.spinner.fail(`Snapshot test creation failed: ${chalk.red(err.message)}`)
      this.exit()
    }

    for (let action of actions) {

      console.log('action: ', action)
      const actionsTargetDirectory = `${targetDirectory}/${action.name}`
      console.log('actionsTargetDirectory: ', targetDirectory)


      
      try {
        renderTemplates(
          actionsTemplatePath,
          actionsTargetDirectory,
          {
            name: action.name,
            description: action.description,
            slug,
            destination,
            fields: action.fields,
            apiEndpoint: action.apiEndpoint,
            httpMethod: action.httpMethod
          },
          flags.force
        )
        this.spinner.succeed(`Scaffold action`)
      } catch (err) {
        this.spinner.fail(`Scaffold action: ${chalk.red(err.message)}`)
        this.exit()
      }
      
      try {
        this.spinner.start(`Creating snapshot tests for ${chalk.bold(`${destination}'s ${slug}`)} destination action`)
        renderTemplates(
          actionsSnapshotPath,
          actionsTargetDirectory,
          {
            destination: destination,
            actionSlug: slug
          },
          true
        )
        this.spinner.succeed(`Creating snapshot tests for ${chalk.bold(`${destination}'s ${slug}`)} destination action`)
      } catch (err) {
        this.spinner.fail(`Snapshot test creation failed: ${chalk.red(err.message)}`)
        this.exit()
      }
  
      // Update destination with action
      const entryFile = require.resolve(path.relative(__dirname, path.join(process.cwd(), actionsTargetDirectory)))
      try {
        this.spinner.start(chalk`Updating destination definition`)
        const destinationStr = fs.readFileSync(entryFile, 'utf8')
        const exportName = 'default'
        const updatedCode = addKeyToExport(destinationStr, exportName, 'actions', slug)
        fs.writeFileSync(entryFile, updatedCode, 'utf8')
        this.spinner.succeed()
      } catch (err) {
        this.spinner.fail(chalk`Failed to update your destination imports: ${err.message}`)
        this.exit()
      }
  
      try {
        this.spinner.start(chalk`Generating types for {magenta ${slug}} action`)
        await GenerateTypes.run(['--path', entryFile])
        this.spinner.succeed()
      } catch (err) {
        this.spinner.fail(chalk`Generating types for {magenta ${slug}} action: ${err.message}`)
        this.exit()
      }
    }

    this.log(chalk.green(`Done creating "${name}" 🎉`))
    this.log(chalk.green(`Start coding! cd ${actionsTargetDirectory}`))
  }

  async catch(error: unknown) {
    if (this.spinner?.isSpinning) {
      this.spinner.fail()
    }
    throw error
  }
}








