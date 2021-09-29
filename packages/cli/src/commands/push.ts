import { Command, flags } from '@oclif/command'
import type { DestinationDefinition as CloudDestinationDefinition, MinimalInputField } from '@segment/actions-core'
import { fieldsToJsonSchema } from '@segment/actions-core'
import { manifest as cloudManifest, ManifestEntry as CloudManifest } from '@segment/action-destinations'
import {
  manifest as browserManifest,
  ManifestEntry as BrowserManifest,
  BrowserDestinationDefinition
} from '@segment/browser-destinations'
import chalk from 'chalk'
import { uniq, pick, omit, sortBy, mergeWith } from 'lodash'
import { diffString } from 'json-diff'
import ora from 'ora'
import type {
  ClientRequestError,
  DestinationMetadata,
  DestinationMetadataActionCreateInput,
  DestinationMetadataActionFieldCreateInput,
  DestinationMetadataActionsUpdateInput,
  DestinationMetadataOption,
  DestinationMetadataOptions,
  DestinationSubscriptionPresetFields,
  DestinationSubscriptionPresetInput
} from '../lib/control-plane-service'
import { prompt } from '../lib/prompt'
import { OAUTH_OPTIONS, RESERVED_FIELD_NAMES } from '../constants'
import {
  getDestinationMetadatas,
  getDestinationMetadataActions,
  updateDestinationMetadata,
  updateDestinationMetadataActions,
  createDestinationMetadataActions,
  setSubscriptionPresets
} from '../lib/control-plane-client'
import { DestinationDefinition, hasOauthAuthentication } from '../lib/destinations'
import type { JSONSchema4 } from 'json-schema'

type BaseActionInput = Omit<DestinationMetadataActionCreateInput, 'metadataId'>

// Right now it's possible for browser destinations and cloud destinations to have the same
// metadataId. This is because we currently rely on a separate directory for all web actions.
// So here we need to intelligently merge them until we explore colocating all actions with a single
// definition file.
const manifest: Record<string, CloudManifest | BrowserManifest> = mergeWith(
  {},
  cloudManifest,
  browserManifest,
  (objValue, srcValue) => {
    if (Object.keys(objValue?.definition?.actions ?? {}).length === 0) {
      return
    }

    for (const [actionKey, action] of Object.entries(srcValue.definition?.actions ?? {})) {
      if (actionKey in objValue.definition.actions) {
        throw new Error(
          `Could not merge browser + cloud actions because there is already an action with the same key "${actionKey}"`
        )
      }

      objValue.definition.actions[actionKey] = action
    }

    return objValue
  }
)

export default class Push extends Command {
  private spinner: ora.Ora = ora()

  static description = `Introspects your integration definition to build and upload your integration to Segment. Requires \`robo stage.ssh\` or \`robo prod.ssh\`.`

  static examples = [`$ ./bin/run push`]

  static flags = {
    help: flags.help({ char: 'h' }),
    force: flags.boolean({ char: 'f' })
  }

  static args = []

  async run() {
    const { flags } = this.parse(Push)

    const { metadataIds } = await prompt<{ metadataIds: string[] }>({
      type: 'multiselect',
      name: 'metadataIds',
      message: 'Pick the definitions you would like to push to Segment:',
      choices: sortBy(Object.entries(manifest), '[1].definition.name').map(([metadataId, entry]) => ({
        title: entry.definition.name,
        value: metadataId
      }))
    })

    if (!metadataIds.length) {
      this.warn(`You must select at least one destination. Exiting.`)
      this.exit()
    }

    this.spinner.start(
      `Fetching existing definitions for ${metadataIds
        .map((id) => chalk.greenBright(manifest[id].definition.name))
        .join(', ')}...`
    )

    const [metadatas, actions] = await Promise.all([
      getDestinationMetadatas(metadataIds),
      getDestinationMetadataActions(metadataIds)
    ])

    if (metadatas.length !== Object.keys(metadataIds).length) {
      this.spinner.fail()
      throw new Error('Number of metadatas must match number of schemas')
    }

    this.spinner.stop()

    for (const metadata of metadatas) {
      const entry = manifest[metadata.id]
      const definition = entry.definition
      const slug = metadata.slug

      this.log('')
      this.log(`${chalk.bold.whiteBright(slug)}`)
      this.spinner.start(`Generating diff for ${chalk.bold(slug)}...`)

      const actionsToUpdate: DestinationMetadataActionsUpdateInput[] = []
      const actionsToCreate: DestinationMetadataActionCreateInput[] = []
      const existingActions = actions.filter((a) => a.metadataId === metadata.id)

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

          let choices: null | { label: string; value: string } = null
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
            fieldSchema: getFieldPropertySchema(fieldKey, field)
          }
        })

        // Automatically include a field for customers to control batching behavior, when supported
        if (typeof action.performBatch === 'function') {
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

      const options = getOptions(metadata, definition)
      const basicOptions = getBasicOptions(metadata, options)
      const diff = diffString(
        asJson({
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
          )
        }),
        asJson({
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
          )
        })
      )

      if (diff) {
        this.spinner.warn(`Detected changes for ${chalk.bold(slug)}, please review:`)
        this.log(`\n${diff}`)
      } else if (flags.force) {
        const newDefinition = definitionToJson(definition)
        this.spinner.warn(`No change detected for ${chalk.bold(slug)}. Using force, please review:`)
        this.log(`\n${JSON.stringify(newDefinition, null, 2)}`)
      } else {
        this.spinner.info(`No change for ${chalk.bold(slug)}. Skipping.`)
        continue
      }

      const { shouldContinue } = await prompt({
        type: 'confirm',
        name: 'shouldContinue',
        message: `Publish change for ${slug}?`,
        initial: false
      })

      if (!shouldContinue) {
        continue
      }

      try {
        await Promise.all([
          updateDestinationMetadata(metadata.id, {
            basicOptions,
            options,
            platforms
          }),
          updateDestinationMetadataActions(actionsToUpdate),
          createDestinationMetadataActions(actionsToCreate)
        ])
      } catch (e) {
        const error = e as ClientRequestError
        chalk.red(error.message)
        if (error.isMultiError) {
          error.errors.map((error) => error.message).forEach((error) => chalk.red(error))
        }
      }

      const allActions = await getDestinationMetadataActions([metadata.id])
      const presets: DestinationSubscriptionPresetInput[] = []

      for (const preset of definition.presets ?? []) {
        const associatedAction = allActions.find((a) => a.slug === preset.partnerAction)
        if (!associatedAction) continue

        presets.push({
          actionId: associatedAction.id,
          name: preset.name ?? associatedAction.name,
          trigger: preset.subscribe,
          fields: (preset.mapping as DestinationSubscriptionPresetFields) ?? {}
        })
      }

      // We have to wait to do this until after the associated actions are created (otherwise it may fail)
      await setSubscriptionPresets(metadata.id, presets)
    }
  }
}

function getFieldPropertySchema(fieldKey: string, field: MinimalInputField): JSONSchema4 {
  // Build a temporary object in which key = field name and value = field properties
  // since that's the structure expected by fieldsToJsonSchema
  const tmpFieldObject: Record<string, MinimalInputField> = {}
  // removing default data since it's available under defaultValue
  const { default: def, ...fieldWODefault } = field
  tmpFieldObject[fieldKey] = fieldWODefault
  return fieldsToJsonSchema(tmpFieldObject)
}

function filterOAuth(optionList: string[]) {
  return optionList.filter((item) => item !== 'oauth')
}

function asJson(obj: unknown) {
  return JSON.parse(JSON.stringify(obj))
}

function definitionToJson(definition: DestinationDefinition) {
  // Create a copy that only includes serializable properties
  const copy = JSON.parse(JSON.stringify(definition))

  for (const action of Object.keys(copy.actions)) {
    delete copy.actions[action].dynamicFields
    copy.actions[action].hidden = copy.actions[action].hidden ?? false
  }

  return copy
}

function getBasicOptions(metadata: DestinationMetadata, options: DestinationMetadataOptions): string[] {
  return uniq([...Object.keys(options), ...metadata.basicOptions])
}

// Note: exporting for testing purposes only
export function getOptions(
  metadata: DestinationMetadata,
  definition: DestinationDefinition
): DestinationMetadataOptions {
  const options: DestinationMetadataOptions = { ...metadata.options }

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

    // Everything in `authentication.fields` should be private. Otherwise, public is fine
    const isPrivateSetting = typeof authFields === 'object' && fieldKey in authFields

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

    // Remove the previous entry if it exists so we can respect the order of keys as defined in the repo
    delete options[fieldKey]

    options[fieldKey] = {
      default: schema.default ?? '',
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
      validators
    }
  }

  // Add oauth settings
  if (hasOauthAuthentication(definition)) {
    options['oauth'] = OAUTH_OPTIONS
  }

  return options
}
