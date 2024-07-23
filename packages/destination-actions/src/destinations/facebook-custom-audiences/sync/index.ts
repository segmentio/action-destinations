import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import FacebookClient from '../fbca-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync data to Facebook Custom Audiences.',
  fields: {},
  hooks: {
    retlOnMappingSave: {
      label: 'Select or create an audience in Facebook',
      description:
        'When saving this mapping, Segment will either create a new audience in Facebook or connect to an existing one. To create a new audience, enter the name of the audience. To connect to an existing audience, select the audience ID from the dropdown.',
      inputFields: {
        audienceName: {
          type: 'string',
          label: 'Audience Creation Name',
          description: 'The name of the audience in Facebook.',
          default: 'TODO: Model Name by default'
        },
        existingAudienceId: {
          type: 'string',
          label: 'Existing Audience ID',
          description: 'The ID of the audience in Facebook.',
          dynamic: async (request, { settings }) => {
            const fbClient = new FacebookClient(request, settings.retlAdAccountId)
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
      performHook: async (request, { settings, hookInputs }) => {
        const fbClient = new FacebookClient(request, settings.retlAdAccountId)

        if (hookInputs.existingAudienceId) {
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
        const { data } = await fbClient.createAudience(hookInputs.audienceName)

        return {
          successMessage: `Audience created with ID: ${data.id}`,
          savedData: {
            audienceId: data.id,
            audienceName: hookInputs.audienceName
          }
        }
      }
    }
  },
  perform: (_request, _data) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
