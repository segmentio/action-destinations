import { ExecuteInput } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload as sftpPayload } from './syncToSFTP/generated-types'

export interface Data {
  rawMapping: RawMapping
}

export interface RawMapping {
  columns: {
    [k: string]: unknown
  }
}

export interface ColumnHeader {
  cleanName: string
  originalName: string
}

// Type definitions for SFTP operations
export type RawData = {
  context?: {
    personas?: {
      computation_key?: string
      computation_class?: string
      computation_id?: string
    }
  }
}

export type ProcessDataInput<T extends sftpPayload> = {
  payloads: T[]
  features?: Record<string, boolean>
  rawData?: RawData[]
  settings: Settings
}

export type ExecuteInputRaw<Settings, Payload, RawData, AudienceSettings = unknown> = ExecuteInput<
  Settings,
  Payload,
  AudienceSettings
> & { rawData?: RawData }
