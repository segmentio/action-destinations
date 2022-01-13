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

interface Payload {
  traits?: { [k: string]: unknown } | undefined
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

  updateRecord = async (payload: Payload, sobject: string) => {
    if (payload.traits === undefined) {
      throw new IntegrationError('Undefined Traits when using update operation', 'Undefined Traits', 400)
    }

    if (Object.keys(payload.traits).includes('Id') && payload.traits['Id']) {
      return await this.baseUpdate(payload.traits['Id'] as string, sobject, payload)
    }

    const recordId = await this.lookupTraits(payload.traits, sobject)
    return await this.baseUpdate(recordId, sobject, payload)
  }

  upsertRecord = async (payload: any, sobject: string) => {
    if (payload.lookup_criteria === 'external_id') {
      const recordId = await this.lookupExternalId(payload.external_id_field, payload.external_id_value, sobject)
      if (!recordId) {
        return await this.createRecord(payload, sobject)
      }
      return await this.baseUpdate(recordId, sobject, payload)
    }

    if (payload.lookup_criteria === 'trait') {
      const recordId = await this.lookupTraits(payload.trait_field, payload.trait_value, sobject)
      if (!recordId) {
        return await this.createRecord(payload, sobject)
      }
      return await this.baseUpdate(recordId, sobject, payload)
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

  private buildQuery = (traits: object, sobject: string) => {
    let soql = `?q=SELECT Id FROM ${sobject} WHERE `

    const entries = Object.entries(traits)
    let i = 0
    for (const [key, value] of entries) {
      let token = `${key} = '${value}'`

      if (i < entries.length - 1) {
        token += ' OR '
      }

      soql += token
      i += 1
    }
    return soql
  }

  private lookupTraits = async (traits: object, sobject: string): Promise<string> => {
    const SOQLQuery = this.buildQuery(traits, sobject)

    const res = await this.request<LookupResponseData>(
      `${this.instanceUrl}/services/data/${API_VERSION}/query/${SOQLQuery}`,
      { method: 'get' }
    )

    if (!res || !res.data || res.data.totalSize === undefined) {
      throw new IntegrationError('Response missing expected fields', 'Bad Response', 400)
    }

    if (res.data.totalSize === 0) {
      throw new IntegrationError('No record found with given traits', 'Record Not Found', 404)
    }

    if (res.data.totalSize > 1) {
      throw new IntegrationError('Multiple records returned with given traits', 'Multiple Records Found', 300)
    }

    if (!res.data.records || !res.data.records[0] || !res.data.records[0].Id) {
      throw new IntegrationError('Response missing expected fields', 'Bad Response', 400)
    }

    return res.data.records[0].Id
  }
}
