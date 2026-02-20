import { Region, CreateAudienceJSON, CreateAudienceResponse } from './types'
import { RequestClient, IntegrationError } from '@segment/actions-core'
import { Settings } from './generated-types'
import { endpoints } from './constants'

export function getEndpointByRegion(endpoint: keyof typeof endpoints, region?: string): string {
  return endpoints[endpoint][region as Region] ?? endpoints[endpoint]['north_america']
}

export async function createAudience(request: RequestClient, settings: Settings, name: string, owner_email?: string): Promise<string> {
  const { 
    endpoint,
    app_id,
    owner_email: default_owner_email
  } = settings

  if (!name) {
    throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
  }
  
  const url = getEndpointByRegion('cohorts_upload', endpoint)
  
  const json: CreateAudienceJSON = {
    name,
    app_id,
    id_type: 'BY_USER_ID',
    ids: [],
    owner: owner_email ?? default_owner_email,
    published: true
  }

  const response = await request<CreateAudienceResponse>(url, {
    method: 'post',
    json
  })

  const r = await response.json()
  const id = r.cohortId

  if (!id) {
    throw new IntegrationError('Invalid response from Amplitude Cohorts API when attempting to create new Cohort: Missing cohortId', 'INVALID_RESPONSE', 500)
  }
  return id
}

export async function getAudience(request: RequestClient, settings: Settings, externalId: string): Promise<void> {
  const { 
    endpoint
  } = settings

  const url = `${getEndpointByRegion('cohorts_get_one', endpoint)}/${externalId}`
  const response = await request<CreateAudienceResponse>(url)
  const r = await response.json()
  const id = r.cohortId
  
  if(!id) {
    throw new IntegrationError('Invalid response from Amplitude Cohorts API when attempting to get Cohort: Missing cohortId', 'INVALID_RESPONSE', 500)
  }

  if(id !== externalId) {
    throw new IntegrationError(`Cohort with id ${externalId} not found`, 'COHORT_NOT_FOUND', 404)
  }
}