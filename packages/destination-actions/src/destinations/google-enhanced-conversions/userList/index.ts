import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createGoogleAudience, getGoogleAudience, getListIds, handleUpdate } from '../functions'
import { IntegrationError } from '@segment/actions-core'
import { UserListResponse } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Customer Match User List',
  description: 'Sync a Segment Engage Audience into a Google Customer Match User List.',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  syncMode: {
    description: 'Define how the records will be synced from RETL to Google',
    label: 'How to sync records',
    default: 'add',
    choices: [
      { label: 'Adds users to the connected Google Customer Match User List', value: 'add' },
      { label: 'Remove users from the connected Google Customer Match User List', value: 'delete' }
    ]
  },
  fields: {
    first_name: {
      label: 'First Name',
      description: "The user's first name.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.firstName' },
          then: { '@path': '$.context.traits.firstName' },
          else: { '@path': '$.properties.firstName' }
        }
      }
    },
    last_name: {
      label: 'Last Name',
      description: "The user's last name.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.lastName' },
          then: { '@path': '$.context.traits.lastName' },
          else: { '@path': '$.properties.lastName' }
        }
      }
    },
    email: {
      label: 'Email',
      description: "The user's email address.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    phone: {
      label: 'Phone',
      description: "The user's phone number.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.phone' },
          then: { '@path': '$.context.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      }
    },
    country_code: {
      label: 'Country Code',
      description: "The user's country code.",
      type: 'string'
    },
    postal_code: {
      label: 'Postal Code',
      description: "The user's postal code.",
      type: 'string'
    },
    crm_id: {
      label: 'CRM ID',
      description: 'Advertiser-assigned user ID for Customer Match upload.',
      type: 'string'
    },
    mobile_advertising_id: {
      label: 'Mobile Advertising ID',
      description: 'Mobile device ID (advertising ID/IDFA).',
      type: 'string',
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    ad_user_data_consent_state: {
      label: 'Ad User Data Consent State',
      description:
        'This represents consent for ad user data.For more information on consent, refer to [Google Ads API Consent](https://developers.google.com/google-ads/api/rest/reference/rest/v15/Consent).',
      type: 'string',
      choices: [
        { label: 'GRANTED', value: 'GRANTED' },
        { label: 'DENIED', value: 'DENIED' },
        { label: 'UNSPECIFIED', value: 'UNSPECIFIED' }
      ],
      required: true
    },
    ad_personalization_consent_state: {
      label: 'Ad Personalization Consent State',
      type: 'string',
      description:
        'This represents consent for ad personalization. This can only be set for OfflineUserDataJobService and UserDataService.For more information on consent, refer to [Google Ads API Consent](https://developers.google.com/google-ads/api/rest/reference/rest/v15/Consent).',
      choices: [
        { label: 'GRANTED', value: 'GRANTED' },
        { label: 'DENIED', value: 'DENIED' },
        { label: 'UNSPECIFIED', value: 'UNSPECIFIED' }
      ],
      required: true
    },
    external_audience_id: {
      label: 'External Audience ID',
      description: 'The ID of the List that users will be synced to.',
      type: 'string',
      default: {
        '@path': '$.context.personas.external_audience_id'
      },
      unsafe_hidden: true
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching for the request.',
      type: 'boolean',
      default: true,
      unsafe_hidden: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'The number of records to send in each batch.',
      type: 'integer',
      default: 10000,
      unsafe_hidden: true
    },
    event_name: {
      label: 'Event Name',
      description: 'The name of the current Segment event.',
      type: 'string',
      default: {
        '@path': '$.event'
      },
      required: true,
      readOnly: true
    }
  },
  hooks: {
    retlOnMappingSave: {
      label: 'Connect to a Google Customer Match User List',
      description: 'When saving this mapping, we will create a list in Google using the fields you provide.',
      inputFields: {
        list_id: {
          type: 'string',
          label: 'Existing List ID',
          description:
            'The ID of an existing Google list that you would like to sync users to. If you provide this, we will not create a new list.',
          required: false,
          dynamic: async (request, { settings, auth }) => {
            return await getListIds(request, settings, auth)
          }
        },
        list_name: {
          type: 'string',
          label: 'List Name',
          description: 'The name of the Google list that you would like to create.',
          required: false
        },
        external_id_type: {
          type: 'string',
          label: 'External ID Type',
          description: 'Customer match upload key types.',
          required: true,
          default: 'CONTACT_INFO',
          choices: [
            { label: 'CONTACT INFO', value: 'CONTACT_INFO' },
            { label: 'CRM ID', value: 'CRM_ID' },
            { label: 'MOBILE ADVERTISING ID', value: 'MOBILE_ADVERTISING_ID' }
          ]
        },
        app_id: {
          label: 'App ID',
          description:
            'A string that uniquely identifies a mobile application from which the data was collected. Required if external ID type is mobile advertising ID',
          type: 'string',
          depends_on: {
            match: 'all',
            conditions: [
              {
                fieldKey: 'external_id_type',
                operator: 'is',
                value: 'MOBILE_ADVERTISING_ID'
              }
            ]
          }
        }
      },
      outputTypes: {
        id: {
          type: 'string',
          label: 'ID',
          description: 'The ID of the Google Customer Match User list that users will be synced to.',
          required: false
        },
        name: {
          type: 'string',
          label: 'List Name',
          description: 'The name of the Google Customer Match User list that users will be synced to.',
          required: false
        },
        external_id_type: {
          type: 'string',
          label: 'External ID Type',
          description: 'Customer match upload key types.',
          required: false
        }
      },
      performHook: async (request, { auth, settings, hookInputs, statsContext }) => {
        if (hookInputs.list_id) {
          try {
            const response: UserListResponse = await getGoogleAudience(request, settings, hookInputs.list_id, {
              refresh_token: auth?.refreshToken
            })
            return {
              successMessage: `Using existing list '${response.results[0].userList.id}' (id: ${hookInputs.list_id})`,
              savedData: {
                id: hookInputs.list_id,
                name: response.results[0].userList.name,
                external_id_type: hookInputs.external_id_type
              }
            }
          } catch (e) {
            const message = (e as IntegrationError).message || JSON.stringify(e) || 'Failed to get list'
            const code = (e as IntegrationError).code || 'GET_LIST_FAILURE'
            return {
              error: {
                message,
                code
              }
            }
          }
        }

        try {
          const input = {
            audienceName: hookInputs.list_name,
            settings: settings,
            audienceSettings: {
              external_id_type: hookInputs.external_id_type,
              app_id: hookInputs.app_id
            }
          }
          const listId = await createGoogleAudience(request, input, { refresh_token: auth?.refreshToken }, statsContext)

          return {
            successMessage: `List '${hookInputs.list_name}' (id: ${listId}) created successfully!`,
            savedData: {
              id: listId,
              name: hookInputs.list_name,
              external_id_type: hookInputs.external_id_type
            }
          }
        } catch (e) {
          const message = (e as IntegrationError).message || JSON.stringify(e) || 'Failed to create list'
          const code = (e as IntegrationError).code || 'CREATE_LIST_FAILURE'
          return {
            error: {
              message,
              code
            }
          }
        }
      }
    }
  },
  perform: async (request, { settings, audienceSettings, payload, hookOutputs, statsContext, syncMode }) => {
    hookOutputs?.retlOnMappingSave?.outputs.id
    return await handleUpdate(
      request,
      settings,
      audienceSettings,
      [payload],
      hookOutputs?.retlOnMappingSave?.outputs.id,
      hookOutputs?.retlOnMappingSave?.outputs.external_id_type,
      syncMode,
      statsContext
    )
  },
  performBatch: async (request, { settings, audienceSettings, payload, hookOutputs, statsContext, syncMode }) => {
    return await handleUpdate(
      request,
      settings,
      audienceSettings,
      payload,
      hookOutputs?.retlOnMappingSave?.outputs.id,
      hookOutputs?.retlOnMappingSave?.outputs.external_id_type,
      syncMode,
      statsContext
    )
  }
}

export default action
