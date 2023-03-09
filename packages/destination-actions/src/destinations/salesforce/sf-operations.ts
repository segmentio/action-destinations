import { IntegrationError, RequestClient } from '@segment/actions-core'
import type { GenericPayload } from './sf-types'
import { mapObjectToShape } from './sf-object-to-shape'
import { buildCSVData, validateInstanceURL } from './sf-utils'
import { DynamicFieldResponse } from '@segment/actions-core'

export const API_VERSION = 'v53.0'

/**
 * This error is triggered if the bulkHandler is ever triggered when the enable_batching setting is false.
 */
const throwBulkMismatchError = () => {
  const errorMsg = 'Bulk operation triggered where enable_batching is false.'
  throw new IntegrationError(errorMsg, errorMsg, 400)
}

const validateSOQLOperator = (operator: string | undefined): SOQLOperator => {
  if (operator !== undefined && operator !== 'OR' && operator !== 'AND') {
    throw new IntegrationError(`Invalid SOQL operator - ${operator}`, 'Invalid SOQL operator', 400)
  }

  // 'OR' is the default operator. Therefore, when we encounter 'undefined' we will return 'OR'.
  if (operator === undefined) {
    return 'OR'
  }

  return operator
}

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

interface SObjectsResponseData {
  sobjects: [
    {
      label: string
      name: string
      createable: boolean
      queryable: boolean
    }
  ]
}

interface SalesforceError {
  response: {
    data: [
      {
        message?: string
        errorCode?: string
      }
    ]
  }
}

type SOQLOperator = 'OR' | 'AND'

export default class Salesforce {
  instanceUrl: string
  request: RequestClient

  constructor(instanceUrl: string, request: RequestClient) {
    this.instanceUrl = validateInstanceURL(instanceUrl)

    // If the instanceUrl does not end with '/' append it to the string.
    // This ensures that all request urls are constructed properly
    this.instanceUrl = this.instanceUrl.concat(instanceUrl.slice(-1) === '/' ? '' : '/')
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

    const soqlOperator: SOQLOperator = validateSOQLOperator(payload.recordMatcherOperator)
    const [recordId, err] = await this.lookupTraits(payload.traits, sobject, soqlOperator)

    if (err) {
      throw err
    }

    return await this.baseUpdate(recordId, sobject, payload)
  }

  upsertRecord = async (payload: GenericPayload, sobject: string) => {
    if (!payload.traits || Object.keys(payload.traits).length === 0) {
      throw new IntegrationError('Undefined Traits when using upsert operation', 'Undefined Traits', 400)
    }

    const soqlOperator: SOQLOperator = validateSOQLOperator(payload.recordMatcherOperator)
    const [recordId, err] = await this.lookupTraits(payload.traits, sobject, soqlOperator)

    if (err) {
      if (err.status === 404) {
        return await this.createRecord(payload, sobject)
      }
      throw err
    }
    return await this.baseUpdate(recordId, sobject, payload)
  }

  bulkHandler = async (payloads: GenericPayload[], sobject: string) => {
    if (!payloads[0].enable_batching) {
      throwBulkMismatchError()
    }

    if (payloads[0].operation === 'upsert') {
      return await this.bulkUpsert(payloads, sobject)
    } else if (payloads[0].operation === 'update') {
      return await this.bulkUpdate(payloads, sobject)
    }

    throw new IntegrationError(
      `Unsupported operation: Bulk API does not support the create operation`,
      'Unsupported operation',
      400
    )
  }

  customObjectName = async (): Promise<DynamicFieldResponse> => {
    try {
      const result = await this.request<SObjectsResponseData>(
        `${this.instanceUrl}services/data/${API_VERSION}/sobjects`,
        {
          method: 'get',
          skipResponseCloning: true
        }
      )

      const fields = result.data.sobjects.filter((field) => {
        return field.createable === true
      })

      const choices = fields.map((field) => {
        return { value: field.name, label: field.label }
      })

      return {
        choices: choices,
        nextPage: '2'
      }
    } catch (err) {
      return {
        choices: [],
        nextPage: '',
        error: {
          message: (err as SalesforceError).response?.data[0]?.message ?? 'Unknown error',
          code: (err as SalesforceError).response?.data[0]?.errorCode ?? 'Unknown error'
        }
      }
    }
  }

  private bulkUpsert = async (payloads: GenericPayload[], sobject: string) => {
    if (
      !payloads[0].bulkUpsertExternalId ||
      !payloads[0].bulkUpsertExternalId.externalIdName ||
      !payloads[0].bulkUpsertExternalId.externalIdValue
    ) {
      throw new IntegrationError(
        'Undefined bulkUpsertExternalId.externalIdName or externalIdValue when using bulkUpsert operation',
        'Undefined bulkUpsertExternalId.externalIdName externalIdValue',
        400
      )
    }
    const externalIdFieldName = payloads[0].bulkUpsertExternalId.externalIdName

    const jobId = await this.createBulkJob(sobject, externalIdFieldName, 'upsert')

    const csv = buildCSVData(payloads, externalIdFieldName)

    await this.uploadBulkCSV(jobId, csv)
    return await this.closeBulkJob(jobId)
  }

  private bulkUpdate = async (payloads: GenericPayload[], sobject: string) => {
    if (!payloads[0].bulkUpdateRecordId) {
      throw new IntegrationError(
        'Undefined bulkUpdateRecordId when using bulkUpdate operation',
        'Undefined bulkUpdateRecordId',
        400
      )
    }

    const jobId = await this.createBulkJob(sobject, 'Id', 'update')
    const csv = buildCSVData(payloads, 'Id')

    await this.uploadBulkCSV(jobId, csv)
    return await this.closeBulkJob(jobId)
  }

  private createBulkJob = async (sobject: string, externalIdFieldName: string, operation: string) => {
    const res = await this.request<CreateJobResponseData>(
      `${this.instanceUrl}services/data/${API_VERSION}/jobs/ingest`,
      {
        method: 'post',
        json: {
          object: sobject,
          externalIdFieldName: externalIdFieldName,
          contentType: 'CSV',
          operation: operation
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
      method: 'PATCH',
      json: {
        state: 'UploadComplete'
      }
    })
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

  // Pre-formats trait values based on datatypes for correct SOQL syntax
  private typecast = (value: any) => {
    switch (typeof value) {
      case 'boolean':
        return value
      case 'number':
        return value
      case 'string':
        return `'${this.escapeQuotes(value)}'`
      default:
        throw new IntegrationError(
          'Unsupported datatype for record matcher traits - ' + typeof value,
          'Unsupported Type',
          400
        )
    }
  }

  private buildQuery = (traits: object, sobject: string, soqlOperator: SOQLOperator) => {
    let soql = `SELECT Id FROM ${sobject} WHERE `

    const entries = Object.entries(traits)
    let i = 0
    for (const [key, value] of entries) {
      let token = `${this.removeInvalidChars(key)} = ${this.typecast(value)}`

      if (i < entries.length - 1) {
        token += ' ' + soqlOperator + ' '
      }

      soql += token
      i += 1
    }

    return soql
  }

  private lookupTraits = async (
    traits: object,
    sobject: string,
    soqlOperator: SOQLOperator
  ): Promise<[string, IntegrationError | undefined]> => {
    const SOQLQuery = encodeURIComponent(this.buildQuery(traits, sobject, soqlOperator))

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
