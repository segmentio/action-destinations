import { DestinationDefinition } from '@segment/actions-core'
import { enchargeRestAPIBase } from './utils'
import type { Settings } from './generated-types'

export const deleteUser: DestinationDefinition<Settings>['onDelete'] = async (request, { payload }) => {
  // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  // provided in the payload.
  const userId = payload.userId
  const segmentAnonymousId = payload.anonymousId
  let query = ''
  if (userId) {
    query = `people[0][userId]=${userId}`
  } else if (segmentAnonymousId) {
    query = `people[0][segmentAnonymousId]=${segmentAnonymousId}`
  } else {
    // If we don't have a userId or anonymousId, we can't ID the user
    return true
  }
  return request(`${enchargeRestAPIBase}/v1/people?${query}`, {
    method: 'DELETE'
  })
}
