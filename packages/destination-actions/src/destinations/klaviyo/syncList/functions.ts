import {
  AudienceMembership,
  ErrorCodes,
  MultiStatusResponse,
  PayloadValidationError,
  RequestClient,
  StatsContext
} from '@segment/actions-core'
import type { Payload } from './generated-types'
import type { Payload as AddProfileToListPayload } from '../addProfileToList/generated-types'
import type { Payload as RemoveProfilePayload } from '../removeProfile/generated-types'
import {
  addProfileToList,
  createProfile,
  getProfiles,
  processPhoneNumber,
  removeBulkProfilesFromList,
  removeProfileFromList,
  sendBatchedProfileImportJobRequest,
  validateEmail,
  validateExternalId
} from '../functions'

export const NO_LIST_ID_ERROR =
  'No list ID found in payload. When connecting this action to a reverse ETL (database) Source, Segment cannot infer a list automatically - you must select an existing Klaviyo list or provide a name for a new one in the "Connect to a static list in Klaviyo" step when saving the mapping.'

export async function syncList(
  request: RequestClient,
  payload: Payload,
  audienceMembership: AudienceMembership,
  hookOutputs?: { id?: string; name?: string }
) {
  const list_id = hookOutputs?.id ?? payload.list_id
  if (!list_id) {
    throw new PayloadValidationError(NO_LIST_ID_ERROR)
  }

  if (audienceMembership === true) {
    const {
      email,
      phone_number: initialPhoneNumber,
      list_id: _listId,
      external_id,
      enable_batching,
      batch_size,
      country_code,
      batch_keys,
      ...additionalAttributes
    } = payload
    const phone_number = processPhoneNumber(initialPhoneNumber, country_code)

    if (!email && !external_id && !phone_number) {
      throw new PayloadValidationError('One of External ID, Phone Number or Email is required.')
    }
    if (email && !validateEmail(email)) {
      throw new PayloadValidationError('Email must be a valid email address.')
    }

    const profileId = await createProfile(request, email, external_id, phone_number, additionalAttributes)
    return await addProfileToList(request, profileId, list_id)
  }

  if (audienceMembership === false) {
    const { email, external_id, phone_number: initialPhoneNumber, country_code } = payload
    const phone_number = processPhoneNumber(initialPhoneNumber, country_code)

    if (!email && !external_id && !phone_number) {
      throw new PayloadValidationError('One of External ID, Phone Number or Email is required.')
    }
    validateExternalId(external_id)

    const profileIds = await getProfiles(
      request,
      email ? [email] : undefined,
      external_id ? [external_id] : undefined,
      phone_number ? [phone_number] : undefined
    )
    if (!profileIds?.length) {
      throw new PayloadValidationError('No profiles found for the provided identifiers.')
    }
    return await removeProfileFromList(request, profileIds, list_id)
  }

  throw new PayloadValidationError('Audience Membership must be a boolean')
}

export async function syncListBatch(
  request: RequestClient,
  payloads: Payload[],
  audienceMembership: AudienceMembership[],
  statsContext?: StatsContext,
  hookOutputs?: { id?: string; name?: string }
): Promise<MultiStatusResponse> {
  const multiStatusResponse = new MultiStatusResponse()
  const addIndices: number[] = []
  const addPayloads: Payload[] = []
  const removeIndices: number[] = []
  const removePayloads: Payload[] = []

  payloads.forEach((payload, index) => {
    const membership = audienceMembership[index]

    if (typeof membership !== 'boolean') {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
        errormessage: 'Audience Membership must be a boolean'
      })
      return
    }

    const effectivePayload = hookOutputs?.id ? { ...payload, list_id: hookOutputs.id } : payload

    if (!effectivePayload.list_id) {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
        errormessage: NO_LIST_ID_ERROR
      })
      return
    }

    if (membership) {
      addIndices.push(index)
      addPayloads.push(effectivePayload)
    } else {
      removeIndices.push(index)
      removePayloads.push(effectivePayload)
    }
  })

  const [addResult, removeResult] = await Promise.all([
    addPayloads.length > 0
      ? sendBatchedProfileImportJobRequest(
          request,
          addPayloads as unknown as AddProfileToListPayload[],
          statsContext
        )
      : undefined,
    removePayloads.length > 0
      ? removeBulkProfilesFromList(request, removePayloads as unknown as RemoveProfilePayload[], statsContext)
      : undefined
  ])

  if (addResult) {
    addIndices.forEach((originalIndex, i) => {
      multiStatusResponse.pushResponseObjectAtIndex(originalIndex, addResult.getResponseAtIndex(i))
    })
  }

  if (removeResult) {
    removeIndices.forEach((originalIndex, i) => {
      multiStatusResponse.pushResponseObjectAtIndex(originalIndex, removeResult.getResponseAtIndex(i))
    })
  }

  return multiStatusResponse
}
