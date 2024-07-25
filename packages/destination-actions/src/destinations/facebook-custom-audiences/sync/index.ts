import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import FacebookClient from '../fbca-operations'

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
      { value: 'add', label: 'Add' },
      { value: 'update', label: 'Update' },
      { value: 'upsert', label: 'Upsert' },
      { value: 'delete', label: 'Delete' }
    ]
  },
  fields: {
    // !Very important: the keys in this object are purposefully named as the lower case version of the
    // schema that facebook expects when syncing data to audiences. For example, the Date Of Birth Year field
    // is represented as DOBY in the schema that facebook expects.
    email: {
      type: 'string',
      label: 'Email',
      description: 'The email address of the user.'
    },
    phone: {
      type: 'string',
      label: 'Phone',
      description: 'The phone number of the user.'
    },
    gen: {
      type: 'string',
      label: 'Gender',
      description: 'The gender of the user.'
    },
    dob: {
      // object with year, month, day properties
      type: 'object',
      label: 'Date of Birth',
      description: 'The date of birth of the user.',
      properties: {
        doby: {
          type: 'number',
          label: 'Year'
        },
        dobm: {
          type: 'number',
          label: 'Month'
        },
        dobd: {
          type: 'number',
          label: 'Day'
        }
      }
    },
    name: {
      // object with first, last, first_initial properties
      type: 'object',
      label: 'Name',
      description: 'The name of the user.',
      properties: {
        fn: {
          type: 'string',
          label: 'First Name'
        },
        ln: {
          type: 'string',
          label: 'Last Name'
        },
        fi: {
          type: 'string',
          label: 'First Initial'
        }
      }
    },
    address: {
      // object with city, state, postal_code, country properties
      type: 'object',
      label: 'Address',
      description: 'The address of the user.',
      properties: {
        ct: {
          type: 'string',
          label: 'City'
        },
        st: {
          type: 'string',
          label: 'State'
        },
        zip: {
          type: 'string',
          label: 'Postal Code'
        },
        country: {
          type: 'string',
          label: 'Country'
        }
      }
    },
    madid: {
      type: 'string',
      label: 'Mobile Advertising ID',
      description: 'The mobile advertising ID of the user.'
    },
    extern_id: {
      type: 'string',
      label: 'External ID',
      description: 'The external ID of the user.'
    },
    app_ids: {
      type: 'string',
      multiple: true,
      label: 'App IDs',
      description: 'The app IDs of the user.'
    },
    page_ids: {
      type: 'string',
      multiple: true,
      label: 'Page IDs',
      description: 'The page IDs of the user.'
    }
  },
  perform: async (request, { settings, payload, hookOutputs, syncMode }) => {
    const fbClient = new FacebookClient(request, settings.retlAdAccountId)

    if (syncMode === 'add' || syncMode === 'update' || syncMode === 'upsert') {
      return await fbClient.syncAudience({
        audienceId: hookOutputs?.retlOnMappingSave.audienceId,
        payload: [payload]
      })
    }

    if (syncMode === 'delete') {
      // TODO DELETE OPERATION
    }
  },
  performBatch: async (request, { settings, payload, hookOutputs, syncMode }) => {
    console.log('test performBatch')
    const fbClient = new FacebookClient(request, settings.retlAdAccountId)

    if (syncMode === 'add' || syncMode === 'update' || syncMode === 'upsert') {
      return await fbClient.syncAudience({
        audienceId: hookOutputs?.retlOnMappingSave.audienceId,
        payload
      })
    }

    if (syncMode === 'delete') {
      // TODO DELETE OPERATION
    }
  }
}

export default action
