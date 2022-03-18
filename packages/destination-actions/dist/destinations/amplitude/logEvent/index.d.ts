import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
export interface AmplitudeEvent extends Omit<Payload, 'products' | 'trackRevenuePerProduct' | 'time' | 'session_id'> {
  library?: string
  time?: number
  session_id?: number
  options?: {
    min_id_length: number
  }
}
declare const action: ActionDefinition<Settings, Payload>
export default action
