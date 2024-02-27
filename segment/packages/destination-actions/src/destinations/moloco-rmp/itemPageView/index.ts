import type { ActionDefinition } from '@segment/actions-core'
import { EventType, MolocoEvent } from '../common/event'
import { MolocoAPIClient } from '../common/request-client'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const event = new MolocoEvent(EventType.ItemPageView, {
  requireItems: true,
  requirePageIdentification: false,
  requireReferrerPageId: false,
  requireShippingCharge: false,
})

const action: ActionDefinition<Settings, Payload> = {
  title: 'Item Page View',
  description: 'Represents a user viewing an item page',
  fields: event.getFields(),
  perform: (request, data) => {
    const client = new MolocoAPIClient(request, data.settings)
    const body = event.buildBody(data.payload)
    return client.sendEvent(body)
  }
}

export default action
