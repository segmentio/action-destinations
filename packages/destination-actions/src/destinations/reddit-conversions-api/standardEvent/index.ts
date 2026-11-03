import type { Payload } from './generated-types'
import { standardEventAction } from '../action'

export default standardEventAction<Payload>(
  undefined,
  'Send Standard Event',
  'Send a Standard Conversion Event to Reddit'
)
