import type { Payload } from './generated-types'
import { customEventAction } from '../action'

export default customEventAction<Payload>('Send Custom Event', 'Send a Custom Conversion Event to Reddit')
