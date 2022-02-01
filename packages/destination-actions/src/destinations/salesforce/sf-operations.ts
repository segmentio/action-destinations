import { IntegrationError, RequestClient } from '@segment/actions-core'
import type { GenericPayload } from './sf-types'
import { mapObjectToShape } from './sf-object-to-shape'

export const API_VERSION = 'v53.0'

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

  createRecord = async (payload: GenericPayload, sobject: string) => {
    const JSON_data = this.buildJSONData(payload, sobject)

    return this.request(`${this.instanceUrl}/services/data/${API_VERSION}/sobjects/${sobject}`, {
      method: 'post',
      json: JSON_data
    })
  }

  updateRecord = async (payload: GenericPayload, sobject: string) => {
    if (!payload.traits || Object.keys(payload.traits).length === 0) {
      throw new IntegrationError('Undefined Traits when using update operation', 'Undefined Traits', 400)
    }

    if (Object.keys(payload.traits).includes('Id') && payload.traits['Id']) {
      return await this.baseUpdate(payload.traits['Id'] as string, sobject, payload)
    }

    const [recordId, err] = await this.lookupTraits(payload.traits, sobject)

    if (err) {
      throw err
    }

    return await this.baseUpdate(recordId, sobject, payload)
  }

  upsertRecord = async (payload: GenericPayload, sobject: string) => {
    if (!payload.traits || Object.keys(payload.traits).length === 0) {
      throw new IntegrationError('Undefined Traits when using upsert operation', 'Undefined Traits', 400)
    }

    const [recordId, err] = await this.lookupTraits(payload.traits, sobject)

    if (err) {
      if (err.status === 404) {
        return await this.createRecord(payload, sobject)
      }
      throw err
    }
    return await this.baseUpdate(recordId, sobject, payload)
  }

  private baseUpdate = async (recordId: string, sobject: string, payload: GenericPayload) => {
    const JSON_data = this.buildJSONData(payload, sobject)

    return this.request(`${this.instanceUrl}/services/data/${API_VERSION}/sobjects/${sobject}/${recordId}`, {
      method: 'patch',
      json: JSON_data
    })
  }

  private buildJSONData = (payload: GenericPayload, sobject: string) => {
    let baseShape = mapObjectToShape(payload, sobject)

    if (payload.custom_fields) {
      baseShape = { ...baseShape, ...payload.custom_fields }
    }

    return baseShape
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

  private lookupTraits = async (traits: object, sobject: string): Promise<[string, IntegrationError | undefined]> => {
    const SOQLQuery = this.buildQuery(traits, sobject)
    const res = await this.request<LookupResponseData>(
      `${this.instanceUrl}/services/data/${API_VERSION}/query/${SOQLQuery}`,
      { method: 'get' }
    )

    if (!res || !res.data || res.data.totalSize === undefined) {
      return ['', new IntegrationError('Response missing expected fields', 'Bad Response', 400)]
    }

    if (res.data.totalSize === 0) {
      return ['', new IntegrationError('No record found with given traits', 'Record Not Found', 404)]
    }

    if (res.data.totalSize > 1) {
      return ['', new IntegrationError('Multiple records returned with given traits', 'Multiple Records Found', 300)]
    }

    if (!res.data.records || !res.data.records[0] || !res.data.records[0].Id) {
      return ['', new IntegrationError('Response missing expected fields', 'Bad Response', 400)]
    }

    return [res.data.records[0].Id, undefined]
  }
}
