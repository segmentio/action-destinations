/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EventSpecMetadata } from './eventSpec/EventFetcherTypes'

export enum Environment {
  DEV = 'dev',
  STAGING = 'staging',
  PROD = 'prod'
}

export interface EventProperty {
  propertyName: string
  propertyType: string
  children?: any
  encryptedPropertyValue?: string
  failedEventIds?: string[]
  passedEventIds?: string[]
}

export interface BaseBody {
  appName: string
  appVersion: string
  libVersion: string
  libPlatform: string
  messageId: string
  createdAt: string
  sessionId: string
  publicEncryptionKey?: string
}

export interface EventSchemaBody extends BaseBody {
  type: 'event'
  eventName: string
  eventProperties: Array<EventProperty>
  eventId: string | null
  eventHash: string | null
  metadata?: EventSpecMetadata
}
