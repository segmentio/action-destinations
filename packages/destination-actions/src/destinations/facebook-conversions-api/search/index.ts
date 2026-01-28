import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { searchFields } from '../fields'
import { send } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Search',
  description: 'Send event when a user searches content or products',
  defaultSubscription: 'type = "track" and event = "Products Searched"',
  fields: searchFields,
  perform: (request, { payload, settings, features, statsContext }) => {
    return send(request, payload, settings, features, statsContext)
  }
}

export default action
