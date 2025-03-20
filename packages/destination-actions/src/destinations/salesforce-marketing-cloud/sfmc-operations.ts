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
import { OnMappingSaveInputs } from './dataExtensionV2/generated-types'
import { Settings } from './generated-types'
import { xml2js } from 'xml-js'

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
  payloads: payload_dataExtension[] | payload_contactDataExtension[]
) {
  const { key, id } = payloads[0]
  if (!key && !id) {
    throw new IntegrationError(
      `In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.`,
      'Misconfigured required field',
      400
    )
  }
  const rows = generateRows(payloads)
  if (key) {
    return request(`https://${subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/key:${key}/rowset`, {
      method: 'POST',
      json: rows
    })
  } else {
    return request(`https://${subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/${id}/rowset`, {
      method: 'POST',
      json: rows
    })
  }
}

export function upsertRowsV2(
  request: RequestClient,
  subdomain: String,
  payloads: payload_dataExtension[] | payload_contactDataExtension[],
  dataExtensionId: string
) {
  if (!dataExtensionId) {
    throw new IntegrationError(
      `In order to send an event to a data extension Data Extension ID must be defined.`,
      'Misconfigured required field',
      400
    )
  }

  const rows = generateRows(payloads)
  return request(`https://${subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/${dataExtensionId}/rowset`, {
    method: 'POST',
    json: rows
  })
}

export async function executeUpsertWithMultiStatus(
  request: RequestClient,
  subdomain: String,
  payloads: payload_dataExtension[] | payload_contactDataExtension[],
  dataExtensionId?: string
): Promise<MultiStatusResponse> {
  const multiStatusResponse = new MultiStatusResponse()
  let response: ModifiedResponse | undefined
  const rows = generateRows(payloads)
  try {
    if (dataExtensionId) {
      response = await upsertRowsV2(request, subdomain, payloads, dataExtensionId)
    } else {
      response = await upsertRows(request, subdomain, payloads)
    }

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

interface DataExtensionFieldsResponse {
  id: string
  fields: {
    name: string
    type: string
    isPrimaryKey: boolean
  }[]
}

interface RefreshTokenResponse {
  access_token: string
  soap_instance_url: string
}

interface SoapResponseResult {
  ID: {
    _text: string
  }
  Name: {
    _text: string
  }
  ContentType: {
    _text: string
  }
}

const getAccessToken = async (
  request: RequestClient,
  settings: Settings
): Promise<{ accessToken: string; soapInstanceUrl: string }> => {
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

  return { accessToken: res.data.access_token, soapInstanceUrl: res.data.soap_instance_url }
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

  const fields = hookInputs.columns.map((column, i) => {
    return {
      name: column.name,
      type: column.type,
      isNullable: column.isNullable,
      isPrimaryKey: column.isPrimaryKey,
      length: column.length,
      scale: column.scale,
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
          isSendable: hookInputs.isSendable,
          sendableCustomObjectField: hookInputs.sendableCustomObjectField,
          sendableSubscriberField: hookInputs.sendableSubscriberField,
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

  const { accessToken } = await getAccessToken(request, settings)

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
): Promise<{ id?: string; name?: string; error?: string }> => {
  if (!hookInputs) {
    return { id: '', name: '', error: 'No inputs provided' }
  }

  if (!hookInputs.dataExtensionId) {
    return { id: '', name: '', error: 'No Data Extension Id provided' }
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

    if (response.status !== 200) {
      return { id: '', name: '', error: `Failed to select Data Extension` }
    }

    return {
      id: (response as DataExtensionSelectionResponse).data.id,
      name: (response as DataExtensionSelectionResponse).data.name
    }
  } catch (err) {
    return { id: '', name: '', error: err.response.data.message }
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

  const { accessToken } = await getAccessToken(request, settings)

  const { id, name, error } = await selectDataExtensionRequest(request, hookInputs, { subdomain, accessToken })

  if (error || !id) {
    return {
      error: { message: error || 'Unknown Error', code: 'ERROR' }
    }
  }

  return {
    successMessage: `Data Extension ${name} selected successfully with External ID ${id}`,
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
    const errorCode: string =
      typeof err.response.data.errorcode === 'number'
        ? err.response.data.errorcode.toString()
        : err.response.data.errorcode
    const errorMessage = err.response.data.message

    if (errorCode === '20002') {
      return {
        error: {
          message: `${errorMessage}. Please input a data extension ID manually to configure your mapping. To resolve this authentication issue refer to the required permissions under 'Getting Started' in the documentation at https://segment.com/docs/connections/destinations/catalog/actions-salesforce-marketing-cloud/`,
          code: errorCode
        }
      }
    }

    return { error: { message: err.response.data.message, code: errorCode || 'BAD_REQUEST' } }
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

  const { accessToken } = await getAccessToken(request, settings)

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

const getDataExtensionFieldsRequest = async (
  request: RequestClient,
  dataExtensionId: string,
  auth: { subdomain: string; accessToken: string },
  primaryKey: boolean
): Promise<{ results?: DynamicFieldItem[]; error?: DynamicFieldError }> => {
  try {
    const response = await request<DataExtensionFieldsResponse>(
      `https://${auth.subdomain}.rest.marketingcloudapis.com/data/v1/customobjects/${dataExtensionId}/fields`,
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${auth.accessToken}`
        }
      }
    )

    if (response.status !== 200) {
      return { error: { message: 'Failed to fetch Data Extension fields', code: 'BAD_REQUEST' } }
    }

    const filteredItems = response.data.fields.filter((field) => field.isPrimaryKey === primaryKey)

    const choices = filteredItems.map((field) => {
      return { value: field.name, label: field.name }
    })

    return { results: choices }
  } catch (err) {
    return { error: { message: err.response.data.message, code: 'BAD_REQUEST' } }
  }
}

export const getDataExtensionFields = async (
  request: RequestClient,
  subdomain: string,
  settings: Settings,
  dataExtensionID: string,
  primaryKey: boolean
): Promise<DynamicFieldResponse> => {
  if (!dataExtensionID) {
    return { choices: [], error: { message: 'No Data Extension ID provided', code: 'BAD_REQUEST' } }
  }
  const { accessToken } = await getAccessToken(request, settings)

  const { results, error } = await getDataExtensionFieldsRequest(
    request,
    dataExtensionID,
    { subdomain, accessToken },
    primaryKey
  )

  if (error) {
    return {
      choices: [],
      error: error
    }
  }

  if (!results || (Array.isArray(results) && results.length === 0)) {
    return {
      choices: [],
      error: { message: 'No Data Extension fields found', code: 'NOT_FOUND' }
    }
  }

  return {
    choices: results
  }
}

const getCategoriesRequest = async (
  request: RequestClient,
  auth: { soapInstanceUrl: string; accessToken: string }
): Promise<{ results?: DynamicFieldItem[]; error?: DynamicFieldError }> => {
  try {
    const response = await request(`${auth.soapInstanceUrl}/Service.asmx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        SOAPAction: 'Retrieve'
      },
      body: `<?xml version="1.0" encoding="UTF-8"?>
        <SOAP-ENV:Envelope
          xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
          xmlns:xsd="http://www.w3.org/2001/XMLSchema"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
          <SOAP-ENV:Header>
            <fueloauth xmlns="http://exacttarget.com">${auth.accessToken}</fueloauth>
          </SOAP-ENV:Header>
          <SOAP-ENV:Body>
            <RetrieveRequestMsg
              xmlns="http://exacttarget.com/wsdl/partnerAPI">
                <RetrieveRequest>
                  <ObjectType>DataFolder</ObjectType>
                  <Properties>ID</Properties>
                  <Properties>Name</Properties>
                  <Properties>ContentType</Properties>
                </RetrieveRequest>
            </RetrieveRequestMsg>
          </SOAP-ENV:Body>
        </SOAP-ENV:Envelope>
        `
    })

    const convert: any = xml2js(response.content, { compact: true })
    const items = (convert['soap:Envelope']['soap:Body']['RetrieveResponseMsg']['Results'] as SoapResponseResult[]).map(
      (item) => {
        const type = item.ContentType._text

        return {
          label: item.Name._text,
          value: item.ID._text,
          description: `ContentType: ${type}`
        }
      }
    )

    return {
      results: items
    }
  } catch (err) {
    return { error: { message: err.response.data.message, code: 'BAD_REQUEST' } }
  }
}

export const getCategories = async (request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> => {
  const { accessToken, soapInstanceUrl } = await getAccessToken(request, settings)

  const { results, error } = await getCategoriesRequest(request, { soapInstanceUrl, accessToken })

  if (error) {
    return {
      choices: [],
      error: error
    }
  }

  return {
    choices: results || []
  }
}
