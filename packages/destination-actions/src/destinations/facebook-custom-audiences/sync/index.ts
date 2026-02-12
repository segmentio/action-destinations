import { IntegrationError, ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import FacebookClient from '../fbca-operations'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync data to Facebook Custom Audiences.',
  hooks: {
    retlOnMappingSave: {
      label: 'Select or create an audience in Facebook',
      description:
        'When saving this mapping, Segment will either create a new audience in Facebook or connect to an existing one. To create a new audience, enter the name of the audience. To connect to an existing audience, select the audience ID from the dropdown.',
      inputFields: {
        operation: {
          type: 'string',
          label: 'Create a new custom audience or connect to an existing one?',
          description:
            'Choose to either create a new custom audience or use an existing one. If you opt to create a new audience, we will display the required fields for audience creation. If you opt to use an existing audience, a drop-down menu will appear, allowing you to select from all the custom audiences in your ad account.',
          choices: [
            { label: 'Create New Audience', value: 'create' },
            { label: 'Connect to Existing Audience', value: 'existing' }
          ],
          default: 'create'
        },
        audienceName: {
          type: 'string',
          label: 'Audience Creation Name',
          description: 'The name of the audience in Facebook.',
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
          description: 'The ID of the audience in Facebook.',
          depends_on: {
            conditions: [
              {
                fieldKey: 'operation',
                operator: 'is',
                value: 'existing'
              }
            ]
          },
          dynamic: async (request, { settings, features }) => {
            const fbClient = new FacebookClient(request, settings.retlAdAccountId, features)
            const { choices, error } = await fbClient.getAllAudiences()

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
          description: 'The name of the audience in Facebook this mapping is connected to.',
          required: true
        },
        audienceId: {
          type: 'string',
          label: 'Audience ID',
          description: 'The ID of the audience in Facebook.',
          required: true
        }
      },
      performHook: async (request, { settings, hookInputs, features }) => {
        const fbClient = new FacebookClient(request, settings.retlAdAccountId, features)

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
          const { data, error } = await fbClient.getSingleAudience(hookInputs.existingAudienceId)

          if (error) {
            return {
              error: {
                message: error.error.message,
                code: error.error.type
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
          const { data } = await fbClient.createAudience(hookInputs.audienceName)

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
    description: 'The sync mode to use when syncing data to Facebook.',
    default: 'upsert',
    choices: [
      { value: 'upsert', label: 'Upsert' },
      { value: 'delete', label: 'Delete' }
    ]
  },
  fields,
  perform: async (request, { settings, payload, hookOutputs, syncMode, features, statsContext }) => {
    const fbClient = new FacebookClient(request, settings.retlAdAccountId, features, statsContext)

    if (syncMode && ['upsert', 'delete'].includes(syncMode)) {
      return await fbClient.syncAudience({
        audienceId: hookOutputs?.retlOnMappingSave?.outputs?.audienceId ?? payload.external_audience_id,
        payloads: [payload],
        deleteUsers: syncMode === 'delete' ? true : false
      })
    }

    throw new IntegrationError('Sync mode is required for perform', 'MISSING_REQUIRED_FIELD', 400)
  },
  performBatch: async (request, { settings, payload, hookOutputs, syncMode, features, statsContext }) => {
    const fbClient = new FacebookClient(request, settings.retlAdAccountId, features, statsContext)

    if (syncMode && ['upsert', 'delete'].includes(syncMode)) {
      return await fbClient.syncAudience({
        audienceId: hookOutputs?.retlOnMappingSave?.outputs?.audienceId ?? payload[0].external_audience_id,
        payloads: payload,
        deleteUsers: syncMode === 'delete' ? true : false
      })
    }

    throw new IntegrationError('Sync mode is required for performBatch', 'MISSING_REQUIRED_FIELD', 400)
  }
}

export default action
