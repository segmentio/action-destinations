import { IntegrationError, RequestClient } from '@segment/actions-core'
import type { GenericPayload } from './sf-types'
import { mapObjectToShape, snakeCaseToCamelCase } from './sf-object-to-shape'

export const API_VERSION = 'v53.0'
const isSettingsKey = new Map<string, boolean>([
  ['operation', true],
  ['traits', true],
  ['externalIdFieldName', true]
])

interface Records {
  Id?: string
}

interface LookupResponseData {
  Id?: string
  totalSize?: number
  records?: Records[]
}

interface CreateJobResponseData {
  id: string
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

  bulkUpsert = async (payloads: GenericPayload[], sobject: string, externalIdFieldName: string) => {
    if (
      !payloads[0].traits ||
      Object.keys(payloads[0].traits).length === 0 ||
      !payloads[0].traits['externalIdFieldName']
    ) {
      throw new IntegrationError(
        'Undefined traits.externalIdFieldName when using bulkUpsert operation',
        'Undefined traits.externalIdFieldName',
        400
      )
    }

    const jobId = await this.createBulkJob(sobject, externalIdFieldName)
    const csv = this.buildCSVData(payloads, externalIdFieldName)

    await this.uploadBulkCSV(jobId, csv)
    await this.closeBulkJob(jobId)
  }

  private createBulkJob = async (sobject: string, externalIdFieldName: string) => {
    const res = await this.request<CreateJobResponseData>(
      `${this.instanceUrl}services/data/${API_VERSION}/jobs/ingest`,
      {
        method: 'post',
        json: {
          object: sobject,
          externalIdFieldName: externalIdFieldName,
          contentType: 'CSV',
          operation: 'upsert'
        }
      }
    )

    if (!res || !res.data || !res.data.id) {
      throw new IntegrationError('Failed to create bulk job', 'Failed to create bulk job', 500)
    }

    return res.data.id
  }

  private uploadBulkCSV = async (jobId: string, csv: string) => {
    return this.request(`${this.instanceUrl}services/data/${API_VERSION}/jobs/ingest/${jobId}/batches`, {
      method: 'put',
      headers: {
        'Content-Type': 'text/csv',
        Accept: 'application/json'
      },
      body: csv
    })
  }

  private closeBulkJob = async (jobId: string) => {
    return this.request(`${this.instanceUrl}services/data/${API_VERSION}/jobs/ingest/${jobId}`, {
      method: 'patch',
      json: {
        state: 'UploadComplete'
      }
    })
  }

  private buildCSVData = (payloads: GenericPayload[], externalIdFieldName: string): string => {
    //1. build first row based on SF object fields mappings
    //2. iterate over payload and construct each row

    let headers = this.buildHeader(payloads, externalIdFieldName) + '\n'

    payloads.forEach((payload) => {
      headers += this.buildRow(payload) + '\n'
    })

    return headers
  }

  private buildRow = (payload: GenericPayload): string => {
    let row = ''

    //iterate over the keys in payload that map to a SF object field
    // Add each value to the row, separated by a comma
    // The last value in the row should be the externalIDField value

    Object.keys(payload).forEach((key) => {
      if (!isSettingsKey.get(key)) {
        row += `"${payload[key]}",`
      }
    })
    row += `"${payload?.traits?.externalIdFieldName}"`

    return row
  }

  private buildHeader = (payloads: GenericPayload[], externalIdFieldName: string): string => {
    let header = ''
    Object.keys(payloads).forEach((key) => {
      if (!isSettingsKey.get(key)) {
        header += `"${snakeCaseToCamelCase(key)}",`
      }
    })
    header += `"${externalIdFieldName}"`

    return header
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
