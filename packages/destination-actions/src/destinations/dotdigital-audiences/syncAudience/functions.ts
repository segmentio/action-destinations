import { PayloadValidationError, RequestClient } from '@segment/actions-core'
import { Payload } from './generated-types'
import { UpsertContactJSON, Identifiers, ChannelProperties, DataFields } from './types'
import { Settings } from '../generated-types'
import { DDDataFieldsApi } from '@segment/actions-shared/src/dotdigital/api'

export async function send(request: RequestClient, payload: Payload, settings: Settings) {
  const {
    computation_key,
    external_audience_id,
    emailIdentifier,
    mobileNumberIdentifier,
    traits_or_props, 
    dataFields
  } = payload
  
  const { api_host } = settings
  

  const action = traits_or_props[computation_key] as boolean

  const identifier = emailIdentifier ? 'email' : mobileNumberIdentifier ? 'mobileNumber' : null
  const value = emailIdentifier ?? mobileNumberIdentifier ?? null
  
  if (!identifier || !value) {
    throw new PayloadValidationError('At least one identifier (email or mobile number) must be provided.')
  }

  const numericAudienceId = Number(external_audience_id)
  if (isNaN(numericAudienceId)) {
    throw new PayloadValidationError('external_audience_id must be a numeric value.')
  }

  const url = `https://${settings.api_host}/contacts/v3/${identifier}/${value}`

  const identifiers: Identifiers = {
    ...(emailIdentifier && { email: emailIdentifier }),
    ...(mobileNumberIdentifier && { mobileNumber: mobileNumberIdentifier })
  }

  const channelProperties: ChannelProperties = {
    ...(emailIdentifier && {
      email: {
        status: 'subscribed',
        emailType: 'html',
        optInType: 'single'
      }
    }),
    ...(mobileNumberIdentifier && {
      sms: { status: 'subscribed' }
    })
  }

  const fieldsAPI = new DDDataFieldsApi(api_host, request)
  const validDataFields = await fieldsAPI.validateDataFields({dataFields})

  const json: UpsertContactJSON = {
    identifiers,
    channelProperties,
    lists: [numericAudienceId],
    ...( validDataFields && { dataFields: validDataFields as DataFields })
  }

  return request(
    url,
    {
      method: action ? 'PATCH' : 'DELETE',
      ...(action ? { json } : {})
    }
  )
}