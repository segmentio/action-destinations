// TypeScript interfaces for HubSpot CRM API

/**
 * HubSpot Custom Behavioral Event Request Interface
 * Based on HubSpot's Custom Behavioral Events API
 */
export interface HubSpotBehavioralEventRequest {
  /**
   * The name of the event
   */
  eventName: string
  /**
   * The email address of the user who performed the event
   */
  email: string
  /**
   * When the event occurred (Unix timestamp in milliseconds)
   */
  occurredAt: number
  /**
   * Additional properties for the event
   */
  properties?: {
    [key: string]: string | number | boolean
  }
  /**
   * Optional object ID if associating with a specific object
   */
  objectId?: string
  /**
   * The object type (e.g., "contact", "company", "deal")
   */
  objectType?: string
}

/**
 * HubSpot API Response Interface
 */
export interface HubSpotBehavioralEventResponse {
  /**
   * Success status
   */
  status: string
  /**
   * Response message
   */
  message?: string
  /**
   * Event ID assigned by HubSpot
   */
  eventId?: string
  /**
   * Any validation errors
   */
  errors?: Array<{
    message: string
    errorType: string
    context?: {
      [key: string]: any
    }
  }>
}

/**
 * HubSpot Batch Event Request
 */
export interface HubSpotBatchEventRequest {
  /**
   * Array of events to send
   */
  inputs: HubSpotBehavioralEventRequest[]
}

/**
 * HubSpot Batch Event Response
 */
export interface HubSpotBatchEventResponse {
  /**
   * Results for each event in the batch
   */
  results: Array<{
    id: string
    properties: {
      [key: string]: any
    }
    createdAt: string
    updatedAt: string
  }>
  /**
   * Any errors that occurred
   */
  errors?: Array<{
    subCategory: string
    context: {
      [key: string]: any
    }
    message: string
    category: string
  }>
}