import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import PipedriveClient from '../pipedriveApi/pipedrive-client'
import { createUpdateLead, Lead } from '../pipedriveApi/leads'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update a Lead',
  description: "Update a Lead in Pipedrive or create it if it doesn't exist yet.",
  defaultSubscription: 'type = "identify"',
  fields: {
    lead_id: {
      label: 'Lead ID',
      description: 'ID of Lead in Pipedrive to Update. If left empty, a new one will be created',
      type: 'integer',
      required: false,
    },
    person_match_field: {
      label: 'Person match field',
      description: 'If present, used instead of field in settings to find existing person in Pipedrive.',
      type: 'string',
      required: false,
      dynamic: true,
      default: {
        '@literal': 'id'
      },

    },
    person_match_value: {
      label: 'Person match value',
      description: 'Value to find existing person by. Required unless organization_match_value present',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },

    organization_match_field: {
      label: 'Organization match field',
      description: 'If present, used instead of field in settings to find existing organization in Pipedrive.',
      type: 'string',
      required: false,
      dynamic: true,
      default: {
        '@literal': 'id'
      },

    },
    organization_match_value: {
      label: 'Organization match value',
      description: 'Value to find existing organization by. Required unless person_match_value present',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },

    title: {
      label: 'Title',
      description:
        'The name of the Lead',
      type: 'string',
      required: true
    },
    expected_close_date: {
      label: 'Expected Close Date',
      description:
        'The date of when the Deal which will be created from the Lead is expected to be closed. In ISO 8601 format: YYYY-MM-DD.',
      type: 'string',
      required: false,
    },
    visible_to: {
      label: 'Visible To',
      description:
        'Visibility of the Lead. If omitted, visibility will be set to the default visibility setting of this item type for the authorized user.',
      type: 'integer',
      choices: [
        { label: 'Owner & followers (private)', value: 1 },
        { label: 'Entire company (shared)', value: 3 },
      ],
      required: false,
    },
    add_time: {
      label: 'Created At',
      description: 'If the lead is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS',
      type: 'string',
      required: false,
    }
  },


  dynamicFields: {
    person_match_field: async (request, { settings }) => {
      const client = new PipedriveClient(settings, request);
      return client.getFields('person');
    },
    organization_match_field: async (request, { settings }) => {
      const client = new PipedriveClient(settings, request);
      return client.getFields('organization');
    },
  },

  perform: async (request, { payload, settings }) => {

    const client = new PipedriveClient(settings, request);

    const personSearchField = payload.person_match_field || settings.personField || 'id';
    const organizationSearchField = payload.organization_match_field || settings.organizationField || 'id';
    const [personId, organizationId] = await Promise.all([
      client.getId("person", personSearchField, payload.person_match_value),
      client.getId("organization", organizationSearchField, payload.organization_match_value),
    ])

    const lead: Lead = {
      id: payload.lead_id,
      title: payload.title,
      expected_close_date: payload.expected_close_date,
      visible_to: payload.visible_to,
      person_id: personId || undefined,
      organization_id: organizationId || undefined,
    }

    if(!lead.id && !lead.person_id && !lead.organization_id){
      throw new Error("No related organization or person, unable to create lead!");
    }

    return createUpdateLead(client, lead);
  }
}

export default action
