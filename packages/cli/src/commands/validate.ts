import { Command, flags } from '@oclif/command'
import ora from 'ora'
import { manifest, DestinationDefinition } from '../lib/destinations'

export default class Validate extends Command {
  private spinner: ora.Ora = ora()
  private isInvalid = false

  static description = `Validate an integration by statically analyzing the integration’s definition files.`

  static examples = [`$ ./bin/run validate`]

  static flags = {
    help: flags.help({ char: 'h' })
  }

  static args = []

  async run() {
    // TODO validate the definition against the schema
    const destinations = Object.values(manifest)

    for (const destination of destinations) {
      this.spinner.start(`Validating presets for ${destination.definition.name}`)
      const errors = this.validatePresets(destination.definition)
      if (errors.length) {
        this.spinner.fail(
          `Validating presets for ${destination.definition.name}: \n    ${errors.map((e) => e.message).join('\n    ')}`
        )
      } else {
        this.spinner.succeed()
      }
    }

    if (this.isInvalid) {
      this.error(new Error('One or more validation errors were found.'))
    }
  }

  validatePresets(destination: DestinationDefinition) {
    if (!destination.presets) return []

    const errors = []

    for (const preset of destination.presets) {
      if (!Object.keys(destination.actions).includes(preset.partnerAction)) {
        this.isInvalid = true
        errors.push(new Error(`The preset "${preset.name}" references an action key that does not exist.`))
      }

      const presetFields = Object.keys(preset.mapping ?? {})
      const actionFields = Object.keys(destination.actions[preset.partnerAction].fields ?? {})

      for (const field of presetFields) {
        if (!actionFields.includes(field)) {
          this.isInvalid = true
          errors.push(
            new Error(
              `The preset "${preset.name}" references a field "${field}" that the "${preset.partnerAction}" action does not define.`
            )
          )
        }
      }
    }

    return errors
  }

  async catch(error: unknown) {
    if (this.spinner?.isSpinning) {
      this.spinner.fail()
    }
    throw error
  }
}
