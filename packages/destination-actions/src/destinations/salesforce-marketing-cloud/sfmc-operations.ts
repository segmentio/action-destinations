import {
  RequestClient,
  MultiStatusResponse,
  JSONLikeObject,
  ModifiedResponse,
  IntegrationError
} from '@segment/actions-core'
import { Payload as payload_dataExtension } from './dataExtension/generated-types'
import { Payload as payload_contactDataExtension } from './contactDataExtension/generated-types'
import { ErrorResponse } from './types'

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
