import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import PipedriveClient from "../pipedrive-client";
import { createOrUpdatePersonById, Person } from '../create-or-update-person'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Person',
  description: "Update a person in Pipedrive or create them if they don't exist yet.",
  defaultSubscription: 'type = "identify"',
  fields: {
    match_field: {
      label: 'Match field',
      description: 'If present, used instead of field in settings to find existing person in Pipedrive.',
      type: 'string',
      required: false,
      dynamic: true,
      default: {
        '@literal': 'id'
      },

    },
    match_value: {
      label: 'Match value',
      description: 'Value to find existing person by',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    name: {
      label: 'Person Name',
      description: 'Name of the person',
      type: 'string',
      required: false
    },
    email: {
      label: 'Email Address',
      description: 'Email addresses for this person.',
      type: 'string',
      required: false,
      multiple: true
    },
    phone: {
      label: 'Phone Number',
      description: 'Phone numbers for the person.',
      type: 'string',
      required: false,
      multiple: true
    },
    add_time: {
      label: 'Created At',
      description: 'If the person is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS',
      type: 'string'
    }
  },

  dynamicFields: {
    match_field: async (request, { settings }) => {
      const client = new PipedriveClient(settings, request);
      return client.getFields('person');
    },
  },

  perform: async (request, { payload, settings }) => {
    const searchField = payload.match_field || settings.personField || 'id';

    const client = new PipedriveClient(settings, request);

    const personId = await client.getId("person", searchField, payload.match_value);

    const person: Person = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      add_time: payload.add_time,
    }

    return createOrUpdatePersonById(request, settings.domain, personId, person);
  }
}

export default action
