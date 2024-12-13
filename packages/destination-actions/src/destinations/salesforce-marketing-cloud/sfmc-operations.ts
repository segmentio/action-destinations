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

export async function upsertRows(
  request: RequestClient,
  subdomain: String,
  payloads: payload_dataExtension[] | payload_contactDataExtension[]
) {
  const multiStatusResponse = new MultiStatusResponse()
  let url: string
  let response: ModifiedResponse | undefined
  const { key, id } = payloads[0]
  if (!key && !id) {
    if (payloads.length === 1) {
      throw new IntegrationError(
        `In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.`,
        'Misconfigured required field',
        400
      )
    }
    payloads.forEach((_, index) => {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: `In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.`
      })
    })
    return multiStatusResponse
  }
  const rows: Record<string, any>[] = []
  payloads.forEach((payload: payload_dataExtension | payload_contactDataExtension) => {
    rows.push({
      keys: payload.keys,
      values: payload.values
    })
  })
  if (key) {
    url = `https://${subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/key:${key}/rowset`
  } else {
    url = `https://${subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/${id}/rowset`
  }

  try {
    response = await request(url, {
      method: 'POST',
      json: rows
    })
    payloads.forEach((payload, index) => {
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        sent: payload as Object as JSONLikeObject,
        body: JSON.stringify(response?.data)
      })
    })
  } catch (error) {
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

  if (payloads.length > 1) {
    return multiStatusResponse
  }

  return response
}
