import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Activity, createActivity } from '../pipedriveApi/activities'
import PipedriveClient from '../pipedriveApi/pipedrive-client'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update an Activity',
  description: "Update an Activity in Pipedrive or create it if it doesn't exist yet.",
  defaultSubscription: 'type = "track"',
  fields: {
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
      description: 'Value to find existing person by',
      type: 'string',
      required: true,
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
      description: 'Value to find existing organization by',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },

    deal_match_field: {
      label: 'Deal match field',
      description: 'If present, used instead of field in settings to find existing deal in Pipedrive.',
      type: 'string',
      required: false,
      dynamic: true,
      default: 'id',
    },
    deal_match_value: {
      label: 'Deal match value',
      description: 'Value to find existing deal by',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },

    subject: {
      label: 'Activity Subject',
      description: 'Subject of the Activity. When value for subject is not set, it will be given a default value `Call`.',
      type: 'string',
      required: false,
    },
    type: {
      label: 'Type',
      description:
        'Type of the Activity. This is in correlation with the key_string parameter of ActivityTypes. When value for type is not set, it will be given a default value `Call`',
      type: 'string',
      required: false,
    },
    description: {
      label: 'Description',
      description:
        'Additional details about the Activity that is synced to your external calendar. Unlike the note added to the Activity, the description is publicly visible to any guests added to the Activity.',
      type: 'string',
      required: false,
    },
    note: {
      label: 'Note',
      description:
        'Note of the Activity (HTML format)',
      type: 'string',
      required: false,
    },
    due_date: {
      label: 'Due Date',
      description:
        'Due date of the Activity. Format: YYYY-MM-DD',
      type: 'string',
      required: false,
    },
    due_time: {
      label: 'Due Time',
      description:
        'Due time of the Activity in UTC. Format: HH:MM',
      type: 'string',
      required: false,
    },
    duration: {
      label: 'Duration',
      description:
        'Duration of the Activity. Format: HH:MM',
      type: 'string',
      required: false,
    },
    done: {
      label: 'Done',
      description:
        'Whether the Activity is done or not.',
      type: 'boolean',
      required: false,
    },
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
    deal_match_field: async (request, { settings }) => {
      const client = new PipedriveClient(settings, request);
      return client.getFields('deal');
    },
    type: async (request, { settings }) => {
      const client = new PipedriveClient(settings, request);
      return client.getActivityTypes();
    },
  },

  perform: async (request, { payload, settings }) => {

    const client = new PipedriveClient(settings, request);

    const personSearchField = payload.person_match_field || settings.personField || 'id';
    const organizationSearchField = payload.organization_match_field || settings.organizationField || 'id';
    const dealSearchField = payload.deal_match_field || settings.dealField || 'id';

    const [personId, organizationId, dealId] = await Promise.all([
      await client.getId("person", personSearchField, payload.person_match_value),
      await client.getId("organization", organizationSearchField, payload.organization_match_value),
      await client.getId("deal", dealSearchField, payload.deal_match_value),
    ])

    const activity: Activity = {
      subject: payload.subject,
      type: payload.type,
      public_description: payload.description,
      note: payload.note,
      due_date: payload.due_date,
      due_time: payload.due_time,
      duration: payload.due_time,
      done: payload.done,
      person_id: personId || undefined,
      org_id: organizationId || undefined,
      deal_id: dealId || undefined,
    }

    return createActivity(request, settings.domain, activity);
  }

}

export default action
