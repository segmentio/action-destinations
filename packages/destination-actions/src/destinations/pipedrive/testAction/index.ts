import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { searchPersonByExternalIdInCustomField } from '../search-person';
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Test Action',
  description: 'Test Action',
  fields: {
    email: {
      label: 'Email Address',
      description: 'Email address.',
      type: 'string',
      required: true,
      multiple: false
    },
    name: {
      label: 'Name',
      description: 'Name.',
      type: 'string',
      required: true,
      multiple: false
    },
    externalId: {
      label: 'External ID',
      description: 'External ID.',
      type: 'string',
      required: true,
      multiple: false
    },
    pipedriveId: {
      label: 'Pipedrive ID',
      description: 'Pipedrive ID.',
      type: 'string',
      required: false,
      multiple: false
    }
  },
  perform: async (request, { payload, settings }) => {
    try {

      if (!settings.person) {
        // If primary key for a person is not specified in settings, it means we will be searching by Person's ID passed in payload.
        // const id = payload.pipedriveId;
        // use this ID to create activities etc...
      } else {
        // If primary key for a person is specified in settings, it means we will be searching by Person's custom field value passed in payload.
        const customFieldKey = settings.person;
        const personId = await searchPersonByExternalIdInCustomField(customFieldKey, payload.externalId, request, settings.domain);
        console.log(personId);
        // use this ID to create activities etc...
      }

    } catch (err) {
      console.log(err);
    }
  }
}

export default action
