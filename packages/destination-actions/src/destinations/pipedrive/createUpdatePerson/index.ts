import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import PipedriveClient from '../pipedriveApi/pipedrive-client'
import { createOrUpdatePersonById, Person } from '../pipedriveApi/persons'

const fieldHandler = PipedriveClient.fieldHandler

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
      default: 'id'
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
    visible_to: {
      label: 'Visible To',
      description:
        'Visibility of the Person. If omitted, visibility will be set to the default visibility setting of this item type for the authorized user.',
      type: 'integer',
      choices: [
        { label: 'Owner & followers (private)', value: 1 },
        { label: 'Entire company (shared)', value: 3 }
      ],
      required: false
    },
    add_time: {
      label: 'Created At',
      description: 'If the person is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS',
      type: 'datetime'
    }
  },

  dynamicFields: {
    match_field: fieldHandler('person')
  },

  perform: async (request, { payload, settings }) => {
    const searchField = payload.match_field || settings.personField || 'id'

    const client = new PipedriveClient(settings, request)

    const personId = await client.getId('person', searchField, payload.match_value)

    const person: Person = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      add_time: payload.add_time ? `${payload.add_time}` : undefined,
      visible_to: payload.visible_to
    }

    return createOrUpdatePersonById(request, settings.domain, personId, person)
  }
}

export default action
