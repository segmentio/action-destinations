import { RequestClient, ErrorCodes, Features, IntegrationError } from '@segment/actions-core'
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

  if (operation !== 'create' && operation !== 'existing') {
    return {
      error: {
        message: 'Invalid operation value. Must be create or existing.',
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
        message: (error as IntegrationError).message,
        code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED
      }
    }
  }
}
