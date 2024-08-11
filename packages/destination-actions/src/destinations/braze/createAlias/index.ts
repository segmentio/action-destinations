import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Alias',
  description: 'Create new user aliases for existing identified users, or to create new unidentified users.',
  defaultSubscription: 'event = "Create Alias"',
  fields: {
    external_id: {
      label: 'External ID',
      description: 'The external ID of the user to create an alias for.',
      type: 'string',
      allowNull: true
    },
    alias_name: {
      label: 'Alias Name',
      description: 'The alias identifier',
      type: 'string',
      required: true
    },
    alias_label: {
      label: 'Alias Label',
      description: 'A label indicating the type of alias',
      type: 'string',
      required: true
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Braze',
      description:
        'If true, Segment will batch events before sending to Braze’s create alias endpoint. Braze accepts batches of up to 50 events for this endpoint.',
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
  const user_aliases = payload.map((event) => {
    const { external_id, alias_label, alias_name } = event
    return {
      ...(external_id ? { external_id } : {}),
      alias_name,
      alias_label
    }
  })

  return request(`${settings.endpoint}/users/alias/new`, {
    method: 'post',
    ...(payload.length > 1 ? { headers: { 'X-Braze-Batch': 'true' } } : undefined),
    json: {
      user_aliases
    }
  })
}

export default action
