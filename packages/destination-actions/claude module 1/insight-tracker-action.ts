import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { InsightTrackerEventRequest, InsightTrackerEventResponse } from './insight-tracker-types'
import {
  eventType,
  eventName,
  pageInfo,
  userIdentity,
  userTraits,
  eventProperties,
  deviceInfo,
  locationInfo,
  messageId,
  timestamp,
  sessionId
} from './insight-tracker-fields'

/**
 * Perform function for InsightTracker Send Event Action
 */
const perform = async (request: RequestClient, { settings, payload }: { settings: Settings; payload: Payload }) => {
  // Extract values from payload
  const {
    eventType: type,
    eventName: name,
    pageInfo: page,
    userIdentity: user,
    userTraits: traits,
    eventProperties: properties,
    deviceInfo: device,
    locationInfo: location,
    messageId: msgId,
    timestamp: ts,
    sessionId: session
  } = payload

  // Validate required fields
  if (!user || (!user.user_id && !user.anonymous_id)) {
    throw new Error('Either user_id or anonymous_id must be provided in user identity')
  }

  if (!msgId) {
    throw new Error('Message ID is required')
  }

  if (!ts) {
    throw new Error('Timestamp is required')
  }

  // Build the request payload for InsightTracker API
  const requestPayload: InsightTrackerEventRequest = {
    event_type: type as 'track' | 'page' | 'identify',
    user: {
      user_id: user.user_id,
      anonymous_id: user.anonymous_id,
      email: user.email,
      phone: user.phone
    },
    message_id: msgId,
    timestamp: ts
  }

  // Add event-specific fields based on event type
  if (type === 'track' && name) {
    requestPayload.event_name = name
  }

  if (type === 'page' && page) {
    requestPayload.page_name = page.name
    requestPayload.page_category = page.category
  }

  // Add optional fields if present
  if (traits && Object.keys(traits).length > 0) {
    requestPayload.traits = traits
  }

  if (properties && Object.keys(properties).length > 0) {
    requestPayload.properties = properties
  }

  if (device && Object.keys(device).length > 0) {
    requestPayload.device = device
  }

  if (location && Object.keys(location).length > 0) {
    requestPayload.location = location
  }

  if (session) {
    requestPayload.session_id = session
  }

  // Send request to InsightTracker API
  const response = await request<InsightTrackerEventResponse>('https://api.insighttracker.com/v1/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.api_key}`,
      'X-Client-Version': '1.0.0'
    },
    json: requestPayload
  })

  // Handle response
  if (!response.data.success) {
    const errorMessage = response.data.errors?.join(', ') || response.data.message || 'Unknown error occurred'
    throw new Error(`InsightTracker API error: ${errorMessage}`)
  }

  return response.data
}

/**
 * Batch perform function for processing multiple events
 */
const performBatch = async (request: RequestClient, { settings, payload }: { settings: Settings; payload: Payload[] }) => {
  // Process each payload and collect the request payloads
  const batchPayloads: InsightTrackerEventRequest[] = []
  
  for (const singlePayload of payload) {
    const {
      eventType: type,
      eventName: name,
      pageInfo: page,
      userIdentity: user,
      userTraits: traits,
      eventProperties: properties,
      deviceInfo: device,
      locationInfo: location,
      messageId: msgId,
      timestamp: ts,
      sessionId: session
    } = singlePayload

    // Validate required fields for each payload
    if (!user || (!user.user_id && !user.anonymous_id)) {
      throw new Error(`Either user_id or anonymous_id must be provided for message ${msgId}`)
    }

    if (!msgId || !ts) {
      throw new Error(`Message ID and timestamp are required for all events`)
    }

    // Build request payload
    const requestPayload: InsightTrackerEventRequest = {
      event_type: type as 'track' | 'page' | 'identify',
      user: {
        user_id: user.user_id,
        anonymous_id: user.anonymous_id,
        email: user.email,
        phone: user.phone
      },
      message_id: msgId,
      timestamp: ts
    }

    // Add event-specific fields
    if (type === 'track' && name) {
      requestPayload.event_name = name
    }

    if (type === 'page' && page) {
      requestPayload.page_name = page.name
      requestPayload.page_category = page.category
    }

    // Add optional fields
    if (traits && Object.keys(traits).length > 0) {
      requestPayload.traits = traits
    }

    if (properties && Object.keys(properties).length > 0) {
      requestPayload.properties = properties
    }

    if (device && Object.keys(device).length > 0) {
      requestPayload.device = device
    }

    if (location && Object.keys(location).length > 0) {
      requestPayload.location = location
    }

    if (session) {
      requestPayload.session_id = session
    }

    batchPayloads.push(requestPayload)
  }

  // Send batch request to InsightTracker API
  const response = await request<{ success: boolean; message: string; processed: number; errors?: string[] }>('https://api.insighttracker.com/v1/events/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.api_key}`,
      'X-Client-Version': '1.0.0'
    },
    json: {
      events: batchPayloads
    }
  })

  // Handle batch response
  if (!response.data.success) {
    const errorMessage = response.data.errors?.join(', ') || response.data.message || 'Unknown batch error occurred'
    throw new Error(`InsightTracker batch API error: ${errorMessage}`)
  }

  return response.data
}

/**
 * Complete Action Definition for InsightTracker Send Event
 */
const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event',
  description: 'Send analytics events to InsightTracker platform for user behavior tracking and analysis',
  defaultSubscription: 'type = "track" or type = "page" or type = "identify"',
  fields: {
    eventType,
    eventName,
    pageInfo,
    userIdentity,
    userTraits,
    eventProperties,
    deviceInfo,
    locationInfo,
    messageId,
    timestamp,
    sessionId
  },
  perform,
  performBatch
}

export default action