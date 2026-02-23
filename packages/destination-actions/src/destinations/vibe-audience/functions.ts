import { RequestClient } from '@segment/actions-core'
import { Payload } from './sync/generated-types'
import { Settings } from './generated-types'
import { API_VERSION, BASE_URL } from './constants'
import { RequestJSON, Profile } from './types'

export async function syncAudience(request: RequestClient, payloads: Payload[], settings: Settings) {
  const { audience_id, audience_name } = payloads[0]
  const { advertiserId } = settings

  const addEmails: Profile[] = []
  const removeEmails: Profile[] = []

  payloads.forEach((payload) => {
    const action = payload.traits_or_props[payload.audience_name] as boolean
    const profileDetails = payload.personal_information ?? undefined

    if (action) {
      addEmails.push({ email: payload.email, profileDetails })
    } else {
      removeEmails.push({ email: payload.email, profileDetails })
    }
  })

  const json: RequestJSON = {
    advertiserId,
    audienceId: audience_id,
    audienceName: audience_name,
    addProfiles: addEmails,
    removeProfiles: removeEmails
  }

  return await request(`${BASE_URL}/${API_VERSION}/webhooks/twilio/audience/sync`, {
    method: 'post',
    json
  })
}
