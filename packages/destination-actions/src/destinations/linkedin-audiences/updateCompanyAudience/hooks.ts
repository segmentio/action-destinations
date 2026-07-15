import { ActionHookDefinition } from '@segment/actions-core/destination-kit'
import { IntegrationError, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload, RetlOnMappingSaveInputs, RetlOnMappingSaveOutputs } from './generated-types'
import { LinkedInAudiences } from '../api'
import { SEGMENT_TYPES } from './constants'
import type { DMPSegment, CompanyHookInputs, CompanyHookResult } from './types'

export async function getCompanyAudiences(request: RequestClient, settings: Settings) {
  const linkedinApiClient = new LinkedInAudiences(request)
  try {
    const response = await linkedinApiClient.listDmpSegmentsByAccount(settings)
    const choices = (response.data?.elements ?? [])
      .filter((segment: DMPSegment) => segment.type === SEGMENT_TYPES.COMPANY)
      .map((segment: DMPSegment) => ({ value: String(segment.id), label: segment.name }))
    return { choices }
  } catch (err) {
    return {
      choices: [],
      nextPage: '',
      error: {
        message: (err as IntegrationError).message ?? 'Unknown error',
        code: (err as IntegrationError).code ?? '500'
      }
    }
  }
}

export async function performCompanyHook(
  request: RequestClient,
  settings: Settings,
  hookInputs: CompanyHookInputs
): Promise<CompanyHookResult> {
  const linkedinApiClient = new LinkedInAudiences(request)

  if (hookInputs.existing_audience_id) {
    try {
      const response = await linkedinApiClient.getDmpSegmentById(hookInputs.existing_audience_id)
      const { id, name, type } = response.data ?? {}
      if (!id || type !== SEGMENT_TYPES.COMPANY) {
        return {
          error: {
            message: `The selected DMP Segment (id: ${hookInputs.existing_audience_id}) is of type '${
              type ?? 'unknown'
            }' and cannot be used as a Company Audience. Please select a COMPANY segment.`,
            code: 'INVALID_SEGMENT_TYPE'
          }
        }
      }
      return {
        successMessage: `Using existing Company Audience '${name}' (id: ${id}).`,
        savedData: { id, name }
      }
    } catch (e) {
      return {
        error: {
          message: (e as IntegrationError).message || 'Failed to fetch the selected Company Audience.',
          code: (e as IntegrationError).code || 'GET_SEGMENT_FAILURE'
        }
      }
    }
  }

  if (!hookInputs.segment_creation_name) {
    return {
      error: {
        message: 'Provide a name to create a new Company Audience, or select an existing one.',
        code: 'MISSING_SEGMENT_NAME'
      }
    }
  }

  try {
    const response = await linkedinApiClient.createCompanyDmpSegment(settings, hookInputs.segment_creation_name)
    // LinkedIn returns the new segment id in the x-restli-id response header, not the body.
    const id = response.headers?.get('x-restli-id') ?? ''
    if (!id) {
      return {
        error: {
          message: 'LinkedIn did not return an id for the newly created Company Audience.',
          code: 'CREATE_SEGMENT_FAILURE'
        }
      }
    }
    return {
      successMessage: `Company Audience '${hookInputs.segment_creation_name}' (id: ${id}) created successfully!`,
      savedData: { id, name: hookInputs.segment_creation_name }
    }
  } catch (e) {
    return {
      error: {
        message: (e as IntegrationError).message || 'Failed to create the Company Audience.',
        code: (e as IntegrationError).code || 'CREATE_SEGMENT_FAILURE'
      }
    }
  }
}

export const companyAudienceHook: ActionHookDefinition<
  Settings,
  Payload,
  undefined,
  RetlOnMappingSaveInputs,
  RetlOnMappingSaveOutputs
> = {
  label: 'Connect to a LinkedIn Company Audience',
  description:
    'When saving this mapping, we will create a new LinkedIn DMP Company Segment, or connect to an existing one that you select.',
  inputFields: {
    existing_audience_id: {
      label: 'Existing Company Audience',
      description:
        'Select an existing LinkedIn DMP Company Segment to sync to. If provided, a new audience will not be created.',
      type: 'string',
      dynamic: async (request, { settings }) => {
        return await getCompanyAudiences(request, settings)
      }
    },
    segment_creation_name: {
      label: 'New Company Audience Name',
      description:
        'The name of the LinkedIn DMP Company Segment to create. Only used when an existing audience is not selected above.',
      type: 'string'
    }
  },
  outputTypes: {
    id: {
      label: 'ID',
      description: 'The ID of the LinkedIn DMP Company Segment that companies will be synced to.',
      type: 'string',
      required: false
    },
    name: {
      label: 'Name',
      description: 'The name of the LinkedIn DMP Company Segment that companies will be synced to.',
      type: 'string',
      required: false
    }
  },
  performHook: async (request, { settings, hookInputs }) => {
    return await performCompanyHook(request, settings, hookInputs ?? {})
  }
}
