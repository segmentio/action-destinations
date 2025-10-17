import { Payload } from './generated-types'

export interface PayloadWithIndex extends Payload {
  index: number
}