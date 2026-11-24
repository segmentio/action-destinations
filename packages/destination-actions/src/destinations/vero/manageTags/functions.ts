import { PayloadValidationError } from '@segment/actions-core'
import type { AudienceMembership } from '@segment/actions-core'
import { cleanStringList, requireId, trim } from '../functions'
import type { Payload } from './generated-types'
import type { ManageTagsJSON } from './types'

export function buildJSON(payload: Payload, audienceMembership: AudienceMembership): ManageTagsJSON {
  const { userId, tagsToAdd, tagsToRemove, audienceKey } = payload

  const id = requireId(userId)
  const key = trim(audienceKey)

  if (key && typeof audienceMembership !== 'boolean') {
    throw new PayloadValidationError('Audience membership could not be determined for this event.')
  }

  if (!key && typeof audienceMembership === 'boolean') {
    throw new PayloadValidationError('Audience Key is required when syncing audience membership.')
  }

  const add = cleanStringList([...(tagsToAdd ?? []), ...(key && audienceMembership ? [key] : [])])
  const remove = cleanStringList([...(tagsToRemove ?? []), ...(key && audienceMembership === false ? [key] : [])])

  const overlap = add.find((tag) => remove.includes(tag))
  if (overlap) {
    throw new PayloadValidationError(`Tag "${overlap}" cannot be both added and removed.`)
  }
  if (add.length === 0 && remove.length === 0) {
    throw new PayloadValidationError('At least one tag to add or remove is required.')
  }

  return {
    id,
    ...(add.length > 0 ? { add } : {}),
    ...(remove.length > 0 ? { remove } : {})
  }
}
