import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

export interface personalizeAttributes {
  _id: string
  name: string
  key: string
  description: string
  project?: string
  createdBy?: string
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
  uid?: string
  createdByUserName?: string
  updatedByUserName?: string
}

export interface Data {
  settings: Settings
  payload: Payload
  rawData?: {
    traits: Record<string, unknown>
    userId: string
  }
  auth: {
    accessToken: string
  }
}
