import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { OptimizelyWebClient } from './client'
import { OptimizelyPayload, Event } from './types'
import { validate } from './utils'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send a Segment track or page event to Optimizely',
  defaultSubscription: 'type = "track" or type = "page"',
  fields,
  perform: async (request, { payload, settings, stateContext }) => {
    
    const { unixTimestamp13, opt_event_properties, value, revenue, quantity, currency, restTags } = validate(payload, stateContext)

    const {
      endUserId,
      projectID,
      uuid,
      eventMatching: { eventId },
      eventType
    } = payload

    const client = new OptimizelyWebClient(request, settings, projectID, stateContext ?? undefined)

    const entity_id = eventId ?? await client.getEventid(payload)

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
                  entity_id,
                  key: event_name,
                  timestamp: unixTimestamp13,
                  uuid,
                  type: eventType === 'page' ? 'view_activated' : 'other',
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
