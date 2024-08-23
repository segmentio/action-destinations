import type { ActionDefinition, StateContext } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { OptimizelyWebClient } from './client'
import { OptimizelyPayload, Event } from './types'
import { payloadItems } from './utils'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send an analytics event to Optimizely',
  defaultSubscription: 'type = "track" or type = "page"',
  fields,
  perform: async (request, { payload, settings, stateContext }) => {
    const { endUserId, category, projectID, uuid, createEventIfNotFound, eventName: friendlyEventName } = payload

    const { unixTimestamp13, opt_event_properties, event_name, value, revenue, quantity, currency, restTags } =
      payloadItems(payload, stateContext)

    const client = new OptimizelyWebClient(request, projectID, stateContext as StateContext)

    const eventId = await client.getEventid(event_name, category, friendlyEventName, createEventIfNotFound)

    const body: OptimizelyPayload = {
      account_id: settings.optimizelyAccountId,
      anonymize_ip: payload.anonymizeIP,
      client_name: 'Segment Optimizely Web Destination',
      client_version: '1.0.0',
      enrich_decisions: true,
      visitors: [
        {
          visitor_id: endUserId,
          attributes: [],
          snapshots: [
            {
              decisions: [],
              events: [
                {
                  entity_id: eventId,
                  key: event_name ?? 'page_viewed',
                  timestamp: unixTimestamp13,
                  uuid,
                  tags: {
                    revenue: revenue ? revenue * 100 : undefined,
                    value,
                    quantity,
                    currency,
                    $opt_event_properties: opt_event_properties as Event['tags']['$opt_event_properties'],
                    ...restTags
                  }
                }
              ]
            }
          ]
        }
      ]
    }
    return await client.sendEvent(body)
  }
}

export default action
