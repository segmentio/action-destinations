import { RequestClient, ErrorCodes, Features } from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'
import { createOrConnectAudience } from '../audience-functions'
import type { RetlOnMappingSaveInputs } from './generated-types'

export async function performHook(
  request: RequestClient,
  hookInputs: RetlOnMappingSaveInputs,
  features?: Features,
  statsContext?: StatsContext
) {
  const {
    operation,
    advertiserId,
    audienceName,
    audienceType,
    membershipDurationDays,
    description,
    appId,
    existingAudienceId
  } = hookInputs

  if (operation !== 'create' && operation !== 'create_or_connect' && operation !== 'existing') {
    return {
      error: {
        message: 'Invalid operation value. Must be create, create_or_connect or existing.',
        code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED
      }
    }
  }

  try {
    const result = await createOrConnectAudience(
      request,
      {
        operation,
        advertiserId,
        audienceName,
        audienceType,
        membershipDurationDays,
        description,
        appId,
        existingAudienceId
      },
      { statsName: 'retlCreateAudience', features, statsContext }
    )

    return {
      successMessage:
        result.outcome === 'created'
          ? `Audience created with ID: ${result.audienceId}`
          : `Connected to existing audience with ID: ${result.audienceId}`,
      savedData: {
        audienceId: result.audienceId,
        advertiserId: result.advertiserId,
        audienceType: result.audienceType,
        appId: result.appId
      }
    }
  } catch (error) {
    return {
      error: {
        message: errorMessage(error),
        code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED
      }
    }
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return error === undefined || error === null ? 'unknown error' : JSON.stringify(error)
}
