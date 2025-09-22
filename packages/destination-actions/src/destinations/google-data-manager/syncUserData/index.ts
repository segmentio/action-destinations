import { ActionDefinition } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { syncAudienceMembers } from '../functions'
import {
  batch_size,
  countryCode,
  emailAddress,
  enable_batching,
  event_name,
  external_id,
  familyName,
  givenName,
  phoneNumber,
  postalCode
} from '../properties'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
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
    batch_size: { ...batch_size },
    event_name: { ...event_name }
  },

  perform: async (request, { payload, audienceSettings }) => {
    return await syncAudienceMembers(request, [payload], audienceSettings as AudienceSettings)
  },

  performBatch: async (request, { payload, audienceSettings }) => {
    return await syncAudienceMembers(request, payload, audienceSettings as AudienceSettings)
  }
}
export default action
