import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import PipedriveClient from '../pipedriveApi/pipedrive-client'
import { createOrUpdateOrganizationById, Organization } from '../pipedriveApi/organizations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Organization',
  description: "Update an organization in Pipedrive or create it if it doesn't exist yet.",
  defaultSubscription: 'type = "group"',
  fields: {
    match_field: {
      label: 'Match field',
      description: 'If present, used instead of field in settings to find existing organization in Pipedrive.',
      type: 'string',
      required: false,
      dynamic: true,
      default: 'id'
    },
    match_value: {
      label: 'Match value',
      description: 'Value to find existing organization by',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    name: {
      label: 'Organization Name',
      description: 'Name of the organization',
      type: 'string',
      required: false
    },
    add_time: {
      label: 'Created At',
      description:
        'If the organization is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS',
      type: 'string'
    }
  },

  dynamicFields: {
    match_field: async (request, { settings }) => {
      const client = new PipedriveClient(settings, request)
      return client.getFields('organization')
    }
  },

  perform: async (request, { payload, settings }) => {
    const searchField = payload.match_field || settings.personField || 'id'

    const client = new PipedriveClient(settings, request)

    const organizationId = await client.getId('organization', searchField, payload.match_value)

    const organization: Organization = {
      name: payload.name,
      add_time: payload.add_time
    }

    return createOrUpdateOrganizationById(request, settings.domain, organizationId, organization)
  }
}

export default action
