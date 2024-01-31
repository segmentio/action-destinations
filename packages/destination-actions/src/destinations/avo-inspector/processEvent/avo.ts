/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseBody, EventSchemaBody } from './avo-types'

import { AvoSchemaParser } from './AvoSchemaParser'

import { Payload } from './generated-types'

function getAppNameFromUrl(url: string) {
  return url.split('/')[2]
}

function generateBaseBody(event: Payload): BaseBody {
  const device = event.context.device as Record<string, string> | null
  const app = event.context.app as Record<string, string> | null
  const page = event.context.page as Record<string, string> | null

  const appName = app?.['name'] ?? (page?.['url'] ? getAppNameFromUrl(page['url']) : 'unnamed Segment app')
  const appVersion = app?.['version'] ?? 'unversioned Segment app'
  const trackingId = device?.['advertisingId'] ?? '_'
  return {
    appName: appName,
    appVersion: appVersion,
    libVersion: '1.0.0',
    libPlatform: 'Segment',
    messageId: event.messageId,
    trackingId,
    createdAt: event.receivedAt,
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

export function extractSchemaFromEvent(event: Payload) {
  if (event.context == null) {
    return
  }

  const baseBody: BaseBody = generateBaseBody(event)

  const eventBody: EventSchemaBody = handleEvent(baseBody, event)

  return eventBody
}
