import { RequestClient, ErrorCodes, Features } from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'
import { createAudienceRequest, getAudienceRequest } from '../functions'
import { CONTACT_INFO, DEVICE_ID } from './constants'
import type { RetlOnMappingSaveInputs } from './generated-types'
import { DV360Audience } from './types'

function errorDetail(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '')

  return message ? `: ${message}` : ''
}

export async function performHook(
  request: RequestClient,
  hookInputs: RetlOnMappingSaveInputs,
  features?: Features,
  statsContext?: StatsContext
) {
  const {
    operation,
    advertiserId: rawAdvertiserId,
    audienceName: rawAudienceName,
    audienceType,
    membershipDurationDays,
    description: rawDescription,
    appId,
    existingAudienceId: rawExistingAudienceId
  } = hookInputs

  const advertiserId = rawAdvertiserId?.trim()
  const existingAudienceId = rawExistingAudienceId?.trim()
  const audienceName = rawAudienceName?.trim()
  const description = rawDescription?.trim()

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

    if (membershipDurationDays === undefined || membershipDurationDays === null) {
      return {
        error: { message: 'Missing membership duration days value', code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED }
      }
    }

    if (!Number.isInteger(membershipDurationDays) || membershipDurationDays < 1 || membershipDurationDays > 540) {
      return {
        error: {
          message: 'Membership duration days must be a whole number greater than 0 and less than or equal to 540',
          code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED
        }
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

    let audience: DV360Audience

    try {
      const response = await createAudienceRequest(request, {
        advertiserId,
        audienceName,
        description,
        // DV360 takes membershipDurationDays as an int64, which is a string over JSON.
        membershipDurationDays: String(membershipDurationDays),
        audienceType,
        appId,
        features,
        statsContext
      })

      audience = (await response.json()) as DV360Audience
    } catch (error) {
      return {
        error: {
          message: `Failed to create audience in Display & Video 360${errorDetail(error)}`,
          code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED
        }
      }
    }

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
        advertiserId,
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
        advertiserId,
        audienceId: existingAudienceId,
        features,
        statsContext
      })

      audience = (await response.json()) as DV360Audience
    } catch (error) {
      return {
        error: {
          message: `Failed to retrieve audience ${existingAudienceId} from Display & Video 360${errorDetail(error)}`,
          code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED
        }
      }
    }

    if (!audience?.audienceType || (audience.audienceType !== CONTACT_INFO && audience.audienceType !== DEVICE_ID)) {
      return {
        error: {
          message: `Audience ${existingAudienceId} is not a Customer Match Contact Info or Mobile Device ID audience`,
          code: ErrorCodes.RETL_ON_MAPPING_SAVE_FAILED
        }
      }
    }

    return {
      successMessage: `Connected to audience with ID: ${existingAudienceId}`,
      savedData: {
        audienceId: existingAudienceId,
        advertiserId,
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
