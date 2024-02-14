import type { ActionDefinition } from '@segment/actions-core'
import { EventType, MolocoEvent } from '../common/event'
import { MolocoAPIClient } from '../common/request-client'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const event = new MolocoEvent(EventType.Land, {
  requireItems: false,
  requireSearchQuery: false,
  requirePageId: true,
  requireReferrerPageId: true
})

const action: ActionDefinition<Settings, Payload> = {
  title: 'Land',
  description: 'Represents a user visiting the client’s website from an external source (ex. Google Shopping)',
  fields: event.getFields(),
  perform: (request, data) => {
    const client = new MolocoAPIClient(request, data.settings)
    const body = event.buildBody(data.payload)
    return client.sendEvent(body)
  }
}

export default action
