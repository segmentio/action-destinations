import type { RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { CONSTANTS } from '../constants'
/**
 * CustomAudienceOperation is a custom type to encapsulate the request body params
 * for inserting/updating custom audience list in Rokt data platform
 * @accountid the Rokt account
 * @action [include, exclude]
 * @list custom audience name ( or list ) in Rokt data platform
 * @emails list of user emails to be included/excluded from custom audience list
 */
type CustomAudienceOperation = {
  accountId: string
  action: string
  list: string
  emails: string[]
  sha256s: string[]
}

/**
 * getCustomAudienceOperations parses event payloads from segment to convert to request object for Rokt api.
 * Each audience receives its own pair of include and exclude lists.
 * @payload payload of events
 */
const getCustomAudienceOperations = (payload: Payload[], settings: Settings): CustomAudienceOperation[] => {
  let is_hashed = false

  // map to handle different audiences in the batch
  // this will contain audience_name=>[action=>emails]
  const audience_map = new Map<string, Map<string, string[]>>([])
  for (const p of payload) {
    if (p.segment_computation_action != CONSTANTS.SUPPORTED_SEGMENT_COMPUTATION_ACTION) {
      // ignore event
      continue
    }

    let action_map = new Map<string, string[]>([
      [CONSTANTS.INCLUDE, []],
      [CONSTANTS.EXCLUDE, []]
    ])

    // check if we have already saved this audience in map
    const existing_action_map_for_audience = audience_map.get(p.custom_audience_name)
    if (existing_action_map_for_audience !== undefined) {
      // use existing map for audience, to include/exclude new email
      action_map = existing_action_map_for_audience
    } else {
      // if audience is not in map, add it to the map
      audience_map.set(p.custom_audience_name, action_map)
    }

    if (p.traits_or_props[p.custom_audience_name] === true) {
      // audience entered 'true', include email or hashed email from list
      if (p.email_sha256 !== undefined) {
        action_map.get(CONSTANTS.INCLUDE)?.push(p.email_sha256)
        is_hashed = true
      } else {
        if (p.email !== undefined) {
          action_map.get(CONSTANTS.INCLUDE)?.push(p.email)
        }
      }
    } else if (p.traits_or_props[p.custom_audience_name] === false) {
      // audience entered 'false', exclude email or hashed email from list
      if (p.email_sha256 !== undefined) {
        action_map.get(CONSTANTS.EXCLUDE)?.push(p.email_sha256)
        is_hashed = true
      } else {
        if (p.email !== undefined) {
          action_map.get(CONSTANTS.EXCLUDE)?.push(p.email)
        }
      }
    }
  }

  // build operation request to be sent to Rokt api
  const custom_audience_ops: CustomAudienceOperation[] = []

  audience_map.forEach((action_map_values: Map<string, string[]>, list: string) => {
    // key will be audience list
    // value will map of action=>email_list
    action_map_values.forEach((emails: string[], action: string) => {
      let custom_audience_op: CustomAudienceOperation
      if (is_hashed) {
        custom_audience_op = {
          accountId: settings.accountid,
          list: list,
          action: action,
          emails: [],
          sha256s: emails
        }
      } else {
        custom_audience_op = {
          accountId: settings.accountid,
          list: list,
          action: action,
          emails: emails,
          sha256s: []
        }
      }

      custom_audience_ops.push(custom_audience_op)
    })
  })
  return custom_audience_ops
}

/**
 * Takes an array of events of type Payload, decides whether event is meant for include/exclude action of Rokt api
 * and then pushes the event to proper list to build request body.
 * @param request request object used to perform HTTP calls
 * @param events array of events containing Rokt custom audience details
 */
async function processPayload(request: RequestClient, settings: Settings, events: Payload[]) {
  const custom_audience_ops: CustomAudienceOperation[] = getCustomAudienceOperations(events, settings)
  const promises = []

  for (const op of custom_audience_ops) {
    if (op.emails.length > 0 || op.sha256s.length > 0) {
      // if emails are present for action, send to Rokt. Push to list of promises
      // There will be max 2 promises for 2 http requests ( include & exclude actions )
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
