import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { searchFields } from '../shared/fields'
import { send, getSearchEventData } from '../shared/functions'
import { EventType } from '../shared/constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Search',
  description: 'Send event when a user searches content or products',
  defaultSubscription: 'type = "track" and event = "Products Searched"',
  fields: searchFields,
  perform: (request, { payload, settings, features, statsContext }) => {
    return send(request, payload, settings, getSearchEventData, EventType.Search, features, statsContext)
  }
}

export default action