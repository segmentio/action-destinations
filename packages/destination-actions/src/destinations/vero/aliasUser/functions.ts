import { PayloadValidationError } from '@segment/actions-core'
import { requireId } from '../functions'
import type { Payload } from './generated-types'
import type { AliasJSON } from './types'

export function buildJSON(payload: Payload): AliasJSON {
  const { previousId, newId } = payload

  const id = requireId(previousId, 'Previous ID')
  const new_id = requireId(newId, 'New ID')
  if (id === new_id) {
    throw new PayloadValidationError('New ID must be different from Previous ID.')
  }
  return { id, new_id }
}
