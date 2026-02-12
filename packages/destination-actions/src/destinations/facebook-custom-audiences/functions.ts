import { RequestClient, IntegrationError } from '@segment/actions-core'
import { CreateAudienceInput, AudienceResult, GetAudienceInput } from '@segment/actions-core/destination-kit'
import type { Settings, AudienceSettings } from './generated-types'
import { CreateAudienceRequest, CreateAudienceResponse, GetAudienceResponse } from './types'
import { API_VERSION } from './constants'

export async function createAudience(
  request: RequestClient,
  createAudienceInput: CreateAudienceInput<Settings, AudienceSettings>
): Promise<AudienceResult> {
  const { audienceName, audienceSettings: { engageAdAccountId: adAccountId, audienceDescription } = {} } =
    createAudienceInput

  if (!audienceName) {
    throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
  }
  if (!adAccountId) {
    throw new IntegrationError('Missing ad account ID value', 'MISSING_REQUIRED_FIELD', 400)
  }

  const url = `https://graph.facebook.com/${API_VERSION}/act_${adAccountId}/customaudiences`

  const payload: CreateAudienceRequest = {
    name: audienceName,
    description: audienceDescription || '',
    subtype: 'CUSTOM',
    customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED'
  }

  let response
  try {
    response = await request<CreateAudienceResponse>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(payload as unknown as Record<string, string>)
    })
  } catch (err) {
    let message = err.response?.content || err.message
    let userTitle: string | undefined, userMsg: string | undefined

    if (typeof message === 'string') {
      try {
        const parsed = JSON.parse(message)
        if (parsed?.error) {
          userTitle = parsed.error.error_user_title
          userMsg = parsed.error.error_user_msg || parsed.error.error_user_message
        }
      } catch (e) {
        // No-Op. Add the error message to the message variable.
      }
    }

    if (userTitle || userMsg) {
      message = `${userTitle ? userTitle + ': ' : ''}${userMsg || ''}`.trim()
    }

    throw new IntegrationError(String(message), 'CREATE_AUDIENCE_FAILED', 400)
  }

  const r = await response.json()

  const id = r.id

  if (!id) {
    throw new IntegrationError('Invalid response from create audience request', 'INVALID_RESPONSE', 400)
  }

  return {
    externalId: id
  }
}

export async function getAudience(
  request: RequestClient,
  getAudienceInput: GetAudienceInput<Settings, AudienceSettings>
): Promise<AudienceResult> {
  const { externalId } = getAudienceInput

  const url = `https://graph.facebook.com/${API_VERSION}/${externalId}`

  const response = await request<GetAudienceResponse>(url, { method: 'GET' })

  const r = await response.json()

  const id = r.id

  if (!id) {
    throw new IntegrationError('Invalid response from get audience request', 'INVALID_RESPONSE', 400)
  }

  if (externalId !== id) {
    throw new IntegrationError("Couldn't find audience", 'INVALID_RESPONSE', 400)
  }

  return {
    externalId: id
  }
}
