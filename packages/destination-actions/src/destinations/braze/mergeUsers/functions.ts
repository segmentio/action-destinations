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
          errormessage: (error as PayloadValidationError).message,
          sent: payload as unknown as JSONLikeObject
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
        sent: payloads[originalIndex] as unknown as JSONLikeObject,
        body: { merge_updates: [validItems[i]] } as unknown as JSONLikeObject
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
          errormessage: error.message,
          sent: payloads[originalIndex] as unknown as JSONLikeObject,
          body: { merge_updates: [validItems[i]] } as unknown as JSONLikeObject
        })
      }
    } else {
      throw error
    }
  }

  return multiStatusResponse
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

  const previousIdPri = toPrioritization(previousIdPrioritization)
  const keepIdPri = toPrioritization(keepIdPrioritization)

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

function toPrioritization(value: string | undefined | null): Prioritization | undefined {
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
