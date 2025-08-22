import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { HubSpotBehavioralEventRequest, HubSpotBehavioralEventResponse, HubSpotBatchEventRequest, HubSpotBatchEventResponse } from '../types'
import {
  eventName,
  email,
  occurredAt,
  properties,
  objectId,
  objectType
} from './fields'

/**
 * Perform function for HubSpot Send Track Event Action
 */
const perform = async (request: RequestClient, { settings, payload }: { settings: Settings; payload: Payload }) => {
  // Extract values from payload
  const {
    eventName: name,
    email: userEmail,
    occurredAt: timestamp,
    properties: eventProperties,
    objectId: hubspotObjectId,
    objectType: hubspotObjectType
  } = payload

  // Validate required fields
  if (!name) {
    throw new Error('Event name is required')
  }

  if (!userEmail) {
    throw new Error('User email is required')
  }

  if (!timestamp) {
    throw new Error('Event timestamp is required')
  }

  // Convert timestamp to Unix milliseconds
  const occurredAtMs = new Date(timestamp).getTime()

  // Prepare HubSpot event properties - convert all values to strings as HubSpot requires
  const hubspotProperties: { [key: string]: string } = {}
  if (eventProperties && typeof eventProperties === 'object') {
    Object.entries(eventProperties).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        hubspotProperties[key] = String(value)
      }
    })
  }

  // Build the request payload for HubSpot API
  const requestPayload: HubSpotBehavioralEventRequest = {
    eventName: name,
    email: userEmail,
    occurredAt: occurredAtMs,
    properties: Object.keys(hubspotProperties).length > 0 ? hubspotProperties : undefined,
    objectId: hubspotObjectId,
    objectType: hubspotObjectType
  }

  // Send request to HubSpot Custom Behavioral Events API
  const response = await request<HubSpotBehavioralEventResponse>('https://api.hubapi.com/events/v3/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.api_key}`
    },
    json: requestPayload
  })

  // Handle response
  if (response.data.errors && response.data.errors.length > 0) {
    const errorMessage = response.data.errors.map(err => err.message).join(', ')
    throw new Error(`HubSpot API error: ${errorMessage}`)
  }

  return response.data
}

/**
 * Batch perform function for processing multiple events
 */
const performBatch = async (request: RequestClient, { settings, payload }: { settings: Settings; payload: Payload[] }) => {
  // Process each payload and collect the request payloads
  const batchPayloads: HubSpotBehavioralEventRequest[] = []
  
  for (const singlePayload of payload) {
    const {
      eventName: name,
      email: userEmail,
      occurredAt: timestamp,
      properties: eventProperties,
      objectId: hubspotObjectId,
      objectType: hubspotObjectType
    } = singlePayload

    // Validate required fields for each payload
    if (!name || !userEmail || !timestamp) {
      throw new Error(`Event name, email, and timestamp are required for all events`)
    }

    // Convert timestamp to Unix milliseconds
    const occurredAtMs = new Date(timestamp).getTime()

    // Prepare HubSpot event properties
    const hubspotProperties: { [key: string]: string } = {}
    if (eventProperties && typeof eventProperties === 'object') {
      Object.entries(eventProperties).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          hubspotProperties[key] = String(value)
        }
      })
    }

    // Build request payload
    const requestPayload: HubSpotBehavioralEventRequest = {
      eventName: name,
      email: userEmail,
      occurredAt: occurredAtMs,
      properties: Object.keys(hubspotProperties).length > 0 ? hubspotProperties : undefined,
      objectId: hubspotObjectId,
      objectType: hubspotObjectType
    }

    batchPayloads.push(requestPayload)
  }

  // Send batch request to HubSpot API
  const batchRequest: HubSpotBatchEventRequest = {
    inputs: batchPayloads
  }

  const response = await request<HubSpotBatchEventResponse>('https://api.hubapi.com/events/v3/send/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.api_key}`
    },
    json: batchRequest
  })

  // Handle batch response
  if (response.data.errors && response.data.errors.length > 0) {
    const errorMessage = response.data.errors.map(err => err.message).join(', ')
    throw new Error(`HubSpot batch API error: ${errorMessage}`)
  }

  return response.data
}

/**
 * Complete Action Definition for HubSpot Send Track Event
 */
const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Track Event',
  description: 'Send Segment track() events to HubSpot as custom behavioral events for contact engagement tracking',
  defaultSubscription: 'type = "track"',
  fields: {
    eventName,
    email,
    occurredAt,
    properties,
    objectId,
    objectType
  },
  perform,
  performBatch
}

export default action