import type { RequestClient } from '@segment/actions-core'
import type { Payload } from './generated-types'

import { CONSTANTS } from '../constants'
/**
 * CustomAudienceOperation is a custom type to encapsulates the request body params
 * for inserting/updating custom audience list in rokt data platform
 * @action [include, exclude]
 * @list custome audience name ( or list ) in rokt data platform
 * @emails list of user emails to be included/excluded from custom audience list
 */
type CustomAudienceOperation = {
  action: string
  list: string
  emails: string[]
}

/**
 * getCustomAudienceOperations parses event payloads from segment to convert to request object for rokt api
 * @payload payload of events
 */

const getCustomAudienceOperations = (payload: Payload[]): CustomAudienceOperation[] => {
  let custom_audience_list = ''
  const action_map = new Map<string, string[]>([
    [CONSTANTS.INCLUDE, []],
    [CONSTANTS.EXCLUDE, []]
  ])

  for (const p of payload) {
    if (p.segment_computation_action != CONSTANTS.SUPPORTED_SEGMENT_COMPUTATION_ACTION) {
      // ignore event
      continue
    }
    if (!custom_audience_list) {
      // set audience name to be processed for sending to rokt
      custom_audience_list = p.custom_audience_name
    }
    if (p.custom_audience_name != custom_audience_list) {
      // this is edge case where a batch contains more than 1 audiences
      // for the 1st iteration we don't to handle the case of multiple audiences in same batch
      // so we have decided to ignore other audience name in the batch, once we have picked one to process
      continue
    }

    if (p.traits_or_props[custom_audience_list]) {
      // audience entered true, include email to list
      action_map.get(CONSTANTS.INCLUDE)?.push(p.email)
    } else {
      // exclude email from list
      action_map.get(CONSTANTS.EXCLUDE)?.push(p.email)
    }
  }

  // build operation request to be sent to rokt api
  const custom_audience_ops: CustomAudienceOperation[] = []
  action_map.forEach((value: string[], key: string) => {
    // key will include or exclude
    // vaulue will be emails to be included or excluded
    const custom_audience_op: CustomAudienceOperation = {
      list: custom_audience_list,
      action: key,
      emails: value
    }
    custom_audience_ops.push(custom_audience_op)
  })
  return custom_audience_ops
}

/**
 * Takes an array of events of type Payload, decides whether event is meant for include/exclude action of rokt api
 * and then pushes the event to proper list to build request body.
 * @param request request object used to perform HTTP calls
 * @param events array of events containing Rokt custom audience details
 */
async function processPayload(request: RequestClient, events: Payload[]) {
  const custom_audience_ops: CustomAudienceOperation[] = getCustomAudienceOperations(events)
  const promises = []

  for (const op of custom_audience_ops) {
    if (op.emails.length > 0) {
      // if emails are present for action, send to rokt. Push to list of promises
      // There will be max 2 promies for 2 http reuests ( include & exclude actions )
      promises.push(
        request(CONSTANTS.ROKT_API_BASE_URL + CONSTANTS.ROKT_API_CUSTOM_AUDIENCE_ENDPOINT, {
          method: 'POST',
          json: op
        })
      )
    }
  }

  return await Promise.all(promises)
}

export { processPayload }
