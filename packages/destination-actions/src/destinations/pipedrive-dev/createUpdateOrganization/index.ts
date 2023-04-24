import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import PipedriveClient from '../pipedriveApi/pipedrive-client'
import { createOrUpdateOrganizationById, Organization } from '../pipedriveApi/organizations'
import { addCustomFieldsFromPayloadToEntity } from '../utils'

const fieldHandler = PipedriveClient.fieldHandler

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
      dynamic: true
    },
    match_value: {
      label: 'Match value',
      description: 'Value to find existing organization by',
      type: 'string',
      required: true,
      default: {
        '@path': '$.groupId'
      }
    },
    name: {
      label: 'Organization Name',
      description: 'Name of the organization',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.name'
      }
    },
    visible_to: {
      label: 'Visible To',
      description:
        'Visibility of the Organization. If omitted, visibility will be set to the default visibility setting of this item type for the authorized user.',
      type: 'integer',
      choices: [
        { label: 'Owner & followers (private)', value: 1 },
        { label: 'Entire company (shared)', value: 3 }
      ],
      required: false
    },
    add_time: {
      label: 'Created At',
      description:
        'If the organization is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS',
      type: 'datetime'
    },
    custom_fields: {
      label: 'Custom fields',
      description: 'New values for custom fields.',
      type: 'object',
      required: false
    }
  },

  dynamicFields: {
    match_field: fieldHandler('organization')
  },

  perform: async (request, { payload, settings }) => {
    const searchField = payload.match_field || settings.organizationField || 'id'

    const client = new PipedriveClient(settings, request)

    const organizationId = await client.getId('organization', searchField, payload.match_value)

    const organization: Organization = {
      name: payload.name,
      add_time: payload.add_time ? `${payload.add_time}` : undefined,
      visible_to: payload.visible_to
    }

    if (!organizationId)
      if (payload.match_field && payload.match_value)
        // if doing a create, write the match_field and match_value data to the new Organization object's custom field
        Object.assign(organization, { [payload.match_field]: payload.match_value })

    addCustomFieldsFromPayloadToEntity(payload, organization)

    return createOrUpdateOrganizationById(request, settings.domain, organizationId, organization)
  }
}

export default action
