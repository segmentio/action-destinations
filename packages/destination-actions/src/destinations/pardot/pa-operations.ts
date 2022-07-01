import { RequestClient } from '@segment/actions-core'
import type { ProspectsType } from './pa-type'

export const API_VERSION = 'v5'

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

  upsertRecord = async (email: string, prospect: ProspectsType, secondaryDeletedSearch = true) => {
    return this.request<ProspectUpsertResponseData>(
      `${this.baseUrl}/api/${API_VERSION}/prospects/do/upsertLatestByEmail`,
      {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          matchEmail: email,
          prospect: prospect,
          secondaryDeletedSearch: secondaryDeletedSearch
        }
      }
    )
  }
}
