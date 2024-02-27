/* eslint-disable @typescript-eslint/no-explicit-any */

export enum Environment {
  DEV = 'dev',
  STAGING = 'staging',
  PROD = 'prod'
}

export interface EventProperty {
  propertyName: string
  propertyType: string
  children?: any
}

export interface BaseBody {
  appName: string
  appVersion: string
  libVersion: string
  libPlatform: string
  messageId: string
  createdAt: string
  sessionId: string
}

export interface EventSchemaBody extends BaseBody {
  type: 'event'
  eventName: string
  eventProperties: Array<EventProperty>
  eventId: string | null
  eventHash: string | null
}
