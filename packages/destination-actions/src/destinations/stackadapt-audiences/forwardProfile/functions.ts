import { RequestClient } from '@segment/actions-core'
import { Payload } from './generated-types'

export async function performForwardProfiles(request: RequestClient, events: Payload[]) {
  // TODO: switch to production endpoint
  const endpoint = 'https://sandbox.stackadapt.com/public/graphql'
  const profileUpdates = events.map((event) => {
    const profile: Record<string, string | number | undefined> = {
      user_id: event.user_id
    }
    if (event.segment_computation_class === 'audience' && event.traits && event.segment_computation_key) {
      // This is an audience enter/exit event, there should be a boolean flag in the traits indicating if the user entered or exited the audience
      // We need to translate it into an enter or exit action as expected by the profile upsert GraphQL mutation
      profile.audience_id = event.segment_computation_id
      const audienceKey = event.segment_computation_key
      profile.audience_name = audienceKey
      profile.action = event.traits[audienceKey] ? 'enter' : 'exit'
      delete event.traits[audienceKey] // Don't need to include the boolean flag in the GQL payload
    }
    return { ...event.traits, ...profile }
  })

  // TODO: Add setting for advertiser ID and replace hardcoded value with it
  const mutation = `mutation {
      upsertProfiles(
        subAdvertiserId: 1,
        externalProvider: "Segment",
        profiles: ${JSON.stringify(profileUpdates).replace(/"([^"]+)":/g, '$1:') /* Remove quotes around keys */}
      ) {
        success
      }
    }`
  return await request(endpoint, {
    body: JSON.stringify({ query: mutation })
  })
}
