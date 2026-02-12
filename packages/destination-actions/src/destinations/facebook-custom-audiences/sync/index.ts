import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import { getAudience, createAudience } from '../functions'
import { send, getAllAudiences } from './functions'

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
          dynamic: async (request, { settings }) => {
            const { retlAdAccountId } = settings
            const { choices, error } = await getAllAudiences(request, retlAdAccountId)
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
      performHook: async (request, { settings, hookInputs }) => {
        const { operation, audienceName, existingAudienceId } = hookInputs
        const { retlAdAccountId } = settings

        if (operation === 'create') {
          if (!audienceName || typeof audienceName !== 'string') {
            return {
              error: {
                message: 'Missing audience name value',
                code: 'MISSING_REQUIRED_FIELD'
              }
            }
          } else {
            const { data: { externalId } = {}, error } = await createAudience(request, audienceName, retlAdAccountId)

            if (error) {
              return { error }
            }

            return {
              successMessage: `Audience created with ID: ${externalId}`,
              savedData: {
                audienceId: externalId,
                audienceName
              }
            }
          }
        }

        if (operation === 'existing') {
          if (!existingAudienceId || typeof existingAudienceId !== 'string') {
            return {
              error: {
                message: 'Missing audience ID value',
                code: 'MISSING_REQUIRED_FIELD'
              }
            }
          } else {
            const { data: { name } = {}, error } = await getAudience(request, existingAudienceId)

            if (error) {
              return { error }
            }

            return {
              successMessage: `Connected to audience with ID: ${existingAudienceId}`,
              savedData: {
                audienceId: existingAudienceId,
                audienceName: name
              }
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
  perform: async (request, { payload, hookOutputs, syncMode }) => {
    return await send(request, [payload], hookOutputs, syncMode)
  },
  performBatch: async (request, { payload, hookOutputs, syncMode }) => {
    return await send(request, payload, hookOutputs, syncMode)
  }
}

export default action
