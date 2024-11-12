import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description:
    'Identifies an unidentified (alias-only) user. Use alongside the Create Alias action, or with user aliases you have already defined.',
  fields: {
    external_id: {
      label: 'External ID',
      description: 'The external ID of the user to identify.',
      type: 'string',
      required: true
    },
    user_alias: {
      label: 'User Alias Object',
      description:
        'A user alias object. See [the docs](https://www.braze.com/docs/api/objects_filters/user_alias_object/).',
      type: 'object',
      required: true,
      properties: {
        alias_name: {
          label: 'Alias Name',
          type: 'string',
          required: true
        },
        alias_label: {
          label: 'Alias Label',
          type: 'string',
          required: true
        }
      }
    },
    merge_behavior: {
      label: 'Merge Behavior',
      description:
        'Sets the endpoint to merge some fields found exclusively on the anonymous user to the identified user. See [the docs](https://www.braze.com/docs/api/endpoints/user_data/post_user_identify/#request-parameters).',
      type: 'string',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'merge', label: 'Merge' }
      ]
    }
  },
  perform: (request, { settings, payload }) => {
    return request(`${settings.endpoint}/users/identify`, {
      method: 'post',
      json: {
        aliases_to_identify: [
          {
            external_id: payload.external_id,
            user_alias: payload.user_alias
          }
        ],
        ...(payload.merge_behavior !== undefined && { merge_behavior: payload.merge_behavior })
      }
    })
  }
}

export default action
