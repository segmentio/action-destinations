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
  const rows: Record<string, any>[] = []
  payloads.forEach((payload: payload_dataExtension | payload_contactDataExtension) => {
    rows.push({
      keys: payload.keys,
      values: payload.values
    })
  })
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

export async function handleMultistatusResponse(
  request: RequestClient,
  subdomain: String,
  payloads: payload_dataExtension[] | payload_contactDataExtension[]
): Promise<MultiStatusResponse> {
  const multiStatusResponse = new MultiStatusResponse()
  let response: ModifiedResponse | undefined
  try {
    response = await upsertRows(request, subdomain, payloads)
    payloads.forEach((payload, index) => {
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        sent: payload as Object as JSONLikeObject,
        body: JSON.stringify(response?.data)
      })
    })
  } catch (error) {
    if (error instanceof IntegrationError && error.code === 'Misconfigured required field') {
      payloads.forEach((_, index) => {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: `In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.`
        })
      })
    }
    const err = error as ErrorResponse
    if (err?.response?.data?.message === 'Not Authorized' || payloads.length === 1) {
      throw error
    }

    payloads.forEach((payload, index) => {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errormessage:
          (err?.response?.data?.additionalErrors &&
            err.response.data.additionalErrors.length > 0 &&
            err.response.data.additionalErrors[0].message) ||
          err?.response?.data?.message ||
          '',
        sent: payload as Object as JSONLikeObject,
        body: JSON.stringify(err)
      })
    })
  }
  return multiStatusResponse
}
