import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { buildUpdateConversionBatchPayload } from './functions'
import { refreshGoogleAccessToken } from '../common-functions'
import { campaignManager360CommonFields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Conversion Adjustment Upload',
  description: "Inserts a conversion into Campaign Manager 360's profile configured under Settings.",
  fields: campaignManager360CommonFields,
  // https://developers.google.com/doubleclick-advertisers/rest/v4/conversions/batchupdate
  perform: async (request, { settings, payload }) => {
    const conversionsBatchUpdateRequest = buildUpdateConversionBatchPayload([payload], settings)
    const bearerToken = await refreshGoogleAccessToken(request, settings)

    const response = await request(
      `https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${settings.profileId}/conversions/batchupdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
          Host: 'dfareporting.googleapis.com'
        },
        json: conversionsBatchUpdateRequest
      }
    )
    return response
  },
  // https://developers.google.com/doubleclick-advertisers/rest/v4/conversions/batchupdate
  performBatch: async (request, { settings, payload }) => {
    const conversionsBatchUpdateRequest = buildUpdateConversionBatchPayload(payload, settings)
    const bearerToken = await refreshGoogleAccessToken(request, settings)

    const response = await request(
      `https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${settings.profileId}/conversions/batchupdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
          Host: 'dfareporting.googleapis.com'
        },
        json: conversionsBatchUpdateRequest
      }
    )
    return response
  }
}

export default action
