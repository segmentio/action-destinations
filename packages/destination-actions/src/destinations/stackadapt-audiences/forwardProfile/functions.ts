import { RequestClient } from '@segment/actions-core'
import { Payload } from './generated-types'
import { domain } from '..'

export async function performForwardProfiles(request: RequestClient, events: Payload[]) {
  const advertiserId = events[0].advertiser_id
  const profileUpdates = events.map((event) => {
    const profile: Record<string, string | number | undefined> = {
      userId: event.user_id
    }
    if (event.event_type === 'alias') {
      profile.previousId = event.previous_id
    } else if (event.segment_computation_class === 'audience' && event.traits && event.segment_computation_key) {
      // This is an audience enter/exit event, there should be a boolean flag in the traits indicating if the user entered or exited the audience
      // We need to translate it into an enter or exit action as expected by the profile upsert GraphQL mutation
      profile.audienceId = event.segment_computation_id
      const audienceKey = event.segment_computation_key
      profile.audienceName = audienceKey
      profile.action = event.traits[audienceKey] ? 'enter' : 'exit'
      delete event.traits[audienceKey] // Don't need to include the boolean flag in the GQL payload
    }
    // Convert trait keys to camelCase
    const traits = Object.keys(event?.traits ?? {}).reduce((acc: Record<string, unknown>, key) => {
      acc[toCamelCase(key)] = event?.traits?.[key]
      return acc
    }, {})
    return { ...traits, ...profile }
  })

  // TODO: Add setting for advertiser ID and replace hardcoded value with it
  const mutation = `mutation {
      upsertProfiles(
        subAdvertiserId: ${advertiserId},
        externalProvider: "segmentio",
        profiles: ${JSON.stringify(profileUpdates).replace(/"([^"]+)":/g, '$1:') /* Remove quotes around keys */}
      ) {
        success
      }
    }`
  return await request(domain, {
    body: JSON.stringify({ query: mutation })
  })
}

// From https://www.30secondsofcode.org/js/s/string-case-conversion/
function toCamelCase(str: string) {
  const s = str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map((x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())
    .join('')
  return s ? s.slice(0, 1).toLowerCase() + s.slice(1) : ''
}
