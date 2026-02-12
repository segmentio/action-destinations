import { RequestClient, IntegrationError } from '@segment/actions-core'
import { FacebookResponseError, CreateAudienceRequest, CreateAudienceResponse, GetAudienceResponse } from './types'
import { API_VERSION, BASE_URL } from './constants'

export async function createAudience(
  request: RequestClient,
  name: string,
  adAccountId: string,
  description?: string
): Promise<{ data?: { externalId: string }; error?: { message: string; code: string } }> {
  if (!name) {
    throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
  }
  if (!adAccountId) {
    throw new IntegrationError('Missing ad account ID value', 'MISSING_REQUIRED_FIELD', 400)
  }

  const url = `${BASE_URL}/${API_VERSION}/act_${
    adAccountId.startsWith('act_') ? adAccountId.slice(4) : adAccountId
  }/customaudiences`

  const json: CreateAudienceRequest = {
    name,
    subtype: 'CUSTOM',
    customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED',
    ...(description ? { description } : {})
  }

  try {
    const response = await request<CreateAudienceResponse>(url, {
      method: 'post',
      json
    })

    const r = await response.json()
    const id = r.id

    if (!id) {
      return {
        error: {
          message: 'Invalid response from create audience request',
          code: 'INVALID_RESPONSE'
        }
      }
    }
    return { data: { externalId: id } }
  } catch (error) {
    const err = error as FacebookResponseError
    return {
      error: {
        message: err.error.message,
        code: err.error.type
      }
    }
  }
}

export async function getAudience(
  request: RequestClient,
  externalId: string
): Promise<{ data?: { externalId?: string; name: string }; error?: { message: string; code: string } }> {
  const url = `${BASE_URL}/${API_VERSION}/${externalId}`

  try {
    const response = await request<GetAudienceResponse>(url, { method: 'GET' })
    const r = await response.json()
    const { id, name } = r

    if (!id) {
      return {
        error: {
          message: 'Invalid response from get audience request',
          code: 'INVALID_RESPONSE'
        }
      }
    }
    if (externalId !== id) {
      return {
        error: {
          message: `Audience not found. Audience ID mismatch. Expected: ${externalId}, Received: ${id}`,
          code: 'ID_MISMATCH'
        }
      }
    }
    return {
      data: {
        externalId: id,
        name: name || ''
      }
    }
  } catch (error) {
    const err = error as FacebookResponseError
    return {
      error: {
        message: err.error.message,
        code: err.error.type
      }
    }
  }
}
