import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { extractSchemaFromEvent, fetchEventSpec, EventSpecResponse } from './avo'

/**
 * Fetches event specs for all unique event names in the batch.
 *
 * Implements within-batch caching: each unique event name is fetched exactly once,
 * even if multiple events in the batch share the same event name. This prevents
 * duplicate API calls for the same event spec within a single batch.
 *
 * The cache stores both successful responses (EventSpecResponse) and failed responses (null),
 * so failed fetches are also deduplicated and won't be retried for the same event name.
 *
 * @param request - RequestClient for making HTTP requests
 * @param settings - Destination settings including apiKey and env
 * @param payload - Array of events in the batch (all share the same anonymousId/streamId)
 * @param streamId - The anonymousId used as stream identifier (same for all events in batch)
 * @returns Map of event name -> event spec (or null if fetch failed)
 */
async function fetchEventSpecsForBatch(
  request: RequestClient,
  settings: Settings,
  payload: Payload[],
  streamId: string
): Promise<Map<string, EventSpecResponse | null>> {
  const eventSpecMap = new Map<string, EventSpecResponse | null>()

  // Extract unique event names to avoid duplicate fetches within the batch
  // Example: if batch has [EventA, EventB, EventA, EventC], we only fetch specs for [EventA, EventB, EventC]
  const uniqueEventNames = [...new Set(payload.map((p) => p.event))]

  // Fetch event specs for each unique event name in parallel
  // Each event name is fetched exactly once, regardless of how many times it appears in the batch
  const fetchPromises = uniqueEventNames.map(async (eventName) => {
    try {
      const spec = await fetchEventSpec(request, settings.env, {
        apiKey: settings.apiKey,
        streamId: streamId,
        eventName: eventName
      })
      return { eventName, spec }
    } catch {
      // Graceful degradation - continue without spec for this event
      // Cache null to prevent retrying failed fetches for the same event name
      return { eventName, spec: null }
    }
  })

  const results = await Promise.all(fetchPromises)

  // Build the cache map: event name -> event spec (or null for failed fetches)
  // This map is used to look up specs for all events in the batch
  for (const { eventName, spec } of results) {
    eventSpecMap.set(eventName, spec)
  }

  return eventSpecMap
}

const processEvents = async (request: RequestClient, settings: Settings, payload: Payload[]) => {
  if (!payload || payload.length === 0) {
    throw new PayloadValidationError('No events to process')
  }

  // Events are batched by anonymousId, so all events in a batch have the same anonymousId
  // anonymousId is a required field, so it will always be present
  const streamId = payload[0].anonymousId as string

  // Fetch event specs once per unique event name in the batch (no caching, rely on batching)
  const eventSpecMap = await fetchEventSpecsForBatch(request, settings, payload, streamId)

  // Process each event with its pre-fetched event spec
  const events = payload.map((value) => {
    const eventSpec = eventSpecMap.get(value.event) ?? null
    return extractSchemaFromEvent(
      value,
      settings.appVersionPropertyName,
      settings.inspectorEncryptionKey,
      settings.env,
      eventSpec
    )
  })

  if (!events || events.length === 0) {
    throw new PayloadValidationError('No events generated from payload')
  }

  const endpoint = 'https://api.avo.app/inspector/segment/v1/track'

  return request(endpoint, {
    method: 'post',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': settings.apiKey,
      env: settings.env,
      streamId: streamId
    },
    body: JSON.stringify(events)
  })
}

const sendSchemaAction: ActionDefinition<Settings, Payload> = {
  title: 'Track Schema From Event',
  description: 'Sends event schema to the Avo Inspector API',
  defaultSubscription: 'type = "track"',
  fields: {
    // Define any fields your action expects here
    event: {
      label: 'Event Name',
      type: 'string',
      description: 'Name of the event being sent',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      label: 'Properties',
      type: 'object',
      description: 'Properties of the event being sent',
      required: true,
      default: {
        '@path': '$.properties'
      }
    },
    messageId: {
      label: 'Message ID',
      type: 'string',
      description: 'Message ID of the event being sent',
      required: true,
      default: {
        '@path': '$.messageId'
      }
    },
    createdAt: {
      label: 'Created At',
      type: 'string',
      description: 'Timestamp of when the event was sent',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    appVersion: {
      label: 'App Version',
      type: 'string',
      description: 'Version of the app that sent the event',
      required: false,
      default: {
        '@path': '$.context.app.version'
      }
    },
    appName: {
      label: 'App Name',
      type: 'string',
      description: 'Name of the app that sent the event',
      required: false,
      default: {
        '@path': '$.context.app.name'
      }
    },
    pageUrl: {
      label: 'Page URL',
      type: 'string',
      description: 'URL of the page that sent the event',
      required: false,
      default: {
        '@path': '$.context.page.url'
      }
    },
    anonymousId: {
      label: 'Anonymous ID',
      type: 'string',
      description: 'Anonymous ID of the user. Used as stream identifier for batching and event spec fetching.',
      required: true,
      default: {
        '@path': '$.anonymousId'
      }
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      required: false,
      default: 10,
      readOnly: true,
      unsafe_hidden: true
    },
    batch_keys: {
      label: 'Batch Keys',
      description: 'The keys to use for batching events together.',
      type: 'string',
      required: false,
      multiple: true,
      unsafe_hidden: true,
      default: ['anonymousId']
    }
  },
  perform: async (request, { payload, settings }) => {
    return processEvents(request, settings, [payload])
  },
  performBatch: async (request, { payload, settings }) => {
    return processEvents(request, settings, payload)
  }
}
export default sendSchemaAction
