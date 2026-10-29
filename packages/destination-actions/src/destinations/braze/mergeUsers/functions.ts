import { RequestClient, PayloadValidationError, MultiStatusResponse, JSONLikeObject, HTTPError } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload as MergeUsersPayload } from './generated-types'
import { MergeUsersItem, MergeUsersJSON, MergeIdentifierType, Prioritization } from './types'
import { UserAlias } from '../userAlias'

export async function send(request: RequestClient, settings: Settings, payloads: MergeUsersPayload[], isBatch: boolean) {
  const multiStatusResponse = new MultiStatusResponse()
  const validItems: MergeUsersItem[] = []
  const validPayloadIndicesBitmap: number[] = []

  payloads.forEach((payload, index) => {
    try {
      const item = getJsonItem(payload)
      validItems.push(item)
      validPayloadIndicesBitmap.push(index)
    } catch (error) {
      if (isBatch) {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: (error as PayloadValidationError).message
        })
      } else {
        throw error
      }
    }
  })

  if (validItems.length === 0) {
    return multiStatusResponse
  }

  const items: MergeUsersJSON = {
    merge_updates: validItems
  }

  try {
    const response = await request(`${settings.endpoint}/users/merge`, {
      method: 'post',
      ...(validItems.length > 1 ? { headers: { 'X-Braze-Batch': 'true' } } : undefined),
      json: items
    })

    for (let i = 0; i < validPayloadIndicesBitmap.length; i++) {
      const originalIndex = validPayloadIndicesBitmap[i]
      if (multiStatusResponse.isErrorResponseAtIndex(originalIndex)) {
        continue
      }
      multiStatusResponse.setSuccessResponseAtIndex(originalIndex, {
        status: response.status,
        sent: { merge_updates: [validItems[i]] } as unknown as JSONLikeObject,
        body: response.data as unknown as JSONLikeObject
      })
    }
  } catch (error) {
    if (isBatch && error instanceof HTTPError) {
      for (let i = 0; i < validPayloadIndicesBitmap.length; i++) {
        const originalIndex = validPayloadIndicesBitmap[i]
        if (multiStatusResponse.isErrorResponseAtIndex(originalIndex)) {
          continue
        }
        multiStatusResponse.setErrorResponseAtIndex(originalIndex, {
          status: error.response.status,
          errormessage: getBrazeErrorMessage(error),
          sent: { merge_updates: [validItems[i]] } as unknown as JSONLikeObject,
          body: (error.response as { data?: unknown }).data as JSONLikeObject
        })
      }
    } else {
      throw error
    }
  }

  return multiStatusResponse
}

function getBrazeErrorMessage(error: HTTPError): string {
  const data = (error.response as { data?: unknown }).data
  const message = (data as { message?: unknown } | undefined)?.message
  return typeof message === 'string' && message ? message : error.message
}

function getJsonItem(payload: MergeUsersPayload): MergeUsersItem {
  const {
    previousIdType,
    previousIdValue,
    previousAliasIdValue,
    keepIdType,
    keepIdValue,
    keepAliasIdValue,
    previousIdPrioritization,
    keepIdPrioritization
  } = payload

  const previousId = getMergeIdentifier(
    previousIdType as MergeIdentifierType,
    'merge',
    previousIdValue,
    previousAliasIdValue
  )
  const keepId = getMergeIdentifier(keepIdType as MergeIdentifierType, 'keep', keepIdValue, keepAliasIdValue)

  if (previousIdType === keepIdType && isSameIdentifier(previousIdType, previousId, keepId)) {
    throw new PayloadValidationError('The identifier to merge and the identifier to keep cannot be the same user.')
  }

  const previousIdPri = toPrioritization(previousIdPrioritization)
  const keepIdPri = toPrioritization(keepIdPrioritization)

  if (requiresPrioritization(previousIdType) && !previousIdPri) {
    throw new PayloadValidationError(
      'Rule Prioritization (ID to merge) is required when Type of Identifier to merge is email or phone.'
    )
  }
  if (requiresPrioritization(keepIdType) && !keepIdPri) {
    throw new PayloadValidationError(
      'Rule Prioritization (ID to keep) is required when Type of Identifier to keep is email or phone.'
    )
  }

  const item: MergeUsersItem = {
    identifier_to_merge: {
      [previousIdType]: previousId,
      ...(Array.isArray(previousIdPri) && (previousIdType === 'email' || previousIdType === 'phone')
        ? { prioritization: previousIdPri }
        : {})
    },
    identifier_to_keep: {
      [keepIdType]: keepId,
      ...(Array.isArray(keepIdPri) && (keepIdType === 'email' || keepIdType === 'phone')
        ? { prioritization: keepIdPri }
        : {})
    }
  }

  return item
}

function getMergeIdentifier(
  type: MergeIdentifierType,
  label: string,
  value?: string,
  aliasValue?: UserAlias
): string | UserAlias {
  if (type === 'user_alias') {
    const { alias_label, alias_name } = aliasValue || {}
    if (!alias_label || !alias_name) {
      throw new PayloadValidationError(
        `When Type of Identifier to ${label} is user_alias, alias_label and alias_name must be provided.`
      )
    }
    return { alias_label, alias_name }
  }

  if (!value) {
    throw new PayloadValidationError(`ID value to ${label} must be provided.`)
  }

  return value
}

function requiresPrioritization(type: string): boolean {
  return type === 'email' || type === 'phone'
}

function isSameIdentifier(type: string, a: string | UserAlias, b: string | UserAlias): boolean {
  if (typeof a === 'string' && typeof b === 'string') {
    return type === 'email' ? a.trim().toLowerCase() === b.trim().toLowerCase() : a === b
  }
  if (typeof a !== 'string' && typeof b !== 'string') {
    return a.alias_label === b.alias_label && a.alias_name === b.alias_name
  }
  return false
}

function toPrioritization(value: string | undefined): Prioritization | undefined {
  if (!value) return undefined
  const parts = value
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) return undefined
  return parts as Prioritization
}

export function getPrioritizationChoices() {
  return [
    { value: 'identified', label: 'Identified' },
    { value: 'unidentified', label: 'Unidentified' },
    { value: 'most_recently_updated', label: 'Most Recently Updated' },
    { value: 'least_recently_updated', label: 'Least Recently Updated' },
    { value: 'identified,most_recently_updated', label: 'Identified, Most Recently Updated' },
    { value: 'unidentified,most_recently_updated', label: 'Unidentified, Most Recently Updated' },
    { value: 'identified,least_recently_updated', label: 'Identified, Least Recently Updated' },
    { value: 'unidentified,least_recently_updated', label: 'Unidentified, Least Recently Updated' }
  ]
}

export function getSupportedIdentifierChoices() {
  return [
    { label: 'External ID', value: 'external_id' },
    { label: 'User Alias', value: 'user_alias' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' }
  ]
}
