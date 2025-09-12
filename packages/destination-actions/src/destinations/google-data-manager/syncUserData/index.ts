import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { ingestAudienceMembers } from '../functions'
import {
  batch_size,
  countryCode,
  emailAddress,
  enable_batching,
  external_id,
  familyName,
  givenName,
  phoneNumber,
  postalCode
} from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync User Data',
  description: 'Uploads a list of AudienceMember User Data resources to the provided Destination.',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields: {
    emailAddress: { ...emailAddress },
    phoneNumber: { ...phoneNumber },
    givenName: { ...givenName },
    familyName: { ...familyName },
    regionCode: { ...countryCode },
    postalCode: { ...postalCode },
    audienceId: { ...external_id },
    enable_batching: { ...enable_batching },
    batch_size: { ...batch_size }
  },

  perform: async (request, { settings, payload, audienceSettings, auth }) => {
    return await ingestAudienceMembers(request, settings, [payload], audienceSettings, auth)
  },

  performBatch: async (request, { settings, payload, audienceSettings, auth }) => {
    return await ingestAudienceMembers(request, settings, payload, audienceSettings, auth)
  }
}
export default action
