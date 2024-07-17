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
      description: 'TODO: Create or select an audience in Facebook.',
      inputFields: {
        audienceName: {
          type: 'string',
          label: 'Audience Name',
          description: 'The name of the audience in Facebook.',
          default: 'TODO: Model Name by default'
        },
        existingAudienceId: {
          type: 'string',
          label: 'Existing Audience ID',
          description: 'The ID of the audience in Facebook.',
          dynamic: async (request, { settings, dynamicFieldContext }) => {
            const fbClient = new FacebookClient(request, settings.adAccountId)
            const { choices, error, nextPage } = await fbClient.getAllAudiences(dynamicFieldContext?.paging)

            if (error) {
              return { error, choices: [] }
            }

            return {
              choices,
              paging: {
                nextPage,
                previousPage: dynamicFieldContext?.paging?.nextPage
              }
            }
          }
        }
      },
      outputTypes: {
        audienceId: {
          type: 'string',
          label: 'Audience ID',
          description: 'The ID of the audience in Facebook.',
          required: true
        }
      },
      performHook: async (request, { settings, hookInputs }) => {
        const fbClient = new FacebookClient(request, settings.adAccountId)

        const { data } = await fbClient.createAudience(hookInputs.audienceName)

        return {
          successMessage: `Audience created with ID: ${data.id}`,
          savedData: {
            audienceId: data.id
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
