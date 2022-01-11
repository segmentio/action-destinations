import { IntegrationError, RequestClient } from '@segment/actions-core'

const API_VERSION = 'v53.0'

interface Records {
  Id?: string
}
interface LookupResponseData {
  Id?: string
  totalSize?: number
  records?: Records[]
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
    if (payload.lookup_criteria === 'external_id') {
      const recordId = await this.lookupExternalId(payload.external_id_field, payload.external_id_value, sobject)
      return await this.baseUpdate(recordId, sobject, payload)
    }

    if (payload.lookup_criteria === 'trait') {
      const recordId = await this.lookupTraits(payload.trait_field, payload.trait_value, sobject)
      return await this.baseUpdate(recordId, sobject, payload)
    }

    if (payload.lookup_criteria === 'record_id') {
      return await this.baseUpdate(payload.record_id, sobject, payload)
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

  private lookupTraits = async (trait_field: string, trait_value: string, sobject: string): Promise<string> => {
    const SOQLQuery = this.buildQuery(trait_field, trait_value, sobject)

    const res = await this.request<LookupResponseData>(
      `${this.instanceUrl}/services/data/${API_VERSION}/query/${SOQLQuery}`,
      { method: 'get' }
    )

    if (
      !res ||
      !res.data ||
      !res.data.records ||
      !res.data.records[0] ||
      !res.data.records[0].Id ||
      !res.data.totalSize
    ) {
      throw new IntegrationError('missing stuff', 'missing', 404)
    }

    if (res.data.totalSize === 0) {
      throw new IntegrationError('test', 'test', 404)
    }

    if (res.data.totalSize > 1) {
      throw new IntegrationError('test', 'test', 300)
    }

    return res.data.records[0].Id
  }

  private lookupExternalId = async (field: string, value: string, sobject: string): Promise<string> => {
    const res = await this.request<LookupResponseData>(
      `${this.instanceUrl}/services/data/${API_VERSION}/sobjects/${sobject}/${field}/${value}`,
      { method: 'get' }
    )

    if (!res.data.Id) {
      throw new IntegrationError('test', 'test', 404)
    }

    return res.data.Id
  }
}
