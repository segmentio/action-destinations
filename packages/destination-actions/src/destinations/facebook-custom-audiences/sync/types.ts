import { SCHEMA_PROPERTIES } from './constants'
import { Payload } from './generated-types'
import { ExecuteInput } from '@segment/actions-core'

export type RawData = {
  context?: {
    personas?: {
      computation_class?: string
    }
  }
  properties?: Record<string, unknown>
}

export type ExecuteInputRaw<Settings, Payload, RawData, AudienceSettings = unknown, AudienceMembershipType = unknown> = ExecuteInput<
  Settings,
  Payload,
  AudienceSettings,
  unknown,
  unknown,
  AudienceMembershipType
> & { rawData?: RawData }

export type PayloadMap = Map<number, Payload> 

export interface GetAllAudienceResponse {
  data: {
    id: string
    name: string
  }[]
}

export interface AudienceJSON {
  payload: {
    schema: typeof SCHEMA_PROPERTIES
    data: FacebookDataRow[]
    app_ids?: string[]
    page_ids?: string[]
    ig_account_ids?: string[]
  }
}

export type FacebookDataRow = [
  EXTERN_ID: string,
  EMAIL: string,
  PHONE: string,
  DOBY: string,
  DOBM: string,
  DOBD: string,
  LN: string,
  FN: string,
  FI: string,
  GEN: string,
  CT: string,
  ST: string,
  ZIP: string,
  COUNTRY: string,
  MADID: string
]