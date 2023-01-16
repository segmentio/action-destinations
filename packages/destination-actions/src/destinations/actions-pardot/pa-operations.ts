import { RequestClient } from '@segment/actions-core'
import type { Payload as ProspectsPayload } from './prospects/generated-types'
import { ProspectsType } from './pa-type'

export const PARDOT_API_VERSION = 'v5'

interface ProspectUpsertResponseData {
  id: string
  email: string
}

export default class Pardot {
  businessUnitID: string
  baseUrl: string
  request: RequestClient

  constructor(businessUnitID: string, baseUrl: string, request: RequestClient) {
    this.businessUnitID = businessUnitID
    this.baseUrl = baseUrl
    this.request = request
  }

  upsertRecord = async (payload: ProspectsPayload) => {
    const prospect = this.buildProspectJSON(payload)

    return this.request<ProspectUpsertResponseData>(
      `${this.baseUrl}/api/${PARDOT_API_VERSION}/objects/prospects/do/upsertLatestByEmail`,
      {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          matchEmail: payload.email,
          prospect: prospect,
          secondaryDeletedSearch: payload.secondaryDeletedSearch
        }
      }
    )
  }

  private ProspectsShape = (payload: ProspectsPayload): ProspectsType => {
    return {
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      salutation: payload.salutation,
      phone: payload.phone,
      company: payload.company,
      jobTitle: payload.jobTitle,
      industry: payload.industry,
      city: payload.city,
      state: payload.state,
      zip: payload.zip,
      country: payload.country,
      website: payload.website
    }
  }

  private buildProspectJSON = (payload: ProspectsPayload) => {
    let baseShape = this.ProspectsShape(payload)

    if (payload.customFields) {
      baseShape = { ...baseShape, ...payload.customFields }
    }

    return baseShape
  }
}
