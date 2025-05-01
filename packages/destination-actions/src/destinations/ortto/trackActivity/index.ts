import type { ActionDefinition, DynamicFieldResponse, APIError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import OrttoClient from '../ortto-client'
import { commonFields } from '../common-fields'
const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Activity',
  description: 'Track user activity',
  defaultSubscription: 'type = "track"',
  fields: {
    timestamp: commonFields.timestamp,
    message_id: commonFields.message_id,
    user_id: commonFields.user_id,
    anonymous_id: commonFields.anonymous_id,
    enable_batching: commonFields.enable_batching,
    namespace: {
      label: 'Namespace',
      description: 'Event namespace',
      type: 'string',
      readOnly: true,
      unsafe_hidden: true,
      default: {
        '@path': '$.context.app.namespace'
      }
    },
    event: {
      label: 'Event name',
      description: 'Event name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      label: 'Activity properties',
      description: 'An object containing key-value pairs representing activity attributes',
      type: 'object',
      defaultObjectUI: 'keyvalue'
    },
    ip: {
      label: 'IP Address',
      description: 'The IP address of the location where the activity occurred.',
      placeholder: '180.1.12.125',
      type: 'string',
      format: 'ipv4',
      default: { '@path': '$.context.ip' },
      allowNull: true
    },
    location: {
      label: 'Location',
      description: 'The location where the activity occurred. Will take priority over the IP address.',
      type: 'object',
      defaultObjectUI: 'keyvalue:only',
      additionalProperties: false,
      allowNull: true,
      properties: {
        country: {
          label: 'Country',
          type: 'string',
          allowNull: true
        },
        state: {
          label: 'State',
          type: 'string',
          allowNull: true
        },
        city: {
          label: 'City',
          type: 'string',
          allowNull: true
        },
        post_code: {
          label: 'Postcode',
          type: 'string',
          allowNull: true
        }
      },
      default: {
        country: {
          '@if': {
            exists: { '@path': '$.traits.address.country' },
            then: { '@path': '$.traits.address.country' },
            else: { '@path': '$.context.traits.address.country' }
          }
        },
        state: {
          '@if': {
            exists: { '@path': '$.traits.address.state' },
            then: { '@path': '$.traits.address.state' },
            else: { '@path': '$.context.traits.address.state' }
          }
        },
        city: {
          '@if': {
            exists: { '@path': '$.traits.address.city' },
            then: { '@path': '$.traits.address.city' },
            else: { '@path': '$.context.traits.address.city' }
          }
        },
        post_code: {
          '@if': {
            exists: { '@path': '$.traits.address.postal_code' },
            then: { '@path': '$.traits.address.postal_code' },
            else: { '@path': '$.context.traits.address.postal_code' }
          }
        }
      }
    },
    traits: {
      label: 'Custom contact traits',
      description:
        'When provided, it contains key-value pairs representing custom properties assigned to the associated contact profile',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      displayMode: 'collapsed',
      properties: {
        email: {
          label: 'Email',
          description: "The contact's email address",
          placeholder: 'john.smith@example.com',
          type: 'string',
          format: 'email'
        },
        phone: {
          label: 'Phone Number',
          description: "The contact's phone number (including the country code is strongly recommended)",
          placeholder: '+1 555 555 5555',
          type: 'string'
        },
        first_name: {
          label: 'First Name',
          description: "The contact's first name",
          placeholder: 'John',
          type: 'string'
        },
        last_name: {
          label: 'Last Name',
          description: "The contact's last name",
          placeholder: 'Smith',
          type: 'string'
        }
      },
      default: {
        email: {
          '@if': {
            exists: { '@path': '$.traits.email' },
            then: { '@path': '$.traits.email' },
            else: { '@path': '$.context.traits.email' }
          }
        },
        phone: {
          '@if': {
            exists: { '@path': '$.traits.phone' },
            then: { '@path': '$.traits.phone' },
            else: { '@path': '$.context.traits.phone' }
          }
        },
        first_name: {
          '@if': {
            exists: { '@path': '$.traits.first_name' },
            then: { '@path': '$.traits.first_name' },
            else: { '@path': '$.context.traits.first_name' }
          }
        },
        last_name: {
          '@if': {
            exists: { '@path': '$.traits.last_name' },
            then: { '@path': '$.traits.last_name' },
            else: { '@path': '$.context.traits.last_name' }
          }
        }
      }
    },
    audience_id: {
      label: 'Audience',
      description: `The Audience to add the associated contact profile to.`,
      type: 'string',
      dynamic: true
    }
  },
  dynamicFields: {
    audience_id: async (request, { settings }): Promise<DynamicFieldResponse> => {
      const client: OrttoClient = new OrttoClient(request)
      return await client.listAudiences(settings)
    }
  },
  hooks: {
    retlOnMappingSave: {
      label: 'Connect the action to an Audience in Ortto',
      description: 'When saving this mapping, this action will be linked to an audience in Ortto.',
      inputFields: {
        name: {
          type: 'string',
          label: 'The name of the Audience to create',
          description:
            'Enter the name of the audience you want to create in Ortto. Audience names are unique for each Segment data source. If each track activity has an Audience field explicitly set, that value will take precedence.',
          required: false
        }
      },
      outputTypes: {
        id: {
          type: 'string',
          label: 'ID',
          description: 'The ID of the Ortto audience to which the associated contacts will be synced.',
          required: false
        },
        name: {
          type: 'string',
          label: 'Name',
          description: 'The name of the Ortto audience to which the associated contacts will be synced.',
          required: false
        }
      },
      performHook: async (request, { settings, hookInputs }) => {
        if (hookInputs.name) {
          try {
            const client: OrttoClient = new OrttoClient(request)
            const audience = await client.createAudience(settings, hookInputs.name as string)
            return {
              successMessage: `Audience '${audience.name}' (id: ${audience.id}) has been created successfully.`,
              savedData: {
                id: audience.id,
                name: audience.name
              }
            }
          } catch (err) {
            return {
              error: {
                message: (err as APIError).message ?? 'Unknown Error',
                code: (err as APIError).status?.toString() ?? 'Unknown Error'
              }
            }
          }
        }
        return {}
      }
    }
  },
  perform: async (request, { settings, payload, hookOutputs }) => {
    const client: OrttoClient = new OrttoClient(request)
    return await client.sendActivities(
      settings,
      [payload],
      (hookOutputs?.retlOnMappingSave?.outputs?.id as string) ?? ''
    )
  },
  performBatch: async (request, { settings, payload, hookOutputs }) => {
    const client: OrttoClient = new OrttoClient(request)
    return await client.sendActivities(settings, payload, (hookOutputs?.retlOnMappingSave?.outputs?.id as string) ?? '')
  }
}

export default action
