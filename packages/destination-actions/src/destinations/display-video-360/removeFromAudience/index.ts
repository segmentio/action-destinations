import type { ActionDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'

import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { handleUpdate } from '../shared'

import { user_identifier, enable_batching, external_audience_id, identifier_value } from '../properties'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Remove from Audience',
  description: 'Remove users from an audience',
  fields: {
    user_identifier: { ...user_identifier },
    identifier_value: { ...identifier_value },
    enable_batching: { ...enable_batching },
    external_audience_id: { ...external_audience_id }
  },
  perform: async (request, { payload, audienceSettings, statsContext, settings }) => {
    statsContext?.statsClient?.incr('addToAudience', 1, statsContext?.tags)

    if (!audienceSettings) {
      throw new IntegrationError('Bad Request: no audienceSettings found.', 'INVALID_REQUEST_DATA', 400)
    }

    return handleUpdate(request, audienceSettings, [payload], 'add', settings, statsContext)
  },
  performBatch: async (request, { payload, audienceSettings, statsContext, settings }) => {
    statsContext?.statsClient?.incr('addToAudience.batch', 1, statsContext?.tags)

    if (!audienceSettings) {
      throw new IntegrationError('Bad Request: no audienceSettings found.', 'INVALID_REQUEST_DATA', 400)
    }

    return handleUpdate(request, audienceSettings, payload, 'add', settings, statsContext)
  }
}

export default action
