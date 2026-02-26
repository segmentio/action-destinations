import { RequestClient } from '@segment/actions-core'
import type { DynamicFieldItem, DynamicFieldError } from '@segment/actions-core'
import { GetAllAudienceResponse } from './types'
import { API_VERSION, BASE_URL } from '../constants'
import { Settings } from '../generated-types'
import { createAudience, getAudience, parseFacebookError } from '../functions'

export async function performHook(
  request: RequestClient,
  adAccountId: string,
  operation?: string,
  audienceName?: string,
  existingAudienceId?: string
) {
  if (operation === 'create') {
    if (!audienceName || typeof audienceName !== 'string') {
      return {
        error: {
          message: 'Missing audience name value',
          code: 'MISSING_REQUIRED_FIELD'
        }
      }
    } else {
      const { data: { externalId } = {}, error } = await createAudience(request, audienceName, adAccountId)

      if (error) {
        return { error, choices: [] }
      }

      return {
        successMessage: `Audience created with ID: ${externalId}`,
        savedData: {
          audienceId: externalId,
          audienceName
        }
      }
    }
  }

  if (operation === 'existing') {
    if (!existingAudienceId || typeof existingAudienceId !== 'string') {
      return {
        error: {
          message: 'Missing audience ID value',
          code: 'MISSING_REQUIRED_FIELD'
        }
      }
    } else {
      const { data: { name } = {}, error } = await getAudience(request, existingAudienceId)

      if (error) {
        return { error }
      }

      return {
        successMessage: `Connected to audience with ID: ${existingAudienceId}`,
        savedData: {
          audienceId: existingAudienceId,
          audienceName: name
        }
      }
    }
  }

  return {
    error: {
      message: 'Invalid operation',
      code: 'INVALID_OPERATION'
    }
  }
}


export async function getExistingAudienceIdChoices(request: RequestClient, { settings }: { settings: Settings }) {
  const { retlAdAccountId: adAccountId } = settings
  const { choices, error } = await getAllAudiences(request, adAccountId)
  if (error) {
    return { error, choices: [] }
  }
  return {
    choices
  }
}

export async function getAllAudiences(
  request: RequestClient,
  adAccountId: string
): Promise<{
  choices: DynamicFieldItem[]
  error?: DynamicFieldError
}> {
  const url = `${BASE_URL}/${API_VERSION}/act_${
    adAccountId.startsWith('act_') ? adAccountId.slice(4) : adAccountId
  }/customaudiences?fields=id,name&limit=200`

  try {
    const { data } = await request<GetAllAudienceResponse>(url)
    const choices = data.data.map(({ id, name }) => ({
      value: id,
      label: name
    }))
    if (choices.length > 0) {
      return {
        choices
      }
    }
    return {
      error: {
        message:
          'No custom audiences found in this ad account. Please create an audience in Facebook before connecting it to Segment.',
        code: 'NO_AUDIENCES_FOUND'
      },
      choices: []
    }
  } catch (error) {
    const { message, type } = parseFacebookError(error)
    return { error: { message, code: type }, choices: [] }
  }
}