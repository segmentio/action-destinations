import { ActionHookDefinition } from '@segment/actions-core/destination-kit'
import { SEGMENT_PARTNER_NAME } from './constants'
import { EBNotErrors } from './constants'
import { HookError, HookSuccess } from './types'
import {
  EventBridgeClient,
  CreatePartnerEventSourceCommand,
  ListPartnerEventSourcesCommand
} from '@aws-sdk/client-eventbridge'
import { Settings } from '../generated-types'
import type { OnMappingSaveInputs, OnMappingSaveOutputs, Payload } from './generated-types'

export const ensureSourceIdHook: ActionHookDefinition<
  Settings,
  Payload,
  any,
  OnMappingSaveInputs,
  OnMappingSaveOutputs
> = {
  label: 'EnsureSourceId',
  description: 'Creates the Partner Event Source in Amazon EventBridge, if it does not already exist.',
  inputFields: {},
  performHook: async (_, { settings, subscriptionMetadata }) => {
    const validation = validate(settings, subscriptionMetadata)

    if ('error' in validation) {
      return validation
    }

    const { sourceId, region, accountId } = validation
    const client = new EventBridgeClient({ region })
    return await ensurePartnerSource(client, accountId, sourceId)
  },
  outputTypes: {
    sourceId: {
      label: 'Source ID',
      description: 'The identifier for the source.',
      type: 'string',
      required: true
    }
  }
}

function validate(
  settings: Settings,
  subscriptionMetadata: { sourceId?: string } | undefined
): HookError | { region: string; accountId: string; sourceId: string } {
  const sourceId = subscriptionMetadata?.sourceId
  const { region, accountId } = settings

  if (typeof sourceId !== 'string' || !sourceId) {
    return { error: { message: 'Source ID required', code: 'ERROR' } }
  }

  if (typeof region !== 'string' || !region) {
    return {
      error: {
        message:
          "Hook call to ensure Source ID failed. Region required. Ensure 'AWS Region' Settings field is populated.",
        code: 'ERROR'
      }
    }
  }

  if (typeof accountId !== 'string' || !accountId) {
    return {
      error: {
        message:
          "Hook call to ensure Source ID failed. Account ID required. Ensure 'AWS Account ID' Settings field is populated.",
        code: 'ERROR'
      }
    }
  }

  return { sourceId, region, accountId }
}

export async function ensurePartnerSource(
  client: EventBridgeClient,
  awsAccountId: string,
  sourceId: string
): Promise<HookSuccess | HookError> {
  let hookResponse = await findSource(client, sourceId)

  if (hookResponse === undefined) {
    hookResponse = await createSource(client, awsAccountId, sourceId)
  }

  return hookResponse
}

async function findSource(client: EventBridgeClient, sourceId: string): Promise<HookSuccess | HookError | undefined> {
  try {
    const command = new ListPartnerEventSourcesCommand({ NamePrefix: getFullSourceName(sourceId) })
    const response = await client.send(command)
    return (response.PartnerEventSources?.length ?? 0) > 0
      ? {
          successMessage: 'SourceId found',
          savedData: {
            sourceId
          }
        }
      : undefined
  } catch (error) {
    return returnError(error, 'findSource')
  }
}

async function createSource(
  client: EventBridgeClient,
  accountId: string,
  sourceId: string
): Promise<HookSuccess | HookError> {
  const fullSourceName = getFullSourceName(sourceId)
  const command = new CreatePartnerEventSourceCommand({ Account: accountId, Name: fullSourceName })
  try {
    await client.send(command)
  } catch (error) {
    if (isAnError(error)) {
      return returnError(error, `createSource(${fullSourceName})`)
    }
  }
  return {
    successMessage: 'SourceId created',
    savedData: {
      sourceId
    }
  }
}

export function getFullSourceName(sourceId: string): string {
  return `${SEGMENT_PARTNER_NAME}/${sourceId}`
}

function isAnError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const err = error as { name: string }
    return !(err.name in EBNotErrors)
  }
  return true
}

function returnError(error: unknown, context: string): HookError {
  return {
    error: {
      message: `Hook error: ${context}: ${JSON.stringify(error)}`,
      code: 'ERROR'
    }
  }
}
