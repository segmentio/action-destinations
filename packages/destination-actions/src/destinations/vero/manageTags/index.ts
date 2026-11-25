import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL } from '../constants'
import { required_user_id } from '../properties'
import { buildJSON } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Manage Tags',
  description:
    'Add or remove tags on a user in Vero. Also syncs audience membership as a tag named after the audience.',
  syncMode: {
    label: 'Sync Mode',
    description: 'Specify when Segment should sync data to Vero when connected to a Reverse ETL source.',
    default: 'mirror',
    choices: [
      { label: 'Row added', value: 'add' },
      { label: 'Row deleted', value: 'delete' },
      { label: 'Row added or deleted', value: 'mirror' }
    ]
  },
  fields: {
    userId: required_user_id,
    tagsToAdd: {
      label: 'Tags to Add',
      description: 'Tags to add to the user.',
      type: 'string',
      multiple: true
    },
    tagsToRemove: {
      label: 'Tags to Remove',
      description: 'Tags to remove from the user.',
      type: 'string',
      multiple: true
    },
    audienceKey: {
      label: 'Audience Key',
      description:
        'Tag name for the audience. Added when the user enters the audience, removed when they leave. Defaults to the Engage audience key. Required for Reverse ETL, where no key is sent.',
      type: 'string',
      default: { '@path': '$.context.personas.computation_key' }
    }
  },
  perform: (request, { payload, audienceMembership }) => {
    return request(`${API_URL}/users/tags/edit`, {
      method: 'put',
      json: buildJSON(payload, audienceMembership)
    })
  }
}

export default action
