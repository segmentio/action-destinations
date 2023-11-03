import { IntegrationError, RequestClient, PayloadValidationError, ModifiedResponse } from '@segment/actions-core'
import { createHash } from 'crypto'
import { TikTokAudiences } from './api'
import { Payload as AddUserPayload } from './addUser/generated-types'
import { Payload as AddToAudiencePayload } from './addToAudience/generated-types'
import { Payload as RemoveUserPayload } from './removeUser/generated-types'
import { Payload as CreateAudiencePayload } from './createAudience/generated-types'
import { Settings } from './generated-types'
import { CreateAudienceAPIResponse } from './types'
import { AudienceSettings } from './generated-types'

type LegacyPayload = AddUserPayload | RemoveUserPayload
type GenericPayload = LegacyPayload | AddToAudiencePayload
type GenericSettings = Settings | AudienceSettings

export async function processPayload(
  request: RequestClient,
  settings: GenericSettings,
  payloads: GenericPayload[],
  action: string
) {
  validate(payloads)
  let selected_advertiser_id

  // TODO: Remove on cleanup
  let advertiser_ids
  const isNativeFlow = 'advertiserId' in settings
  if (isNativeFlow) {
    settings = settings as AudienceSettings
    selected_advertiser_id = settings.advertiserId
    advertiser_ids = [selected_advertiser_id]
  } else {
    settings = settings as Settings
    const legacyPayload = payloads[0]

    if ('selected_advertiser_id' in legacyPayload) {
      selected_advertiser_id = legacyPayload.selected_advertiser_id
    }
    advertiser_ids = settings.advertiser_ids
  }

  const id_schema = getIDSchema(payloads[0])
  const TikTokApiClient: TikTokAudiences = new TikTokAudiences(request, selected_advertiser_id)

  const users = extractUsers(payloads)

  let res
  if (users.length > 0) {
    const elements = {
      advertiser_ids: advertiser_ids,
      action: action,
      id_schema: id_schema,
      batch_data: users
    }
    res = await TikTokApiClient.batchUpdate(elements)
  } else {
    throw new PayloadValidationError('At least one of Email Id or Advertising ID must be provided.')
  }

  return res
}

export async function createAudience(
  request: RequestClient,
  payload: CreateAudiencePayload
): Promise<ModifiedResponse<CreateAudienceAPIResponse>> {
  const TikTokApiClient: TikTokAudiences = new TikTokAudiences(request, payload.selected_advertiser_id)
  return TikTokApiClient.createAudience(payload)
}

export function validate(payloads: GenericPayload[]): void {
  if (payloads[0].send_email === false && payloads[0].send_advertising_id === false) {
    throw new IntegrationError(
      'At least one of `Send Email`, or `Send Advertising ID` must be set to `true`.',
      'INVALID_SETTINGS',
      400
    )
  }
}

// Even if email and advertising_id are empty we want to include them into the array
// as we seek to comply with the ID Schema defined outside of this function.
export function getIDSchema(payload: GenericPayload): string[] {
  const id_schema = []
  if (payload.send_email === true) {
    id_schema.push('EMAIL_SHA256')
  }
  if (payload.send_advertising_id === true) {
    id_schema.push('IDFA_SHA256')
  }

  return id_schema
}

export function extractUsers(payloads: GenericPayload[]): {}[][] {
  const batch_data: {}[][] = []

  payloads.forEach((payload: GenericPayload) => {
    if (!payload.email && !payload.advertising_id) {
      return
    }

    const user_ids: {}[] = []
    let external_audience_id

    // TODO: Remove on cleanup
    if ('external_audience_id' in payload) {
      external_audience_id = payload.external_audience_id
    }

    if ('audience_id' in payload && !external_audience_id) {
      external_audience_id = payload.audience_id
    }

    if (payload.send_email === true) {
      let email_id = {}
      if (payload.email) {
        payload.email = payload.email
          .replace(/\+.*@/, '@')
          .replace(/\.(?=.*@)/g, '')
          .toLowerCase()
        email_id = {
          id: createHash('sha256').update(payload.email).digest('hex'),
          audience_ids: [external_audience_id]
        }
      }
      user_ids.push(email_id)
    }

    if (payload.send_advertising_id === true) {
      let advertising_id = {}
      if (payload.advertising_id) {
        advertising_id = {
          id: createHash('sha256').update(payload.advertising_id).digest('hex'),
          audience_ids: [external_audience_id]
        }
      }
      user_ids.push(advertising_id)
    }

    batch_data.push(user_ids)
  })
  return batch_data
}
