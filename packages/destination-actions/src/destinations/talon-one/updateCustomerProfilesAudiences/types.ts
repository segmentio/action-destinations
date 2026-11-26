import type { Payload } from './generated-types'

export type Entry = Payload['data'][number]

export type IndexedPayload = {
  index: number
  data: Entry[]
}

export type Chunk = {
  data: Entry[]
  indexes: number[]
}

export type UpdateAudiencesJSON = {
  data: Entry[]
}

export type TalonOneErrorResponse = {
  StatusCode?: number
  Error?: string
  RequestUUID?: string
}

export type RequestError = {
  message?: string
  response?: {
    status?: number
    data?: TalonOneErrorResponse
  }
}
