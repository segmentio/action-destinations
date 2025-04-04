import type { DynamicFieldResponse } from '@segment/actions-core'
import OrttoClient from './ortto-client'
export const audienceHook = {
  retlOnMappingSave: {
    label: 'Connect the action to an Audience in Ortto',
    description: 'When saving this mapping, this action will be linked to an audience in Ortto.',
    inputFields: {
      audience_id: {
        label: 'Audience',
        description:
          'The Audience to add the contact profile to. If set, the following audience name field will be ignored.',
        type: 'string',
        dynamic: async (request, { settings }): Promise<DynamicFieldResponse> => {
          const client: OrttoClient = new OrttoClient(request)
          return await client.listAudiences(settings)
        }
      },
      name: {
        type: 'string',
        label: 'The name of the Audience to create',
        description:
          'Enter the name of the audience you want to create in Ortto. Audience names are unique for each Segment data source. If a pre-existing Audience is selected, no new audience will be created.',
        required: false
      }
    },
    outputTypes: {
      id: {
        type: 'string',
        label: 'ID',
        description: 'The ID of the Ortto audience to which contacts will be synced.',
        required: false
      },
      name: {
        type: 'string',
        label: 'Name',
        description: 'The name of the Ortto audience to which contacts will be synced.',
        required: false
      }
    }
  }
}
