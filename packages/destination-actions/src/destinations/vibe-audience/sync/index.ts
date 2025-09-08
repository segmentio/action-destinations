import { IntegrationError, ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import VibeClient from '../vibe-operations'
import { batch_size, enable_batching } from '../vibe-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync data to Vibe Audience.',
  hooks: {
    retlOnMappingSave: {
      label: 'Select or create an audience in Vibe',
      description:
        'When saving this mapping, Segment will either create a new audience in Vibe or connect to an existing one. To create a new audience, enter the name of the audience. To connect to an existing audience, select the audience ID from the dropdown.',
      inputFields: {
        operation: {
          type: 'string',
          label: 'Create a new audience or connect to an existing one?',
          description:
            'Choose to either create a new audience or use an existing one. If you opt to create a new audience, we will display the required fields for audience creation. If you opt to use an existing audience, a drop-down menu will appear, allowing you to select from all the audiences in your advertiser account.',
          choices: [
            { label: 'Create New Audience', value: 'create' },
            { label: 'Connect to Existing Audience', value: 'existing' }
          ],
          default: 'create'
        },
        audienceName: {
          type: 'string',
          label: 'Audience Creation Name',
          description: 'The name of the audience in Vibe.',
          default: 'TODO: Model Name by default',
          depends_on: {
            conditions: [
              {
                fieldKey: 'operation',
                operator: 'is',
                value: 'create'
              }
            ]
          }
        },
        existingAudienceId: {
          type: 'string',
          label: 'Existing Audience ID',
          description: 'The ID of the audience in Vibe.',
          depends_on: {
            conditions: [
              {
                fieldKey: 'operation',
                operator: 'is',
                value: 'existing'
              }
            ]
          },
          dynamic: async (request, { settings }) => {
            const vibeClient = new VibeClient(request, settings.advertiserId, settings.authToken)
            const { choices, error } = await vibeClient.getAllAudiences()

            if (error) {
              return { error, choices: [] }
            }

            return {
              choices
            }
          }
        }
      },
      outputTypes: {
        audienceName: {
          type: 'string',
          label: 'Audience Name',
          description: 'The name of the audience in Vibe this mapping is connected to.',
          required: true
        },
        audienceId: {
          type: 'string',
          label: 'Audience ID',
          description: 'The ID of the audience in Vibe.',
          required: true
        }
      },
      performHook: async (request, { settings, hookInputs }) => {
        const vibeClient = new VibeClient(request, settings.advertiserId, settings.authToken)

        if (hookInputs.operation === 'create' && !hookInputs.audienceName) {
          return {
            error: {
              message: 'Missing audience name value',
              code: 'MISSING_REQUIRED_FIELD'
            }
          }
        }

        if (hookInputs.operation === 'existing' && !hookInputs.existingAudienceId) {
          return {
            error: {
              message: 'Missing audience ID value',
              code: 'MISSING_REQUIRED_FIELD'
            }
          }
        }

        if (hookInputs.operation === 'existing' && hookInputs.existingAudienceId) {
          const { data, error } = await vibeClient.getSingleAudience(hookInputs.existingAudienceId)

          if (error) {
            return {
              error: {
                message: error.error.message,
                code: error.error.code
              }
            }
          }

          return {
            successMessage: `Connected to audience with ID: ${hookInputs.existingAudienceId}`,
            savedData: {
              audienceId: hookInputs.existingAudienceId,
              audienceName: data?.name
            }
          }
        }

        if (hookInputs.operation === 'create' && hookInputs.audienceName) {
          const { data } = await vibeClient.createAudience(hookInputs.audienceName)

          return {
            successMessage: `Audience created with ID: ${data.id}`,
            savedData: {
              audienceId: data.id,
              audienceName: hookInputs.audienceName
            }
          }
        }

        return {
          error: {
            message: 'Invalid operation',
            code: 'INVALID_OPERATION'
          }
        }
      }
    }
  },
  syncMode: {
    label: 'Sync Mode',
    description: 'The sync mode to use when syncing data to Vibe.',
    default: 'upsert',
    choices: [
      { value: 'upsert', label: 'Upsert' },
      { value: 'delete', label: 'Delete' }
    ]
  },
  fields: {
    email: {
      type: 'string',
      required: true,
      label: 'Email',
      description: "User's email (ex: foo@bar.com)"
    },
    external_audience_id: {
      label: 'Vibe Audience ID',
      description:
        'The ID representing the Vibe audience identifier. This is the identifier that is returned during audience creation.',
      type: 'string',
      default: {
        '@path': '$.context.personas.external_audience_id'
      },
      unsafe_hidden: true
    },
    enable_batching,
    batch_size
  },
  perform: async (request, { settings, payload, hookOutputs, syncMode }) => {
    const vibeClient = new VibeClient(request, settings.advertiserId, settings.authToken)

    if (syncMode && ['upsert', 'delete'].includes(syncMode)) {
      return await vibeClient.syncAudience({
        audienceId: hookOutputs?.retlOnMappingSave?.outputs?.audienceId ?? payload.external_audience_id,
        payloads: [payload],
        deleteUsers: syncMode === 'delete' ? true : false
      })
    }

    throw new IntegrationError('Sync mode is required for perform', 'MISSING_REQUIRED_FIELD', 400)
  },
  performBatch: async (request, { settings, payload, hookOutputs, syncMode }) => {
    const vibeClient = new VibeClient(request, settings.advertiserId, settings.authToken)

    if (syncMode && ['upsert', 'delete'].includes(syncMode)) {
      return await vibeClient.syncAudience({
        audienceId: hookOutputs?.retlOnMappingSave?.outputs?.audienceId ?? payload[0].external_audience_id,
        payloads: payload,
        deleteUsers: syncMode === 'delete' ? true : false
      })
    }

    throw new IntegrationError('Sync mode is required for performBatch', 'MISSING_REQUIRED_FIELD', 400)
  }
}

export default action
