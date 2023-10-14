import type { ActionDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { handleUpdate } from './shared'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Add to Audience',
  description: 'Add a user to a Display & Video 360 audience.',
  fields: {
    userIdentifier: {
      label: 'User Identifier',
      description: 'The identifier for the user to add to the audience.',
      type: 'string',
      required: true,
      default: 'publisherProvidedId' // TODO: Implement the rest of ids with a mu
    }
  },
  performBatch: async (request, { payload, audienceSettings, statsContext }) => {
    statsContext?.statsClient?.incr('addToAudience', 1, statsContext?.tags)

    if (!audienceSettings) {
      throw new IntegrationError('Bad Request: no audienceSettings found.', 'INVALID_REQUEST_DATA', 400)
    }

    return handleUpdate(request, audienceSettings, payload, 'add')
  }
}

export default action
