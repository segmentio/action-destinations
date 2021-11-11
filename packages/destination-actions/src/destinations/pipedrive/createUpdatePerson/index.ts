import { DynamicFieldItem } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { PipedriveFields } from '../domain'
import { createOrUpdatePersonById, Person } from '../create-or-update-person'

let personFields: DynamicFieldItem[] = [];

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
      if (!personFields.length) {
        const response = await request<PipedriveFields>(`https://${settings.domain}.pipedrive.com/api/v1/personFields`);
        const body = response.data;
        personFields = body.data.map(f => ({
          label: f.name,
          value: f.key,
        }));
      }
      return {
        body: {
          data: personFields,
          pagination: {}
        },
      };
    },
  },

  perform: async (request, { payload, settings }) => {

    // PERSON LOOKUP HERE

    const personId = 0; // id from lookup will be here

    const person: Person = {}
    if (payload.name) {
      person.name = payload.name
    }
    if (payload.email) {
      person.email = payload.email
    }
    if (payload.phone) {
      person.phone = payload.phone
    }
    if (payload.add_time) {
      person.add_time = payload.add_time
    }

    await createOrUpdatePersonById(request, settings.domain, personId, person);

  }
}

export default action
