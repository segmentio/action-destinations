import { Command, flags } from '@oclif/command'
import type { BaseActionDefinition } from '@segment/actions-core'
import { ErrorCondition, parseFql } from '@segment/destination-subscriptions'
import ora from 'ora'
import { getManifest, DestinationDefinition } from '../lib/destinations'
import type { DestinationDefinition as CloudDestinationDefinition } from '@segment/actions-core'

const isDefined = (value: any): boolean => {
  return value !== null && value !== undefined
}

export default class Validate extends Command {
  private spinner: ora.Ora = ora()
  private isInvalid = false

  static description = `Validate an integration by statically analyzing the integration's definition files.`

  static examples = [`$ ./bin/run validate`]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static flags: flags.Input<any> = {
    help: flags.help({ char: 'h' })
  }

  static args = []

  async run() {
    // TODO validate the definition against the schema
    const destinations = Object.values(getManifest())

    for (const destination of destinations) {
      this.spinner.start(`Validating definition for ${destination.definition.name}`)

      const errors = [
        ...this.validatePresets(destination.definition),
        ...this.validateActions(destination.definition),
        ...this.validateSettings(destination.definition)
      ]

      if (errors.length) {
        this.spinner.fail(
          `Validating definition for ${destination.definition.name}: \n    ${errors
            .map((e) => e.message)
            .join('\n    ')}`
        )
      } else {
        this.spinner.succeed()
      }
    }

    if (this.isInvalid) {
      this.error(new Error('One or more validation errors were found.'))
    }
  }

  validateActions(destination: DestinationDefinition) {
    const errors: Error[] = []

    if (!Object.keys(destination.actions).length) {
      this.isInvalid = true
      errors.push(new Error(`The destination "${destination.name}" does not define any actions.`))
    }

    for (const [actionKey, def] of Object.entries(destination.actions)) {
      const action = def as BaseActionDefinition

      // Validate the FQL
      if (action.defaultSubscription) {
        const fqlError = this.validateFQL(action.defaultSubscription)
        if (fqlError) {
          this.isInvalid = true
          errors.push(
            new Error(`The action "${actionKey}" has an invalid \`defaultSubscription\` query: ${fqlError.message}`)
          )
        }
      }

      //Validate descriptions
      if (!action.description) {
        this.isInvalid = true
        errors.push(new Error(`The action "${actionKey}" is missing a description.`))
      }
      for (const [fieldKey, field] of Object.entries(action.fields)) {
        if (!field.description) {
          errors.push(new Error(`The action "${actionKey}" is missing a description for the field "${fieldKey}".`))
        }
      }
    }

    return errors
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

      // Validate the FQL
      const fqlError = this.validateFQL(preset.subscribe)
      if (fqlError) {
        this.isInvalid = true
        errors.push(new Error(`The preset "${preset.name}" has an invalid \`subscribe\` query: ${fqlError.message}`))
      }

      // Validate that the fields match defined fields
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

  validateFQL(fql: string): Error | null {
    const trigger = parseFql(fql)
    return (trigger as ErrorCondition).error || null
  }

  validateSettings(destination: DestinationDefinition) {
    const errors: Error[] = []
    if (destination.mode === 'cloud') {
      const dest = destination as CloudDestinationDefinition
      Object.keys(dest.authentication?.fields ?? {}).forEach((field) => {
        const fieldValues = dest.authentication?.fields[field]
        //TODO: consider invalidating here -- for now we just warn
        // this.isInvalid = true
        const typ = fieldValues?.type

        if (typ === 'boolean' || typ === 'number') {
          if (!isDefined(fieldValues?.default)) {
            errors.push(
              new Error(
                `The authentication field "${field}" of type "${fieldValues?.type}" does not contain a default value. It is recommended to choose a sane default to avoid validation issues.`
              )
            )
          }
          if (typeof fieldValues?.default !== typ) {
            errors.push(
              new Error(
                `The default value for field "${field}" is of type "${typeof fieldValues?.default}", but the type is set to "${typ}".`
              )
            )
          }
        }
      })
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
