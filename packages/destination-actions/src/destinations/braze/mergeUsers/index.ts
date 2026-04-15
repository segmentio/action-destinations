import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { mergeUsers } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Merge Users',
  description:
    'Merge one identified user into another identified user. The merge will occur asynchronously and can take between 5-10 minutes.',
  fields: {
    identifier_to_merge: {
      label: 'Identifier to Merge',
      description:
        'User identifier for the user to be merged (the user to be deprecated). Must specify one of: External ID, User Alias, Braze ID, Email, or Phone. See [the docs](https://www.braze.com/docs/api/endpoints/user_data/post_users_merge/).',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue',
      additionalProperties: false,
      properties: {
        external_id: {
          label: 'External ID',
          description: 'The external ID of the user to merge',
          type: 'string'
        },
        user_alias: {
          label: 'User Alias',
          description: 'The user alias object identifying the user to merge',
          type: 'object',
          properties: {
            alias_name: {
              label: 'Alias Name',
              type: 'string'
            },
            alias_label: {
              label: 'Alias Label',
              type: 'string'
            }
          }
        },
        braze_id: {
          label: 'Braze ID',
          description: 'The Braze ID of the user to merge',
          type: 'string'
        },
        email: {
          label: 'Email',
          description: 'The email address of the user to merge',
          type: 'string',
          format: 'email'
        },
        phone: {
          label: 'Phone',
          description: 'The phone number of the user to merge in E.164 format (e.g., +14155552671)',
          type: 'string'
        }
      }
    },
    identifier_to_keep: {
      label: 'Identifier to Keep',
      description:
        'User identifier for the user to keep (the target user). Must specify one of: External ID, User Alias, Braze ID, Email, or Phone. See [the docs](https://www.braze.com/docs/api/endpoints/user_data/post_users_merge/).',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue',
      additionalProperties: false,
      properties: {
        external_id: {
          label: 'External ID',
          description: 'The external ID of the user to keep',
          type: 'string',
          default: {
            '@path': '$.userId'
          }
        },
        user_alias: {
          label: 'User Alias',
          description: 'The user alias object identifying the user to keep',
          type: 'object',
          properties: {
            alias_name: {
              label: 'Alias Name',
              type: 'string'
            },
            alias_label: {
              label: 'Alias Label',
              type: 'string'
            }
          }
        },
        braze_id: {
          label: 'Braze ID',
          description: 'The Braze ID of the user to keep',
          type: 'string'
        },
        email: {
          label: 'Email',
          description: 'The email address of the user to keep',
          type: 'string',
          format: 'email'
        },
        phone: {
          label: 'Phone',
          description: 'The phone number of the user to keep in E.164 format (e.g., +14155552671)',
          type: 'string'
        }
      },
      default: {
        external_id: {
          '@path': '$.userId'
        },
        braze_id: {
          '@if': {
            exists: { '@path': '$.context.traits.brazeId' }
          },
          then: { '@path': '$.context.traits.brazeId' },
          else: { '@path': '$.properties.brazeId' }
        },
        email: {
          '@if': {
            exists: { '@path': '$.context.traits.email' }
          },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        },
        phone: {
          '@if': {
            exists: { '@path': '$.context.traits.phone' }
          },
          then: { '@path': '$.context.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      }
    }
  },
  perform: (request, { settings, payload }) => {
    return mergeUsers(request, settings, payload)
  }
}

export default action
