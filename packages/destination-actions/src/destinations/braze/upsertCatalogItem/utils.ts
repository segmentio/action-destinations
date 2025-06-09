import { RequestClient } from '@segment/actions-core/create-request-client'
import { ListCatalogsResponse, UpsertCatalogItemErrorResponse } from './types'
import { ActionHookResponse, MultiStatusResponse } from '@segment/actions-core/destination-kit/action'
import { JSONLikeObject } from '@segment/actions-core/json-object'
import { OnMappingSaveInputs, Payload } from './generated-types'
import { DynamicFieldItem, DynamicFieldResponse } from '@segment/actions-core/index'
import { FieldTypeName } from '@segment/actions-core/destination-kit/types'
import { Settings } from '../generated-types'

export async function getCatalogMetas(request: RequestClient, endpoint: string) {
  const response = await request<ListCatalogsResponse>(`${endpoint}/catalogs`, {
    method: 'get'
  })

  return response?.data?.catalogs
}

export async function createCatalog(
  request: RequestClient,
  endpoint: string,
  hookInputs?: OnMappingSaveInputs
): Promise<ActionHookResponse<{ catalog_name: string }>> {
  const { created_catalog_name = '', description = '', columns = [] } = hookInputs ?? {}

  const fields: { name: string; type: string }[] = [{ name: 'id', type: 'string' }].concat(
    columns
      ?.filter((column) => column.name !== 'id') // Ensure 'id' is always the first field and not duplicated and string type
      .map((column) => ({
        name: column?.name,
        type: column?.type
      }))
  )

  const body = {
    catalogs: [
      {
        name: created_catalog_name,
        description,
        fields
      }
    ]
  }

  try {
    await request(`${endpoint}/catalogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      json: body
    })

    return {
      successMessage: 'Catalog created successfully',
      savedData: {
        catalog_name: created_catalog_name
      }
    }
  } catch (error) {
    return {
      error: {
        message: (error?.response?.data as UpsertCatalogItemErrorResponse).errors?.[0]?.message ?? 'Unknown Error',
        code: 'ERROR'
      }
    }
  }
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

export async function getCatalogNames(
  request: RequestClient,
  { settings }: { settings: Settings }
): Promise<DynamicFieldResponse> {
  let choices: DynamicFieldItem[] = []
  try {
    const catalogs = await getCatalogMetas(request, settings.endpoint)

    if (catalogs?.length) {
      choices = catalogs.map((catalog) => ({
        label: catalog.name,
        value: catalog.name,
        type: 'string' as FieldTypeName,
        description: catalog?.description
      }))
      return {
        choices
      }
    }
    return {
      choices,
      error: {
        message: 'No catalogs found. Please create a catalog first.',
        code: '404'
      }
    }
  } catch (err) {
    return {
      choices,
      error: {
        message: 'Unknown error. Please try again later',
        code: '500'
      }
    }
  }
}
