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
    // If the instanceUrl does not end with '/' append it to the string.
    // This ensures that all request urls are constructed properly
    this.instanceUrl = instanceUrl.concat(instanceUrl.slice(-1) === '/' ? '' : '/')
    this.request = request
  }

  createRecord = async (payload: GenericPayload, sobject: string) => {
    const json = this.buildJSONData(payload, sobject)

    return this.request(`${this.instanceUrl}services/data/${API_VERSION}/sobjects/${sobject}`, {
      method: 'post',
      json: json
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

  bulkUpsert = async (payload: GenericPayload[], sobject: string, externalIdFieldName: string) => {
    //1. create new job
    const res = await this.createBulkJob(sobject, externalIdFieldName)
    //console.log('job', res)
    const jobId = res.data.id
    console.log('jobId', jobId)
    //2. upload csv of the data
    const upload = await this.uploadBulkCSV(jobId)
    console.log('upload', upload)
    // //3. close job
    const close = await this.closeBulkJob(jobId)
    console.log('close', close)
    //4. get results?
    const status = await this.getJobStatus(jobId)
    console.log('status', status)
  }

  private createBulkJob = async (sobject: string, externalIdFieldName: string) => {
    const url = `${this.instanceUrl}services/data/${API_VERSION}/jobs/ingest`

    return this.request(url, {
      method: 'post',
      json: {
        object: sobject,
        externalIdFieldName: externalIdFieldName,
        contentType: 'CSV',
        operation: 'insert'
      }
    })
  }

  private uploadBulkCSV = async (jobId: string) => {
    const url = `${this.instanceUrl}services/data/${API_VERSION}/jobs/ingest/${jobId}/batches`

    return this.request(url, {
      method: 'put',
      headers: {
        'Content-Type': 'text/csv',
        Accept: 'application/json'
      },
      body: this.buildCSVData()
    })
  }

  private closeBulkJob = async (jobId: string) => {
    const url = `${this.instanceUrl}services/data/${API_VERSION}/jobs/ingest/${jobId}`

    return this.request(url, {
      method: 'patch',
      json: {
        state: 'UploadComplete'
      }
    })
  }

  private getJobStatus = async (jobId: string) => {
    const url = `${this.instanceUrl}services/data/${API_VERSION}/jobs/ingest/${jobId}`

    return this.request(url, {
      method: 'get'
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private buildCSVData = () => {
    //harcode for poc account
    return `Name,test__c
   TestAccount1,ab
   TestAccount2,ac
   TestAccount3,dc`
  }

  private baseUpdate = async (recordId: string, sobject: string, payload: GenericPayload) => {
    const json = this.buildJSONData(payload, sobject)

    return this.request(`${this.instanceUrl}services/data/${API_VERSION}/sobjects/${sobject}/${recordId}`, {
      method: 'patch',
      json: json
    })
  }

  private buildJSONData = (payload: GenericPayload, sobject: string) => {
    let baseShape = {}

    if (!payload.customObjectName) {
      baseShape = mapObjectToShape(payload, sobject)
    }

    if (payload.customFields) {
      // custom field mappings take priority over base shape mappings.
      baseShape = { ...baseShape, ...payload.customFields }
    }

    return baseShape
  }

  // Salesforce SOQL spec requires any single quotes to be escaped.
  private escapeQuotes = (value: string) => value.replace(/'/g, "\\'")

  // Salesforce field names should have only characters in {a-z, A-Z, 0-9, _}.
  private removeInvalidChars = (value: string) => value.replace(/[^a-zA-Z0-9_]/g, '')

  private buildQuery = (traits: object, sobject: string) => {
    let soql = `SELECT Id FROM ${sobject} WHERE `

    const entries = Object.entries(traits)
    let i = 0
    for (const [key, value] of entries) {
      let token = `${this.removeInvalidChars(key)} = '${this.escapeQuotes(value)}'`

      if (i < entries.length - 1) {
        token += ' OR '
      }

      soql += token
      i += 1
    }
    return soql
  }

  private lookupTraits = async (traits: object, sobject: string): Promise<[string, IntegrationError | undefined]> => {
    const SOQLQuery = encodeURIComponent(this.buildQuery(traits, sobject))

    const res = await this.request<LookupResponseData>(
      `${this.instanceUrl}services/data/${API_VERSION}/query/?q=${SOQLQuery}`,
      { method: 'GET' }
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
