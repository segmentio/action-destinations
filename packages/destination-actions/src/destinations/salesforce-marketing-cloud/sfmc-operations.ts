import {
  RequestClient,
  MultiStatusResponse,
  JSONLikeObject,
  ModifiedResponse,
  IntegrationError,
  ActionHookResponse,
  DynamicFieldResponse,
  DynamicFieldError,
  DynamicFieldItem
} from '@segment/actions-core'
import { Payload as payload_dataExtension } from './dataExtension/generated-types'
import { Payload as payload_contactDataExtension } from './contactDataExtension/generated-types'
import { ErrorResponse } from './types'
import { OnMappingSaveInputs } from './dataExtension/generated-types'
import { Settings } from './generated-types'

function generateRows(payloads: payload_dataExtension[] | payload_contactDataExtension[]): Record<string, any>[] {
  const rows: Record<string, any>[] = []
  payloads.forEach((payload: payload_dataExtension | payload_contactDataExtension) => {
    rows.push({
      keys: payload.keys,
      values: payload.values
    })
  })
  return rows
}

export function upsertRows(
  request: RequestClient,
  subdomain: String,
  payloads: payload_dataExtension[] | payload_contactDataExtension[],
  dataExtensionId?: string,
  dataExtensionKey?: string
) {
  if (!dataExtensionKey && !dataExtensionId) {
    throw new IntegrationError(
      `In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.`,
      'Misconfigured required field',
      400
    )
  }
  const rows = generateRows(payloads)
  if (dataExtensionKey) {
    return request(
      `https://${subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/key:${dataExtensionKey}/rowset`,
      {
        method: 'POST',
        json: rows
      }
    )
  } else {
    return request(`https://${subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/${dataExtensionId}/rowset`, {
      method: 'POST',
      json: rows
    })
  }
}

export async function executeUpsertWithMultiStatus(
  request: RequestClient,
  subdomain: String,
  payloads: payload_dataExtension[] | payload_contactDataExtension[],
  dataExtensionId?: string,
  dataExtensionKey?: string
): Promise<MultiStatusResponse> {
  const multiStatusResponse = new MultiStatusResponse()
  let response: ModifiedResponse | undefined
  const rows = generateRows(payloads)
  try {
    response = await upsertRows(request, subdomain, payloads, dataExtensionId, dataExtensionKey)
    if (response) {
      const responseData = response.data as JSONLikeObject[]
      payloads.forEach((_, index) => {
        multiStatusResponse.setSuccessResponseAtIndex(index, {
          status: 200,
          sent: rows[index] as Object as JSONLikeObject,
          body: responseData[index] ? (responseData[index] as Object as JSONLikeObject) : {}
        })
      })
    }
  } catch (error) {
    if (error instanceof IntegrationError && error.code === 'Misconfigured required field') {
      payloads.forEach((_, index) => {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: `In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.`
        })
      })
      return multiStatusResponse
    }
    const err = error as ErrorResponse
    if (err?.response?.status === 401) {
      throw error
    }

    const errData = err?.response?.data
    const additionalError =
      err?.response?.data?.additionalErrors &&
      err.response.data.additionalErrors.length > 0 &&
      err.response.data.additionalErrors

    payloads.forEach((_, index) => {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: err?.response?.status || 400,
        errormessage: additionalError ? additionalError[0].message : errData?.message || '',
        sent: rows[index] as Object as JSONLikeObject,
        /*
        Setting the error response body to the additionalError array as there is no way to determine which error corresponds to which event. 
        We receive an array of errors, but some errors may not be repeated even if they occur in multiple events, while others may be.
    
        Additionally, there is no consistent order to the errors in the array. For example, errors like 
        'At least one existing field is required in the values property' consistently appear at the top of the array.
    
        Furthermore, every event that is processed correctly before the first erroneous event is accepted. 
        However, any events that occur after the first error, regardless of whether they are correct or not, are rejected. 
        This means that all valid events following the first error will not be processed.

        For more information, please refer to: 
        https://salesforce.stackexchange.com/questions/292770/import-contacts-sfmc-via-api-vs-ftp/292774#292774
        */
        body: additionalError ? (additionalError as Object as JSONLikeObject) : (errData as Object as JSONLikeObject)
      })
    })
  }
  return multiStatusResponse
}

interface DataExtensionField {}

interface DataExtensionCreationResponse {
  data: {
    id?: string
    name?: string
    key?: string
    message?: string
    errorcode?: number
  }
}

interface DataExtensionSelectionResponse {
  data: {
    id?: string
    name?: string
    key?: string
  }
}

interface DataExtensionSearchResponse {
  count: number
  items: {
    id: string
    name: string
    key: string
  }[]
}

interface RefreshTokenResponse {
  access_token: string
  instance_url: string
}

const getAccessToken = async (request: RequestClient, settings: Settings): Promise<string> => {
  const baseUrl = `https://${settings.subdomain}.auth.marketingcloudapis.com/v2/token`
  const res = await request<RefreshTokenResponse>(`${baseUrl}`, {
    method: 'POST',
    body: new URLSearchParams({
      account_id: settings.account_id,
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      grant_type: 'client_credentials'
    })
  })

  return res.data.access_token
}

const dataExtensionRequest = async (
  request: RequestClient,
  hookInputs: OnMappingSaveInputs,
  auth: { subdomain: string; accessToken: string }
): Promise<{ id?: string; key?: string; error?: string }> => {
  if (!hookInputs) {
    return { id: '', key: '', error: 'No inputs provided' }
  }

  if (!hookInputs.columns) {
    return { id: '', key: '', error: 'No columns provided' }
  }

  const fields: DataExtensionField[] = hookInputs.columns.map((column, i) => {
    return {
      name: column.name,
      type: column.type,
      isNullable: column.isNullable,
      isPrimaryKey: column.isPrimaryKey,
      length: column.length,
      description: column.description || '',
      // these are required but we don't give the user an option
      ordinal: i,
      isTemplateField: false,
      isHidden: false,
      isReadOnly: false,
      isInheritable: false,
      isOverridable: false,
      mustOverride: false
    }
  })

  try {
    const response = await request<DataExtensionCreationResponse>(
      `https://${auth.subdomain}.rest.marketingcloudapis.com/data/v1/customobjects`,
      {
        method: 'POST',
        json: {
          name: hookInputs.name,
          description: hookInputs.description,
          categoryId: hookInputs.categoryId,
          fields
        },
        headers: {
          authorization: `Bearer ${auth.accessToken}`
        }
      }
    )

    if (response.status !== 201) {
      return { id: '', key: '', error: `Failed to create Data Extension` }
    }

    return {
      id: (response as DataExtensionCreationResponse).data.id,
      key: (response as DataExtensionCreationResponse).data.key
    }
  } catch (error) {
    return { id: '', key: '', error: error.response.data.message }
  }
}

async function createDataExtension(
  request: RequestClient,
  subdomain: string,
  hookInputs: OnMappingSaveInputs,
  settings: Settings
): Promise<ActionHookResponse<{ id: string; name: string }>> {
  if (!hookInputs) {
    return {
      error: { message: 'No inputs provided', code: 'ERROR' }
    }
  }

  const accessToken = await getAccessToken(request, settings)

  const { id, key, error } = await dataExtensionRequest(request, hookInputs, { subdomain, accessToken })

  if (error || !id || !key) {
    return {
      error: { message: error || 'Unknown Error', code: 'ERROR' }
    }
  }

  return {
    successMessage: `Data Extension ${hookInputs.name} created successfully with External Key ${key}`,
    savedData: {
      id,
      name: hookInputs.name!
    }
  }
}

const selectDataExtensionRequest = async (
  request: RequestClient,
  hookInputs: OnMappingSaveInputs,
  auth: { subdomain: string; accessToken: string }
): Promise<{ id?: string; key?: string; name?: string; error?: string }> => {
  if (!hookInputs) {
    return { id: '', key: '', name: '', error: 'No inputs provided' }
  }

  if (!hookInputs.dataExtensionKey && !hookInputs.dataExtensionId) {
    return { id: '', key: '', name: '', error: 'No Data Extension Key or Data Extension Id provided' }
  }

  try {
    const response = await request<DataExtensionSelectionResponse>(
      `https://${auth.subdomain}.rest.marketingcloudapis.com/data/v1/customobjects/${hookInputs.dataExtensionId}`,
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${auth.accessToken}`
        }
      }
    )
    console.log('res', response)
    if (response.status !== 200) {
      return { id: '', key: '', name: '', error: `Failed to select Data Extension` }
    }

    return {
      id: (response as DataExtensionSelectionResponse).data.id,
      key: (response as DataExtensionSelectionResponse).data.key,
      name: (response as DataExtensionSelectionResponse).data.name
    }
  } catch (err) {
    return { id: '', key: '', name: '', error: err.response.data.message }
  }
}

async function selectDataExtension(
  request: RequestClient,
  subdomain: string,
  hookInputs: OnMappingSaveInputs,
  settings: Settings
): Promise<ActionHookResponse<{ id: string; name: string }>> {
  if (!hookInputs) {
    return {
      error: { message: 'No inputs provided', code: 'ERROR' }
    }
  }

  const accessToken = await getAccessToken(request, settings)

  const { id, key, name, error } = await selectDataExtensionRequest(request, hookInputs, { subdomain, accessToken })

  if (error || !id || !key) {
    return {
      error: { message: error || 'Unknown Error', code: 'ERROR' }
    }
  }

  return {
    successMessage: `Data Extension ${name} selected successfully with External Key ${key}`,
    savedData: {
      id,
      name: name!
    }
  }
}

export const selectOrCreateDataExtension = async (
  request: RequestClient,
  subdomain: string,
  hookInputs: OnMappingSaveInputs,
  settings: Settings
): Promise<ActionHookResponse<{ id: string; name: string }>> => {
  if (hookInputs.operation === 'create') {
    return await createDataExtension(request, subdomain, hookInputs, settings)
  } else if (hookInputs.operation === 'select') {
    return await selectDataExtension(request, subdomain, hookInputs, settings)
  }

  return {
    error: { message: 'Invalid operation', code: 'ERROR' }
  }
}

const getDataExtensionsRequest = async (
  request: RequestClient,
  searchQuery: string,
  auth: { subdomain: string; accessToken: string }
): Promise<{ results?: DynamicFieldItem[]; error?: DynamicFieldError }> => {
  try {
    const response = await request<DataExtensionSearchResponse>(
      `https://${auth.subdomain}.rest.marketingcloudapis.com/data/v1/customobjects`,
      {
        method: 'get',
        searchParams: {
          $search: searchQuery
        },
        headers: {
          authorization: `Bearer ${auth.accessToken}`
        }
      }
    )

    if (response.status !== 200) {
      return { error: { message: 'Failed to fetch Data Extensions', code: 'BAD_REQUEST' } }
    }

    const choices = response.data.items

    return {
      results: choices.map((choice) => {
        return {
          value: choice.id,
          label: choice.name
        }
      })
    }
  } catch (err) {
    return { error: { message: err.response.data.message, code: 'BAD_REQUEST' } }
  }
}

export const getDataExtensions = async (
  request: RequestClient,
  subdomain: string,
  settings: Settings,
  query?: string
): Promise<DynamicFieldResponse> => {
  let searchQuery = '_'
  if (query && query !== '') {
    searchQuery = query
  }

  const accessToken = await getAccessToken(request, settings)

  const { results, error } = await getDataExtensionsRequest(request, searchQuery, { subdomain, accessToken })

  if (error) {
    return {
      choices: [],
      error: error
    }
  }

  if (!results || (Array.isArray(results) && results.length === 0)) {
    return {
      choices: [],
      error: { message: 'No Data Extensions found', code: 'NOT_FOUND' }
    }
  }

  return {
    choices: results
  }
}
