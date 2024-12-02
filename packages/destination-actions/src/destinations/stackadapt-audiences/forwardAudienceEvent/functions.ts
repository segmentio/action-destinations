import { RequestClient } from '@segment/actions-core'
import { Payload } from './generated-types'
import { GQL_ENDPOINT, sha256hash, stringifyJsonWithEscapedQuotes } from '../functions'

const EXTERNAL_PROVIDER = 'segmentio'

const audienceMapping = stringifyJsonWithEscapedQuotes([
  {
    incoming_key: 'audienceId',
    destination_key: 'external_id',
    type: 'string',
    label: 'External Audience ID'
  },
  {
    incoming_key: 'audienceName',
    destination_key: 'name',
    type: 'string',
    label: 'External Audience Name'
  }
])

const profileMapping = stringifyJsonWithEscapedQuotes([
  {
    incoming_key: 'userId',
    destination_key: 'external_id',
    type: 'string',
    is_pii: false,
    label: 'External Profile ID'
  }
])

export async function performForwardAudienceEvents(request: RequestClient, events: Payload[]) {
  const advertiserId = events[0].advertiser_id
  const profileUpdates = events.map((event) => {
    const { segment_computation_key: audienceKey, segment_computation_id: audienceId, user_id, traits_or_props } = event

    const { [audienceKey]: action } = traits_or_props
    return {
      userId: user_id,
      audienceId,
      audienceName: audienceKey,
      action: action ? 'enter' : 'exit'
    }
  })

  const profiles = stringifyJsonWithEscapedQuotes(profileUpdates)
  const mutation = `mutation {
      upsertProfiles(
        input: {
          advertiserId: ${advertiserId},
          externalProvider: "${EXTERNAL_PROVIDER}",
          syncId: "${sha256hash(profiles)}",
          profiles: "${profiles}"
        }
      ) {
        userErrors {
          message
        }
      }
      upsertProfileMapping(
        input: {
          advertiserId: ${advertiserId},
          mappingSchema: "${profileMapping}",
          mappableType: "${EXTERNAL_PROVIDER}",
        }
      ) {
        userErrors {
          message
        }
      }
      upsertExternalAudienceMapping(
        input: {
          advertiserId: ${advertiserId},
          mappingSchema: "${audienceMapping}",
          mappableType: "${EXTERNAL_PROVIDER}"
        }
      ) {
        userErrors {
          message
        }
      }
    }`
  return await request(GQL_ENDPOINT, {
    body: JSON.stringify({ query: mutation })
  })
}