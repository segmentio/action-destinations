import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields, retlHookInputFields, retlHookOutputTypes } from './fields'
import { send } from './functions'
import { performHook } from './hook-functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync data to Facebook Custom Audiences.',
  defaultSubscription: 'type = "track" or type = "identify"',
  hooks: {
    retlOnMappingSave: {
      label: 'Select or create an audience in Facebook',
      description:
        'When saving this mapping, Segment will either create a new audience in Facebook or connect to an existing one. To create a new audience, enter the name of the audience. To connect to an existing audience, select the audience ID from the dropdown.',
      inputFields: retlHookInputFields,
      outputTypes: retlHookOutputTypes,
      performHook: async (request, { settings, hookInputs }) => {
        const { operation, audienceName, existingAudienceId } = hookInputs
        const { retlAdAccountId: adAccountId } = settings

        return await performHook(
          request,
          adAccountId,
          operation as string | undefined,
          audienceName as string | undefined,
          existingAudienceId as string | undefined
        )
      }
    }
  },
  syncMode: {
    label: 'Sync Mode',
    description: 'Define how the records will be synced to Facebook Custom Audiences.',
    default: 'mirror',
    choices: [
      { value: 'mirror', label: 'Mirror' },
      { value: 'upsert', label: 'Upsert' },
      { value: 'delete', label: 'Delete' }
    ]
  },
  fields,
  perform: async (request, { payload, audienceMembership, hookOutputs, features, statsContext }) => {
    await sendToSegment({ isBatch: false, payload, audienceMembership, hookOutputs, features: features })
    return await send(
      request, [payload], false, [audienceMembership],
      hookOutputs as { retlOnMappingSave?: { outputs?: { audienceId?: string } } },
      features, statsContext
    )
  },
  performBatch: async ( request, { payload, audienceMembership, hookOutputs, features, statsContext }) => {    
    await sendToSegment({ isBatch: true, payload, audienceMembership, hookOutputs, features: features })
    return await send(
      request, payload, true, audienceMembership,
      hookOutputs as { retlOnMappingSave?: { outputs?: { audienceId?: string } } },
      features, statsContext
    )
  }
}


export async function sendToSegment(json: Record<string, unknown>) {
  const writeKey = 'Urh471CNdqwe3JC73GfWTGctY9EViSGX'
  await fetch('https://api.segment.io/v1/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Basic ${Buffer.from(`${writeKey}:`).toString('base64')}`
    },
    body: JSON.stringify({
      writeKey,
      anonymousId: 'fb-custom-functions-debug',
      event: json.source
        ? `FB sync ${json.source} debug`
        : json.isBatch
        ? 'FB sync performBatch debug'
        : 'FB sync perform debug',
      properties: json,
      timestamp: new Date().toISOString()
    })
  })
}


export default action