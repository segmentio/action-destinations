import { RequestClient, ErrorCodes, Features } from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'
import { createAudienceRequest, getAudienceRequest } from '../functions'
import { DEVICE_ID } from '../constants'
import type { RetlOnMappingSaveInputs } from './generated-types'

interface DV360Audience {
  firstPartyAndPartnerAudienceId?: string
  displayName?: string
  audienceType?: string
  appId?: string
  error?: {
    message?: string
  }
}

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

  if (!advertiserId) {
    return {
      error: {
        message: 'Missing advertiser ID value',
        code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED
      }
    }
  }

  if (operation === 'create') {
    if (!audienceName) {
      return {
        error: { message: 'Missing audience name value', code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED }
      }
    }

    if (!audienceType) {
      return {
        error: { message: 'Missing audience type value', code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED }
      }
    }

    if (!membershipDurationDays) {
      return {
        error: { message: 'Missing membership duration days value', code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED }
      }
    }

    if (audienceType === DEVICE_ID && !appId) {
      return {
        error: {
          message: 'App ID is required for CUSTOMER_MATCH_DEVICE_ID audiences',
          code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED
        }
      }
    }

    const response = await createAudienceRequest(request, {
      advertiserId: advertiserId.trim(),
      audienceName,
      description,
      membershipDurationDays,
      audienceType,
      appId,
      features,
      statsContext
    })

    const audience = (await response.json()) as DV360Audience
    const audienceId = audience?.firstPartyAndPartnerAudienceId

    if (!audienceId) {
      return {
        error: {
          message: audience?.error?.message ?? 'Failed to create audience in Display & Video 360',
          code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED
        }
      }
    }

    return {
      successMessage: `Audience created with ID: ${audienceId}`,
      savedData: {
        audienceId,
        advertiserId: advertiserId.trim(),
        audienceType,
        appId
      }
    }
  }

  if (operation === 'existing') {
    if (!existingAudienceId) {
      return {
        error: { message: 'Missing audience ID value', code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED }
      }
    }

    let audience: DV360Audience

    try {
      const response = await getAudienceRequest(request, {
        advertiserId: advertiserId.trim(),
        audienceId: existingAudienceId,
        features,
        statsContext
      })

      audience = (await response.json()) as DV360Audience
    } catch {
      return {
        error: {
          message: `Failed to retrieve audience ${existingAudienceId} from Display & Video 360`,
          code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED
        }
      }
    }

    // The audience type is read back from Display & Video 360 rather than asked for again,
    // so it can never disagree with the audience this mapping is connected to.
    if (!audience?.audienceType) {
      return {
        error: {
          message: `Audience ${existingAudienceId} is not a Customer Match audience`,
          code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED
        }
      }
    }

    return {
      successMessage: `Connected to audience with ID: ${existingAudienceId}`,
      savedData: {
        audienceId: existingAudienceId,
        advertiserId: advertiserId.trim(),
        audienceType: audience.audienceType,
        appId: audience.appId
      }
    }
  }

  return {
    error: {
      message: 'Invalid operation value. Must be create or existing.',
      code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED
    }
  }
}
