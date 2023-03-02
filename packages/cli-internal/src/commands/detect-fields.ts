import { Command, flags } from '@oclif/command'
import type { DestinationDefinition as CloudDestinationDefinition, MinimalInputField } from '@segment/actions-core'
import { fieldsToJsonSchema } from '@segment/actions-core'
import { BrowserDestinationDefinition } from '@segment/browser-destinations'
import chalk from 'chalk'
import { pick, omit, sortBy } from 'lodash'
import { diff } from 'json-diff'
import type {
  DestinationMetadataActionCreateInput,
  DestinationMetadataActionFieldCreateInput,
  DestinationMetadataActionsUpdateInput,
  DestinationMetadataOption,
  DestinationMetadataOptions
} from '../lib/control-plane-service'
import { OAUTH_OPTIONS } from '../constants'
import { RESERVED_FIELD_NAMES } from '@segment/actions-cli/constants'
import {
  getDestinationMetadatas,
  getDestinationMetadataActions,
  getSubscriptionPresets
} from '../lib/control-plane-client'
import { DestinationDefinition, getManifest, hasOauthAuthentication } from '@segment/actions-cli/lib/destinations'
import type { JSONSchema4 } from 'json-schema'

import util from 'util'
import { exec } from 'child_process'
import { getDestinationIdByPathKey } from '../../../../packages/destination-actions/src/destinations'
const execAwait = util.promisify(exec)

type BaseActionInput = Omit<DestinationMetadataActionCreateInput, 'metadataId'>

/**
  1. get a list of modified files
  2. extra action-destination name from the files
  3. grab the metadataId from the manifest
  4. run the push command to see if there are any different fields
  5. if so print them
    Adding a new field to an existing mapping
  6. Error out if any new required fields are added
    Adding a new required field to an existing mapping
      With default
      Without default
    Turning an existing field into a required field
  7. Detect a slug change and throw an error
*/
export default class DetectFields extends Command {
  static description = `Introspects your integration definition to build and upload your integration to Segment. Requires \`robo stage.ssh\` or \`robo prod.ssh\`.`

  static examples = [`$ ./bin/run detect-fields`]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static flags: flags.Input<any> = {
    help: flags.help({ char: 'h' }),
    force: flags.boolean({ char: 'f' }),
    diff: flags.string({ char: 'd' })
  }

  static args = []

  async run() {
    const { flags } = this.parse(DetectFields)
    const manifest = getManifest()
    // await deprecationWarning(this.warn)
    const metadataIds = []

    console.log('flags.diff', flags.diff)

    if (!flags.diff) {
      const { stdout } = await execAwait('git diff --name-only main')
      const changedFilesArr = stdout.trim().split('\n')
      const changedDestinations = new Set<string>()
      for (const filePath of changedFilesArr) {
        if (filePath.startsWith('packages/destination-actions/src/destinations/')) {
          changedDestinations.add(filePath.split('/')[4])
        }
      }
      changedDestinations.delete('index.ts')
      for (const changedDestination of changedDestinations) {
        metadataIds.push(getDestinationIdByPathKey('./' + changedDestination))
      }
    }
    console.log({ metadataIds })

    if (!metadataIds.length) {
      this.warn(`You must select at least one destination. Exiting.`)
      this.exit()
    }

    const [metadatas, actions, allPresets] = await Promise.all([
      getDestinationMetadatas(metadataIds),
      getDestinationMetadataActions(metadataIds),
      getSubscriptionPresets(metadataIds)
    ])

    if (metadatas.length !== Object.keys(metadataIds).length) {
      throw new Error('Number of metadatas must match number of schemas')
    }

    for (const metadata of metadatas) {
      const entry = manifest[metadata.id]
      const definition = entry.definition
      const slug = metadata.slug

      this.log('')
      this.log(`${chalk.bold.whiteBright(slug)}`)

      const actionsToUpdate: DestinationMetadataActionsUpdateInput[] = []
      const actionsToCreate: DestinationMetadataActionCreateInput[] = []
      const existingActions = actions.filter((a) => a.metadataId === metadata.id)
      const existingPresets = allPresets
        .filter((p) => p.metadataId === metadata.id)
        .map((preset) => ({
          partnerAction: existingActions.find((a) => a.id === preset.actionId)?.slug,
          name: preset.name,
          subscribe: preset.trigger,
          mapping: preset.fields
        }))

      for (const [actionKey, action] of Object.entries(definition.actions)) {
        const platform = action.platform ?? 'cloud'

        // Note: this implies that changing the slug is a breaking change
        const existingAction = existingActions.find((a) => a.slug === actionKey && a.platform === platform)

        const fields: DestinationMetadataActionFieldCreateInput[] = Object.keys(action.fields).map((fieldKey) => {
          const field = action.fields[fieldKey]

          if (action.platform === 'web' && field.dynamic) {
            this.error(
              `The field key "${fieldKey}" is configured to be a "dynamic" field. Web actions do not support dynamic fields.`
            )
          }

          let choices: DestinationMetadataActionFieldCreateInput['choices'] = null
          if (Array.isArray(field.choices) && field.choices.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            choices = field.choices.map((choice: string | { label: string; value: string }) => {
              if (typeof choice === 'string') {
                return { label: choice, value: choice }
              }

              return choice
            })
          }

          return {
            fieldKey,
            type: field.type,
            label: field.label,
            description: field.description,
            defaultValue: field.default,
            required: field.required ?? false,
            multiple: field.multiple ?? false,
            choices,
            dynamic: field.dynamic ?? false,
            placeholder: field.placeholder ?? '',
            allowNull: field.allowNull ?? false,
            defaultObjectUI: field.defaultObjectUI,
            fieldSchema: getFieldPropertySchema(fieldKey, field)
          }
        })

        const builderDefinedBatchingField = fields.find((f) => f.fieldKey === 'enable_batching')
        const isBatchingDestination = typeof action.performBatch === 'function'

        // Automatically include a field for customers to control batching behavior, when supported
        if (isBatchingDestination && !builderDefinedBatchingField) {
          fields.push({
            fieldKey: 'enable_batching',
            type: 'boolean',
            label: 'Enable Batching?',
            description: 'When enabled, Segment will send events in batches.',
            defaultValue: false,
            required: false,
            multiple: false,
            dynamic: false,
            allowNull: false
          })
        } else if (isBatchingDestination && builderDefinedBatchingField) {
          this.validateBatching(builderDefinedBatchingField)
        }

        const base: BaseActionInput = {
          slug: actionKey,
          name: action.title ?? 'Unnamed Action',
          description: action.description ?? '',
          platform,
          hidden: action.hidden ?? false,
          defaultTrigger: action.defaultSubscription ?? null,
          fields
        }

        if (existingAction) {
          actionsToUpdate.push({ ...base, actionId: existingAction.id })
        } else {
          actionsToCreate.push({ ...base, metadataId: metadata.id })
        }
      }

      const hasBrowserActions = Object.values(definition.actions).some((action) => action.platform === 'web')
      const hasCloudActions = Object.values(definition.actions).some(
        (action) => !action.platform || action.platform === 'cloud'
      )
      const platforms = {
        browser: hasBrowserActions || hasCloudActions,
        server: hasCloudActions,
        mobile: false
      }

      const { name, description } = definition
      const options = getOptions(definition, metadata.options)
      const basicOptions = getBasicOptions(options)
      // const difference = diffString(
      const string1 = asJson({
        name,
        slug: definition.slug,
        description,
        basicOptions: filterOAuth(metadata.basicOptions),
        options: pick(metadata.options, filterOAuth(Object.keys(options))),
        platforms: metadata.platforms,
        actions: sortBy(
          existingActions.map((action) => ({
            ...omit(action, ['id', 'metadataId', 'createdAt', 'updatedAt']),
            fields: action.fields?.map((field) =>
              omit(field, ['id', 'metadataActionId', 'sortOrder', 'createdAt', 'updatedAt'])
            )
          })),
          ['name']
        ),
        presets: sortBy(existingPresets, 'name')
      })
      const string2 = asJson({
        name: definition.name,
        slug,
        description: definition.description,
        basicOptions: filterOAuth(basicOptions),
        options: pick(options, filterOAuth(Object.keys(options))),
        platforms,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        actions: sortBy(
          ([] as Array<DestinationMetadataActionCreateInput | DestinationMetadataActionsUpdateInput>)
            .concat(actionsToUpdate, actionsToCreate)
            .map((action) => ({
              ...omit(action, ['id', 'actionId', 'metadataId']),
              fields: action.fields?.map((field) =>
                omit(field, ['id', 'metadataActionId', 'sortOrder', 'createdAt', 'updatedAt'])
              )
            })),
          ['name']
        ),
        presets: sortBy(definition.presets ?? [], 'name')
      })
      // const colorDifference = diffString(string1, string2)

      // if (colorDifference) {
      //   this.spinner.warn(`Detected changes for ${chalk.bold(slug)}, please review:`)
      //   this.log(`\n${colorDifference}`)
      // } else if (flags.force) {
      //   const newDefinition = definitionToJson(definition)
      //   this.spinner.warn(`No change detected for ${chalk.bold(slug)}. Using force, please review:`)
      //   this.log(`\n${JSON.stringify(newDefinition, null, 2)}`)
      // } else {
      //   this.spinner.info(`No change for ${chalk.bold(slug)}. Skipping.`)
      //   continue
      // }

      const parseableDiff = diff(string1, string2, { full: true })

      console.log(JSON.stringify(parseableDiff, undefined, 2))

      console.log('slug', parseableDiff.slug)
      if (parseableDiff.slug && parseableDiff.slug.__old && parseableDiff.__new) {
        this.error(`The slug name is currently immutable. If this is a required operation, please reach out to support`)
      }

      // find changed actions / mappings
      // can currently find new fields, deleted fields, and changed required fields, but not changed regular fields
      for (const actionDiff of parseableDiff.actions) {
        if (isUnchangedField(actionDiff)) {
          continue
        }
        const change = actionDiff[0]
        const action = actionDiff[1]
        switch (change) {
          case '+':
            this.log('new action', action.slug)
            break
          case '~':
            this.log('changed action', action.slug)
            for (const fieldDiff of action.fields) {
              const fieldChange = fieldDiff[0]
              const field = fieldDiff[1]
              switch (fieldChange) {
                case '+':
                  this.log('new field', field.fieldKey)
                  break
                case '~':
                  this.log('changed field', field.fieldKey)
                  break
                case '-':
                  this.log('deleted field', field.fieldKey)
                  break
              }
            }
            break
          case '-':
            this.log('deleted action', action.slug)
            break
        }
      }
    }
  }

  validateBatching = (builderDefinedBatchingField: DestinationMetadataActionFieldCreateInput) => {
    if (builderDefinedBatchingField.type !== 'boolean') {
      this.error(`The builder defined batching field is not a boolean. Please update the field type to "boolean".`)
    }

    if (builderDefinedBatchingField.multiple) {
      this.error(
        `The builder defined batching field should not be a multiple field. Please update the field to not be a multiple field.`
      )
    }
  }
}

function isUnchangedField(action: string[]) {
  return action.length === 1 && action[0] === ' '
}

function getFieldPropertySchema(fieldKey: string, field: MinimalInputField): JSONSchema4 {
  // Build a temporary object in which key = field name and value = field properties
  // since that's the structure expected by fieldsToJsonSchema
  const tmpFieldObject: Record<string, MinimalInputField> = {}
  // removing default data since it's available under defaultValue
  const { default: def, ...fieldWODefault } = field
  tmpFieldObject[fieldKey] = fieldWODefault
  if (field.type === 'object') {
    return fieldsToJsonSchema(tmpFieldObject, { additionalProperties: field?.additionalProperties || false })
  }
  return fieldsToJsonSchema(tmpFieldObject)
}

function filterOAuth(optionList: string[]) {
  return optionList.filter((item) => item !== 'oauth')
}

function asJson(obj: unknown) {
  return JSON.parse(JSON.stringify(obj))
}

function getBasicOptions(options: DestinationMetadataOptions): string[] {
  return Object.keys(options)
}

// Note: exporting for testing purposes only
export function getOptions(
  definition: DestinationDefinition,
  existingOptions: DestinationMetadataOptions
): DestinationMetadataOptions {
  const options: DestinationMetadataOptions = {}

  const publicSettings = (definition as BrowserDestinationDefinition).settings
  const authFields = (definition as CloudDestinationDefinition).authentication?.fields

  const settings = {
    ...publicSettings,
    ...authFields
  }

  for (const [fieldKey, schema] of Object.entries(settings)) {
    const validators: string[][] = []

    if (RESERVED_FIELD_NAMES.includes(fieldKey.toLowerCase()) && hasOauthAuthentication(definition)) {
      throw new Error(`Schema contains a field definition that uses a reserved name: ${fieldKey}`)
    }

    if (schema.required) {
      validators.push(['required', `The ${fieldKey} property is required.`])
    }

    // If the field exists in auth fields.
    const isAuth = typeof authFields === 'object' && fieldKey in authFields

    // Everything in `authentication.fields` should be private. Otherwise, public is fine
    const isPrivateSetting = isAuth

    let type: DestinationMetadataOption['type'] = schema.type
    if (Array.isArray(schema.choices)) {
      type = 'select'
    }

    if (schema.multiple) {
      if (type !== 'string') {
        throw new Error("`multiple: true` can only be used with `type: 'string'`.")
      }

      // Use array type for any `multiple` fields
      type = 'array'
    }

    // Validate that select choices match the specified field type.
    if (type === 'select') {
      const allChoicesMatchType = schema.choices?.every((choice) => typeof choice.value === schema.type)
      if (!allChoicesMatchType) {
        throw new Error(`All choices must have a value that matches the 'type' for this field.`)
      }
    }

    // Preserve existing properties unless specified by the action field definition
    const existing = existingOptions[fieldKey]
    const tags = existing?.tags ?? []

    if (isAuth && !tags.includes('authentication:test')) {
      tags.push('authentication:test') //valid values here can eventually be test, no-test if needed
    }

    const defaultValues = {
      number: 0,
      boolean: false,
      string: '',
      password: ''
    }

    options[fieldKey] = {
      ...existing,
      tags,
      default: schema.default ?? defaultValues[schema.type],
      description: schema.description,
      encrypt: schema.type === 'password',
      hidden: false,
      label: schema.label,
      private: isPrivateSetting,
      scope: 'event_destination',
      type,
      options: schema.choices?.map((choice) => ({
        value: choice.value,
        label: choice.label,
        text: choice.label
      })),
      readOnly: false,
      validators
    }
  }

  // Add oauth settings
  if (hasOauthAuthentication(definition)) {
    options['oauth'] = OAUTH_OPTIONS
  }

  return options
}
