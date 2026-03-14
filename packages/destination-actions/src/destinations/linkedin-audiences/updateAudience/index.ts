import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { processPayload } from './functions'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To LinkedIn DMP Segment',
  description: 'Syncs contacts from a Personas Audience to a LinkedIn DMP Segment.',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields,
  perform: async (request, { settings, payload, statsContext, audienceMembership, features, stateContext }) => {
    return processPayload(request, settings, [payload], statsContext, [audienceMembership], features, stateContext)
  },
  performBatch: async (request, { settings, payload, statsContext, audienceMembership, features, stateContext }) => {
    return processPayload(request, settings, payload, statsContext, audienceMembership, features, stateContext)
  }
}

export default action
