/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RequestClient } from '@segment/actions-core'
import { BaseBody, EventSchemaBody } from './avo-types'

import { AvoSchemaParser } from './AvoSchemaParser'
import { EventSpecFetcher } from './EventFetcher'
import type { EventSpec } from './EventFetcherTypes'

import { Payload } from './generated-types'

function getAppNameFromUrl(url: string) {
  return url.split('/')[2]
}

function generateBaseBody(event: Payload, appVersionPropertyName: string | undefined): BaseBody {
  const appName = event.appName ?? (event.pageUrl ? getAppNameFromUrl(event.pageUrl) : 'unnamed Segment app')

  let appVersion: string
  if (appVersionPropertyName !== undefined && appVersionPropertyName in event.properties) {
    // Using bracket notation for dynamic property name access with type assertion
    appVersion = event.properties[appVersionPropertyName] as string
  } else {
    appVersion = event.appVersion ?? 'unversioned'
  }

  return {
    appName: appName,
    appVersion: appVersion,
    libVersion: '1.0.0',
    libPlatform: 'Segment',
    messageId: event.messageId,
    createdAt: event.createdAt,
    sessionId: '_'
  }
}

function handleEvent(baseBody: BaseBody, event: Payload): EventSchemaBody {
  // Initially declare eventBody with the type EventSchemaBody
  // and explicitly set all properties to satisfy the type requirements.
  const eventBody: EventSchemaBody = {
    ...baseBody, // Spread operator to copy properties from baseBody
    type: 'event', // Explicitly set type as 'event'
    eventName: event.event, // Set from the event parameter
    eventProperties: AvoSchemaParser.extractSchema(event.properties),
    eventId: null, // Set default or actual value
    eventHash: null // Set default or actual value
  }

  return eventBody
}

/**
 * Fetches the event spec if spec fetching is enabled (schemaId/sourceId provided).
 * Returns a Promise that resolves to an object with the event spec (or null) and debug info.
 *
 * Note: Spec fetching happens regardless of encryption key presence.
 * The encryption key only controls whether property values are sent (Phase 2).
 * If spec fetch fails (invalid status code), validation is skipped for that event.
 */
async function fetchEventSpec(
  eventName: string,
  apiKey: string,
  streamId: string | undefined,
  env: string,
  request: RequestClient
): Promise<EventSpec | null> {
  if (!apiKey) {
    console.warn(`[Avo Inspector] apiKey is missing, cannot fetch event spec`)
    return null
  }

  if (!streamId) {
    console.warn(`[Avo Inspector] streamId is missing, cannot fetch event spec`)
    return null
  }

  try {
    const fetchParams = {
      apiKey: apiKey,
      streamId: streamId,
      eventName: eventName
    }

    // fetch from API (async)
    const result = await new EventSpecFetcher(request, true, env).fetch(fetchParams).catch((error: any) => {
      console.error(`[Avo Inspector] Failed to fetch event spec for ${eventName}:`, error)
      return null
    })

    return result
  } catch (error) {
    // Graceful degradation - log but don't fail
    console.error(`[Avo Inspector] Error in fetchEventSpecIfNeeded for ${eventName}:`, error)

    return null
  }
}

export async function extractSchemaFromEvent(
  event: Payload,
  appVersionPropertyName: string | undefined,
  apiKey: string,
  env: string,
  request: RequestClient
) {
  const baseBody: BaseBody = generateBaseBody(event, appVersionPropertyName)

  const eventSpec = await fetchEventSpec(event.event, apiKey, event.anonymousId, env, request)

  const eventSpecString = eventSpec ? JSON.stringify(eventSpec) : null
  console.log(`[Avo Inspector] Final eventSpec:`, eventSpecString ? `set (${eventSpecString.length} chars)` : `null`)

  const eventBody: EventSchemaBody = {
    ...handleEvent(baseBody, event)
  }

  return eventBody
}
