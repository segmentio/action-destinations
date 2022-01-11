import { IntegrationError, RequestClient } from '@segment/actions-core'

const API_VERSION = 'v53.0'

interface LookupResponse {
  data: {
    Id: string
    totalSize?: number
  }
}

export default class Salesforce {
  instanceUrl: string
  request: RequestClient

  constructor(instanceUrl: string, request: RequestClient) {
    this.instanceUrl = instanceUrl
    this.request = request
  }

  createRecord = async (payload: any, sobject: string) => {
    return this.request(`${this.instanceUrl}/services/data/${API_VERSION}/sobjects/${sobject}`, {
      method: 'post',
      json: {
        LastName: payload.last_name,
        Company: payload.company,
        FirstName: payload.first_name,
        State: payload.state,
        Street: payload.street,
        Country: payload.country,
        PostalCode: payload.postal_code,
        City: payload.city,
        Email: payload.email
      }
    })
  }

  updateRecord = async (payload: any, sobject: string) => {
    switch (payload.lookup_criteria) {
      case 'external_id': {
        const recordId = await this.lookupExternalId(payload.external_id_field, payload.external_id_value, sobject)
        await this.baseUpdate(recordId, sobject, payload)
        break
      }
      case 'trait': {
        const recordId = await this.lookupTraits(payload.trait_field, payload.trait_value, sobject)
        await this.baseUpdate(recordId, sobject, payload)
        break
      }
      case 'record_id':
        await this.baseUpdate(payload.record_id, sobject, payload)
        break
    }
  }

  private baseUpdate = async (recordId: string, sobject: string, payload: any) => {
    return this.request(`${this.instanceUrl}/services/data/${API_VERSION}/sobjects/${sobject}/${recordId}`, {
      method: 'patch',
      json: {
        LastName: payload.last_name,
        Company: payload.company,
        FirstName: payload.first_name,
        State: payload.state,
        Street: payload.street,
        Country: payload.country,
        PostalCode: payload.postal_code,
        City: payload.city,
        Email: payload.email
      }
    })
  }

  private buildQuery = (trait_field: string, trait_value: string, sobject: string) => {
    return `?q=SELECT Id FROM ${sobject} WHERE ${trait_field} = '${trait_value}'`
  }

  private lookupTraits = async (trait_field: string, trait_value: string, sobject: string) => {
    const SOQLQuery = this.buildQuery(trait_field, trait_value, sobject)

    const res = await this.request<LookupResponse>(
      `${this.instanceUrl}/services/data/${API_VERSION}/query/${SOQLQuery}`,
      { method: 'get' }
    )

    if (res.data.totalSize === 0) {
      throw new IntegrationError('test', 'test', 404)
    }

    if (res.data.totalSize > 1) {
      throw new IntegrationError('test', 'test', 300)
    }

    return res.data.records[0].Id
  }

  private lookupExternalId = async (field: string, value: string, sobject: string) => {
    const res = await this.request<LookupResponse>(
      `${this.instanceUrl}/services/data/${API_VERSION}/sobjects/${sobject}/${field}/${value}`,
      { method: 'get' }
    )
    return res.data.Id
  }
}
