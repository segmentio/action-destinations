import type { Settings, AudienceSettings } from './generated-types'

export interface CreateAudienceInput {
  audienceName?: string
  settings: Settings
  audienceSettings?: AudienceSettings
}

export interface GetAudienceInput {
  externalId: string
  settings: Settings
  audienceSettings?: AudienceSettings
}

export interface SegmentResponse {
  segment?: {
    id?: string
    name?: string
  }
}
