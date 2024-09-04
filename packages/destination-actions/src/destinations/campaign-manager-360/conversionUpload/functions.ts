import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import {
  CampaignManager360ConversionCustomVariable,
  CampaignManager360ConversionsBatchInsertRequest,
  CampaignManager360CustomFloodlightVariableType,
  CampaignManager360EncryptionEntityType,
  campaignManager360EncryptionEntityTypes,
  CampaignManager360EncryptionInfo,
  CampaignManager360EncryptionSource,
  campaignManager360EncryptionSources
} from '../types'

import { resolveGoogleCampaignManager360Conversion } from '../common-functions'

export function buildInsertConversionBatchPayload(
  payloads: Payload[],
  settings: Settings
): CampaignManager360ConversionsBatchInsertRequest {
  const conversionsBatchInsertRequest: CampaignManager360ConversionsBatchInsertRequest = {
    conversions: [],
    kind: 'dfareporting#conversionsBatchInsertRequest'
  }

  // Validation with `throw` is only done for one payload.
  // For batch requests, we will just log the error and continue with the rest of the payloads.
  if (payloads.length === 1 && payloads[0]) {
    const encryptionInfo = payloads[0].encryptionInfo
    if (encryptionInfo) {
      const resolvedEncryptionInfo = validateEncryptionInfo(encryptionInfo, true)
      if (!resolvedEncryptionInfo) {
        conversionsBatchInsertRequest.encryptionInfo = resolvedEncryptionInfo
      }
    }

    const requiredId = payloads[0].requiredId
    if (
      !requiredId.gclid &&
      !requiredId.dclid &&
      !requiredId.encryptedUserId &&
      !requiredId.mobileDeviceId &&
      !requiredId.matchId &&
      !requiredId.impressionId &&
      (!payloads[0].encryptedUserIdCandidates || payloads[0].encryptedUserIdCandidates.length === 0)
    ) {
      throw new Error(
        'Missing one of the required parameters: gclid, dclid, encrypted user id, match id, impression id, mobile device id, or at least one encrypted user id candidate.'
      )
    }

    const conversion = resolveGoogleCampaignManager360Conversion(payloads[0], settings)

    // Custom variables.
    if (payloads[0].customVariables && payloads[0].customVariables.length > 0) {
      conversion.customVariables = []
      for (const customVariable of payloads[0].customVariables) {
        const resolvedCustomVariable = validateCustomVariable(customVariable, true)
        conversion.customVariables.push(resolvedCustomVariable)
      }
    }

    conversionsBatchInsertRequest.conversions.push(conversion)
    return conversionsBatchInsertRequest
  }

  const encryptionInfo = payloads[0].encryptionInfo
  if (encryptionInfo) {
    const resolvedEncryptionInfo = validateEncryptionInfo(encryptionInfo, false)
    if (!resolvedEncryptionInfo) {
      conversionsBatchInsertRequest.encryptionInfo = resolvedEncryptionInfo
    }
  }

  for (const payload of payloads) {
    const requiredId = payload.requiredId
    if (
      !requiredId.gclid &&
      !requiredId.dclid &&
      !requiredId.encryptedUserId &&
      !requiredId.mobileDeviceId &&
      !requiredId.matchId &&
      !requiredId.impressionId &&
      (!payload.encryptedUserIdCandidates || payload.encryptedUserIdCandidates.length === 0)
    ) {
      // TODO: Log the error here.
      continue
    }

    const conversion = resolveGoogleCampaignManager360Conversion(payload, settings)

    // Custom variables.
    if (payload.customVariables && payload.customVariables.length > 0) {
      conversion.customVariables = []
      for (const customVariable of payload.customVariables) {
        const resolvedCustomVariable = validateCustomVariable(customVariable, false)
        conversion.customVariables.push(resolvedCustomVariable)
      }
    }

    conversionsBatchInsertRequest.conversions.push(conversion)
  }

  return conversionsBatchInsertRequest
}

function isValidEncryptionEntityType(entityType: string): entityType is CampaignManager360EncryptionEntityType {
  return entityType in campaignManager360EncryptionEntityTypes
}

function isValidCustomVariableEncryptionSource(type: string): type is CampaignManager360EncryptionSource {
  return type in campaignManager360EncryptionSources
}

function validateEncryptionInfo(
  encryptionInfo: {
    encryptionEntityId: string
    encryptionEntityType: string
    encryptionSource: string
  },
  shouldThrowException: boolean
): CampaignManager360EncryptionInfo | undefined {
  if (!encryptionInfo.encryptionEntityId && !encryptionInfo.encryptionEntityType && !encryptionInfo.encryptionSource) {
    if (shouldThrowException) {
      throw new Error('Encryption source, entity id, and entity type are mutually required.')
    } else {
      // TODO: Log the error here.
      return undefined
    }
  }

  if (!isValidEncryptionEntityType(encryptionInfo.encryptionEntityType)) {
    if (shouldThrowException) {
      throw new Error('Invalid encryption entity type.')
    } else {
      // TODO: Log the error here.
      return undefined
    }
  }

  if (!isValidCustomVariableEncryptionSource(encryptionInfo.encryptionSource)) {
    if (shouldThrowException) {
      throw new Error('Invalid encryption source.')
    } else {
      // TODO: Log the error here.
      return undefined
    }
  }

  return {
    encryptionEntityId: encryptionInfo.encryptionEntityId,
    encryptionEntityType: encryptionInfo.encryptionEntityType,
    encryptionSource: encryptionInfo.encryptionSource,
    kind: 'dfareporting#encryptionInfo'
  }
}

function validateCustomVariable(
  customVariable: {
    type: string
    value: string
  },
  shouldThrowException: boolean
): CampaignManager360ConversionCustomVariable {
  if (!customVariable.type || !customVariable.value) {
    throw new Error('Custom variable type and value are required.')
  }

  const typeRegex = /^U(\d{1,3})$/i
  if (!typeRegex.test(customVariable.type)) {
    throw new Error('Custom variable type must be in the format U<index> where index is a number between 1 and 100.')
  }

  const typeMatches = customVariable.type.matchAll(typeRegex)
  for (const match of typeMatches) {
    const index = parseInt(match[1])
    if (index < 1 || index > 100) {
      if (shouldThrowException) {
        throw new Error(
          'Invalid custom variable type index. custom variable type index must be a number between 1 and 100.'
        )
      } else {
        // TODO: Log the error here.
        continue
      }
    }
  }

  return {
    type: customVariable.type.toUpperCase() as CampaignManager360CustomFloodlightVariableType,
    value: customVariable.value,
    kind: 'dfareporting#customFloodlightVariable'
  }
}
