import type { ActionDefinition, RequestClient } from '@segment/actions-core'
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
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Braze',
      description:
        'If true, Segment will batch events before sending to Braze’s identify user endpoint. Braze accepts batches of up to 50 events for this endpoint.',
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      default: 50,
      unsafe_hidden: true
    }
  },
  perform: (request, { settings, payload }) => {
    return processData(request, settings, [payload])
  },
  performBatch: (request, { settings, payload }) => {
    return processData(request, settings, payload)
  }
}

const processData = (request: RequestClient, settings: Settings, payload: Payload[]) => {
  const aliases_to_identify = payload.map((event) => {
    const { user_alias, external_id } = event
    return {
      external_id,
      user_alias
    }
  })

  return request(`${settings.endpoint}/users/identify`, {
    method: 'post',
    ...(payload.length > 1 ? { headers: { 'X-Braze-Batch': 'true' } } : undefined),
    json: {
      aliases_to_identify
    }
  })
}

export default action
