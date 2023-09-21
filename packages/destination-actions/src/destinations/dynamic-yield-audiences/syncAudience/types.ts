import { Payload } from './generated-types'

export interface Data {
  payload: Payload & {
    context?: {
      [k: string]: unknown
      personas?: {
        computation_key?: string
        computation_class?: string
      }
    }
  }
  rawData?: {
    context?: {
      personas?: {
        computation_key?: string
        computation_class?: string
      }
    }
    properties?: Record<string, boolean>
    traits?: Record<string, boolean>
  }
}
