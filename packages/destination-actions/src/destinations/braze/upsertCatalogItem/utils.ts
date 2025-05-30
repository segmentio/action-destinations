import { RequestClient } from '@segment/actions-core/create-request-client'
import { ListCatalogsResponse, UpsertCatalogItemErrorResponse } from './types'
import { MultiStatusResponse } from '@segment/actions-core/destination-kit/action'
import { JSONLikeObject } from '@segment/actions-core/json-object'
import { Payload } from './generated-types'

export async function getCatalogMetas(request: RequestClient, endpoint: string) {
  const response = await request<ListCatalogsResponse>(`${endpoint}/catalogs`, {
    method: 'get'
  })

  return response?.data?.catalogs
}

export function isValidItemId(item_id: string) {
  return /^[a-zA-Z0-9_-]+$/.test(item_id)
}

export function processMultiStatusErrorResponse(
  response: UpsertCatalogItemErrorResponse,
  multiStatusResponse: MultiStatusResponse,
  validPayloadMap: Map<string, number>,
  payload: Payload[]
): void {
  const { errors = [] } = response

  errors?.forEach((error) => {
    const isObject = Array.isArray(error?.parameters) && error.parameters.length > 1
    error.parameter_values?.forEach((parameter_value) => {
      const itemId = isObject ? ((parameter_value as JSONLikeObject)?.['id'] as string) : (parameter_value as string)

      if (validPayloadMap.has(itemId)) {
        const index = validPayloadMap.get(itemId) as number
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: error.message || 'Unknown error',
          sent: { ...payload[index]?.item, id: itemId } as JSONLikeObject,
          body: error
        })
        validPayloadMap.delete(itemId)
      }
    })
  })
  if (validPayloadMap.size > 0) {
    // If there are still valid payloads left, we set them as internal server error so that the event can be retried later
    validPayloadMap.forEach((index, itemId) => {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 500,
        errortype: 'INTERNAL_SERVER_ERROR',
        errormessage: `Item with ID ${itemId} could not be processed due to invalid catalog items in the batch request.`,
        sent: { ...payload[index]?.item, id: itemId } as JSONLikeObject,
        body: JSON.stringify(errors)
      })
    })
  }
}
