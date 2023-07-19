import type { RequestClient } from '@segment/actions-core'
import type { Payload } from './generated-types'

import { CONSTANTS } from '../constants'
import { Settings } from '../generated-types'

type AudienceBatch = {
  environmentId: string
  batch: AudienceBatchItem[]
}

type AudienceName = string

type AudienceBatchItem = {
  userId: string
  cohortName: AudienceName
  cohortId: string
  value: boolean
}

/**
 *
 * @param key snake-cased Audience key
 * @returns sentence cased version of the Audience key (used for the LaunchDarkly Segment name)
 */
const snakeCaseToSentenceCase = (key: string) => {
  return (key.charAt(0).toUpperCase() + key.slice(1)).replace(/_/g, ' ')
}

/**
 * Creates a context payload that can be consumed by LaunchDarkly's segment targeting api
 * @param contextKey contextKey Context key
 * @param audienceId audience id
 * @param include include or exclude the context from LaunchDarkly's segment
 */
const createContextForBatch = (contextKey: string, audienceId: string, include: boolean) => ({
  userId: contextKey,
  cohortName: snakeCaseToSentenceCase(audienceId),
  cohortId: audienceId,
  value: include
})

/**
 * getCustomAudienceOperations parses event payloads from Segment to convert to request object for launchdarkly api
 * @param payload payload of events
 * @param settings user configured settings
 */

const parseCustomAudienceBatches = (payload: Payload[], settings: Settings): AudienceBatch[] => {
  // map to handle different audiences in the batch
  const audienceMap = new Map<AudienceName, AudienceBatch>()

  for (const p of payload) {
    if (p.segment_computation_action !== CONSTANTS.SUPPORTED_SEGMENT_COMPUTATION_ACTION) {
      // ignore event
      continue
    }

    const contextKey = p.context_key
    const audienceId = p.custom_audience_name
    const traitsOrProps = p.traits_or_props
    const environmentId = settings.clientId

    let audienceBatch: AudienceBatch = {
      environmentId,
      batch: []
    }

    // check if we have already saved this audience in map
    const existingBatchForAudience = audienceMap.get(audienceId)
    if (existingBatchForAudience) {
      // use existing map for audience, to include/exclude new email
      audienceBatch = existingBatchForAudience
    } else {
      // if audience is not in map, add it to the map
      audienceMap.set(audienceId, audienceBatch)
    }

    if (traitsOrProps[audienceId] === true) {
      // audience entered 'true', include email to list
      audienceBatch.batch.push(createContextForBatch(contextKey, audienceId, true))
    } else if (traitsOrProps[audienceId] === false) {
      // audience entered 'false', exclude email from list
      audienceBatch.batch.push(createContextForBatch(contextKey, audienceId, false))
    }
  }

  return Array.from(audienceMap.values())
}

/**
 * Takes an array of events of type Payload, decides whether event should be included or excluded from LaunchDarkly's segment
 * and then pushes the event to proper list to build request body.
 * @param request request object used to perform HTTP calls
 * @param settings user configured settings
 * @param events array of events containing LaunchDarkly segment details
 */
async function processPayload(request: RequestClient, settings: Settings, events: Payload[]) {
  const audienceBatches: AudienceBatch[] = parseCustomAudienceBatches(events, settings)
  const promises = []

  for (const batch of audienceBatches) {
    if (batch.batch.length === 0) {
      continue
    }
    const ldRequest = request(CONSTANTS.LD_API_BASE_URL + CONSTANTS.LD_API_CUSTOM_AUDIENCE_ENDPOINT, {
      method: 'POST',
      json: batch
    })
    promises.push(ldRequest)
  }

  return await Promise.all(promises)
}

export { processPayload }
