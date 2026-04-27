import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { customFields } from '../shared/fields'
import { send, getCustomEventData } from '../shared/functions'
import { EventType } from '../shared/constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Event',
  description: 'Send a custom event',
  fields: customFields,
  perform: (request, { payload, settings, features, statsContext }) => {
      return send(request, payload, settings, getCustomEventData, EventType.Custom, features, statsContext)    
  }
}

export default action
