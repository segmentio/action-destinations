import { RequestClient, PayloadValidationError, IntegrationError, ModifiedResponse } from '@segment/actions-core'
import { Payload } from './generated-types'
import { HUBSPOT_BASE_URL } from '../properties'
import { MAX_HUBSPOT_BATCH_SIZE } from './constants'

// #region Types and Interfaces

const OBJECT_NOT_FOUND_ERROR_RESPONSE = 'Unable to infer object type'

export const SyncMode = {
  Upsert: 'upsert',
  Add: 'add',
  Update: 'update'
} as const

export type SyncMode = typeof SyncMode[keyof typeof SyncMode]

export const AssociationSyncMode = {
  Upsert: 'upsert',
  Read: 'read'
} as const

export type AssociationSyncMode = typeof AssociationSyncMode[keyof typeof AssociationSyncMode]

const BatchRequestType = {
  Upsert: 'upsert',
  Create: 'create',
  Update: 'update',
  Read: 'read'
} as const

type BatchRequestType = typeof BatchRequestType[keyof typeof BatchRequestType]

const HSPropTypeFieldType = {
  StringText: 'string:text',
  NumberNumber: 'number:number',
  DateTimeDate: 'datetime:date',
  DateDate: 'date:date',
  EnumerationBooleanCheckbox: 'enumeration:booleancheckbox'
} as const

type HSPropTypeFieldType = typeof HSPropTypeFieldType[keyof typeof HSPropTypeFieldType]

const HSPropType = {
  Date: 'date',
  String: 'string',
  DateTime: 'datetime',
  Number: 'number',
  Enumeration: 'enumeration'
} as const

type HSPropType = typeof HSPropType[keyof typeof HSPropType]

const HSPropFieldType = {
  Text: 'text',
  Number: 'number',
  Date: 'date',
  BooleanCheckbox: 'booleancheckbox',
  Select: 'select'
} as const

type HSPropFieldType = typeof HSPropFieldType[keyof typeof HSPropFieldType]

export const SchemaMatch = {
  FullMatch: 'full_match',
  PropertiesMissing: 'properties_missing',
  NoMatch: 'no_match',
  Mismatch: 'mismatch'
} as const

export type SchemaMatch = typeof SchemaMatch[keyof typeof SchemaMatch]

const ReadType = {
  ReturnRecordsWithIds: 'return_records_with_ids',
  ReturnRecordsWithoutIds: 'return_records_without_ids'
} as const

type ReadType = typeof ReadType[keyof typeof ReadType]

interface Prop {
  name: string
  type: HSPropType
  fieldType: HSPropFieldType
  typeFieldType: HSPropTypeFieldType
}

interface Schema {
  object_details: {
    object_type: string
    id_field_name: string
  }
  properties: Prop[]
  sensitiveProperties: Prop[]
}

interface SchemaDiff {
  match: SchemaMatch
  object_details: {
    object_type: string
    id_field_name: string
  }
  missingProperties: Prop[]
  missingSensitiveProperties: Prop[]
}

interface ResponseType {
  status: 'fulfilled' | 'rejected'
  value?: { data: { results: Result[] } }
  reason?: { message: string }
}

interface Result {
  name: string
  type: HSPropType
  fieldType: HSPropFieldType
  hasUniqueValue: boolean
}

interface ReadJSON {
  idProperty: string
  properties: string[]
  inputs: Array<{ id: string }>
}

interface UpsertJSON {
  inputs: Array<{
    idProperty: string
    id: string
    properties: Record<string, string>
  }>
}
interface CreateJSON {
  inputs: Array<{
    idProperty: string
    properties: Record<string, string>
  }>
}

interface RespJSON {
  status: string
  results: Array<{
    id: string
    properties: Record<string, string | null>
  }>
}

interface OmitPayload extends Omit<Payload, 'enable_batching' | 'batch_size' | 'association_sync_mode'> {}

interface PayloadWithFromId extends OmitPayload {
  object_details: OmitPayload['object_details'] & {
    record_id: string
  }
  associations?: Array<{
    object_type: string
    association_label: string
    id_field_name: string
    id_field_value: string
    from_record_id: string
  }>
}

interface AssociationPayload extends OmitPayload {
  object_details: OmitPayload['object_details'] & {
    from_record_id: string
  }
  association_details: {
    association_label: string
  }
}

interface AssociationPayloadWithId extends AssociationPayload {
  object_details: AssociationPayload['object_details'] & {
    record_id: string
  }
}

interface AssociationType {
  associationCategory: AssociationCategory
  associationTypeId: string
}

enum AssociationCategory {
  HUBSPOT_DEFINED = 'HUBSPOT_DEFINED',
  USER_DEFINED = 'USER_DEFINED',
  INTEGRATOR_DEFINED = 'INTEGRATOR_DEFINED'
}

interface BatchAssociationsRequestBody {
  inputs: {
    types: AssociationType[]
    from: {
      id: string
    }
    to: {
      id: string
    }
  }[]
}

interface GroupableFields {
  object_type: string
  id_field_name: string
}

// #endregion

export class HubspotClient {
  request: RequestClient
  objectType: string
  syncMode: SyncMode
  associationSyncMode: AssociationSyncMode
  propertyGroup?: string

  constructor(
    request: RequestClient,
    objectType: string,
    syncMode: SyncMode,
    associationSyncMode: AssociationSyncMode,
    propertyGroup: string | undefined
  ) {
    this.request = request
    this.objectType = objectType
    this.syncMode = syncMode
    this.associationSyncMode = associationSyncMode
    this.propertyGroup = propertyGroup
  }

  // #region Schema functions

  /**
   * Cleans and validates a property name. The function:
   * - Converts the name to lowercase.
   * - Replaces non-alphanumeric characters (except underscores) with underscores.
   * - Throws an error if the name does not start with a letter.
   *
   * @param {string} str - The property name to clean and validate.
   * @returns {string} - The cleaned property name.
   * @throws {PayloadValidationError} - If the cleaned name does not start with a letter.
   */
  cleanProp(str: string): string {
    str = str.toLowerCase().replace(/[^a-z0-9_]/g, '_')

    if (!/^[a-z]/.test(str)) {
      throw new PayloadValidationError(
        `Property ${str} in event has an invalid name. Property names must start with a letter.`
      )
    }

    return str
  }

  /**
   * Cleans an object by transforming its property keys and converting its values to a more
   * standardized format. Specifically, it ensures that:
   * - The keys are cleaned using the `cleanProp` method.
   * - The values are converted to a string, number, or boolean, or if they are objects, to their
   *   JSON string representation.
   *
   * If the input object is `undefined`, the function will return `undefined`.
   *
   * @param {Object.<string, unknown> | undefined} obj - The object whose properties and values
   *   need to be cleaned. It can be `undefined` which will result in an `undefined` return value.
   * @returns {Object.<string, string | number | boolean> | undefined} - A new object with cleaned
   *   property keys and values. If the input was `undefined`, `undefined` is returned.
   */
  cleanPropObj(obj: { [k: string]: unknown } | undefined): { [k: string]: string | number | boolean } | undefined {
    const cleanObj: { [k: string]: string | number | boolean } = {}

    if (obj === undefined) {
      return undefined
    }

    Object.keys(obj).forEach((key) => {
      const value = obj[key]
      const cleanKey = this.cleanProp(key)
      cleanObj[cleanKey] =
        typeof value === 'object' && value !== null ? JSON.stringify(value) : (value as string | number | boolean)
    })

    return cleanObj
  }

  /**
   * Validates and cleans an array of payloads by removing any payloads that have missing or empty critical fields.
   * Additionally, it cleans up the `properties`, `sensitive_properties`, and `associations` fields
   * of each payload.
   *
   * @param {Payload[]} payloads - The array of payloads to be validated.
   * @returns {Payload[]} - A new array of validated payloads.
   */
  validate(payloads: Payload[]): Payload[] {
    const length = payloads.length

    const cleaned: Payload[] = payloads.filter((payload) => {
      const fieldsToCheck = [
        payload.object_details.id_field_name,
        payload.object_details.id_field_value,
        payload.object_details.object_type
      ]
      return fieldsToCheck.every((field) => field !== null && field !== '')
    })

    if (length === 1 && cleaned.length === 0) {
      throw new PayloadValidationError(
        'Payload is missing required fields. Null or empty values are not allowed for "Object Type", "ID Field Name" or "ID Field Value".'
      )
    }

    cleaned.forEach((payload) => {
      payload.properties = this.cleanPropObj(payload.properties)
      payload.sensitive_properties = this.cleanPropObj(payload.sensitive_properties)

      payload.associations = payload.associations?.filter((association) => {
        const fieldsToCheck = [
          association.id_field_name,
          association.object_type,
          association.id_field_value,
          association.association_label
        ]
        return fieldsToCheck.every((field) => field !== null && field !== '')
      })
    })

    return cleaned
  }

  format(value: unknown): { type: HSPropType; fieldType: HSPropFieldType } {
    switch (typeof value) {
      case 'object':
        return { type: HSPropType.String, fieldType: HSPropFieldType.Text }
      case 'number':
        return { type: HSPropType.Number, fieldType: HSPropFieldType.Number }
      case 'boolean':
        return { type: HSPropType.Enumeration, fieldType: HSPropFieldType.BooleanCheckbox }
      case 'string': {
        // Check for date or datetime, otherwise default to string
        const isoDateTimeRegex =
          /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?:([ T])(\d{2}):?(\d{2})(?::?(\d{2})(?:[,\.](\d{1,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?)?)?$/ //eslint-disable-line no-useless-escape
        const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/ //eslint-disable-line no-useless-escape

        if (isoDateTimeRegex.test(value as string)) {
          return {
            type: dateOnlyRegex.test(value as string) ? HSPropType.Date : HSPropType.DateTime,
            fieldType: HSPropFieldType.Date
          }
        } else {
          return { type: HSPropType.String, fieldType: HSPropFieldType.Text }
        }
      }
      case undefined:
      default:
        throw new IntegrationError(
          'Property must be an object, boolean, string or number',
          'HUBSPOT_PROPERTY_VALUE_UNDEFINED',
          400
        )
    }
  }

  formatHS(type: HSPropType, fieldType: HSPropFieldType): HSPropTypeFieldType {
    if (type === 'date' && fieldType === 'date') {
      return HSPropTypeFieldType.DateDate
    } else if (type === 'string' && fieldType === 'text') {
      return HSPropTypeFieldType.StringText
    } else if (type === 'number' && fieldType === 'number') {
      return HSPropTypeFieldType.NumberNumber
    } else if (type === 'datetime' && fieldType === 'date') {
      return HSPropTypeFieldType.DateTimeDate
    } else if (type === 'enumeration' && fieldType === 'booleancheckbox') {
      return HSPropTypeFieldType.EnumerationBooleanCheckbox
    }
    throw new IntegrationError('Property type not supported', 'HUBSPOT_PROPERTY_TYPE_NOT_SUPPORTED', 400)
  }

  /**
   * Generates a schema from an array of payloads. It extracts and formats properties and
   * sensitive properties into a standardized schema structure.
   *
   * @param {Payload[]} payloads - An array of payloads to generate the schema from.
   * @returns {Schema} - The generated schema including object details, properties, and
   *   sensitive properties.
   */
  schema(payloads: Payload[]): Schema {
    const extractProperties = (propertyType: 'properties' | 'sensitive_properties'): Prop[] => {
      return Object.values(
        payloads.reduce((acc, payload) => {
          const properties = payload[propertyType]
          if (properties) {
            Object.entries(properties).forEach(([propName, value]) => {
              const typeData = this.format(value)
              acc[propName] = {
                name: propName,
                type: typeData.type,
                fieldType: typeData.fieldType,
                typeFieldType: this.formatHS(typeData.type, typeData.fieldType)
              }
            })
          }
          return acc
        }, {} as { [name: string]: Prop })
      )
    }

    const properties = extractProperties('properties')
    const sensitiveProperties = extractProperties('sensitive_properties')

    return {
      object_details: {
        object_type: this.objectType,
        id_field_name: payloads[0].object_details.id_field_name
      },
      properties,
      sensitiveProperties
    }
  }

  /**
   * A placeholder asynchronous function intended for future caching implementation.
   * Currently, it processes the given schema and returns a default `SchemaDiff` object.
   *
   * @param {Schema} schema - The schema to compare against the cache.
   * @returns {Promise<SchemaDiff>} - A promise that resolves to a default `SchemaDiff` object
   *   indicating no match and empty lists for missing properties.
   */
  async schemaDiffCache(schema: Schema): Promise<SchemaDiff> {
    // no op function until caching implemented
    let data = JSON.stringify(`${schema}`)
    data = data.replace(data, '')
    console.log(`${data}`)

    const schemaDiff: SchemaDiff = {
      match: 'no_match',
      object_details: {
        object_type: schema.object_details.object_type,
        id_field_name: schema.object_details.id_field_name
      },
      missingProperties: [],
      missingSensitiveProperties: []
    }

    return Promise.resolve(schemaDiff)
  }

  /**
   * A placeholder asynchronous function for saving a schema to cache.
   * Currently, it processes the given schema but does not perform any caching operations.
   *
   * @param {Schema} schema - The schema to be saved to the cache.
   * @returns {Promise<void>} - A promise that resolves when the function completes.
   */
  async saveSchemaToCache(schema: Schema) {
    // no op function until caching implemented
    let data = JSON.stringify(`${schema}`)
    data = data.replace(data, '')
    console.log(`${data}`)
  }

  /**
   * Checks for a type clash between a property being passed in the Payload, and a property from the Hubspot schema.
   *
   * @param {Prop} prop - The property to be checked.
   * @param {Result} hubspotProp - The existing property type details from Hubspot to compare against, also containing `fieldType` and `type`.
   */
  checkForIncompatiblePropTypes(prop: Prop, hubspotProp?: Result) {
    if (!hubspotProp) {
      return
    }

    if (hubspotProp.fieldType === prop.fieldType && hubspotProp.type === prop.type) {
      return
    }

    if (
      hubspotProp.fieldType === 'select' &&
      hubspotProp.type === 'enumeration' &&
      prop.fieldType === 'text' &&
      prop.type === 'string'
    ) {
      // string:text is OK to match to enumeration:select
      return
    }

    throw new IntegrationError(
      `Payload property with name ${prop.name} has a different type to the property in HubSpot. Expected: type = ${prop.type} fieldType = ${prop.fieldType}. Received: type = ${hubspotProp.type} fieldType = ${hubspotProp.fieldType}`,
      'HUBSPOT_PROPERTY_TYPE_MISMATCH',
      400
    )
  }

  determineMissingPropsAndMatchType(
    response: ResponseType,
    properties: Prop[]
  ): { missingProps: Prop[]; match: SchemaMatch } {
    switch (response.status) {
      case 'fulfilled': {
        const results = response.value?.data.results ?? []
        const missingProps: Prop[] = []
        properties.forEach((prop) => {
          const match = results.find((item: Result) => {
            return item.name === prop.name
          })

          this.checkForIncompatiblePropTypes(prop, match)

          if (!match) {
            missingProps.push({
              name: prop.name,
              type: prop.type,
              fieldType: prop.fieldType,
              typeFieldType: prop.typeFieldType
            })
          }
        })
        return {
          missingProps,
          match: missingProps.length === 0 ? SchemaMatch.FullMatch : SchemaMatch.PropertiesMissing
        }
      }

      case 'rejected': {
        if (response.reason?.message.startsWith(OBJECT_NOT_FOUND_ERROR_RESPONSE)) {
          return { missingProps: [], match: SchemaMatch.NoMatch }
        } else {
          throw new IntegrationError(
            `Error fetching Hubspot property data: ${response.reason?.message}`,
            'HUBSPOT_PROPERTY_FETCH_ERROR',
            400
          )
        }
      }
    }
  }

  /**
   * Compares the provided schema against properties from HubSpot to identify differences.
   * This function fetches properties and sensitive properties from HubSpot, compares them with
   * the schema, and returns a `SchemaDiff` object indicating any discrepancies.
   *
   * @param {Schema} schema - The schema to compare against HubSpot properties.
   * @returns {Promise<SchemaDiff>} - A promise that resolves to a `SchemaDiff` object with
   *   the comparison results, including missing properties and the match status.
   * @throws {IntegrationError} - Throws an error if the data cannot be fetched from HubSpot.
   */
  async schemaDiffHubspot(schema: Schema): Promise<SchemaDiff> {
    const requests = []
    const hasProps = schema.properties.length
    const hasSensitiveProps = schema.sensitiveProperties.length

    if (hasProps) {
      requests.push(
        this.request<ResponseType>(`${HUBSPOT_BASE_URL}/crm/v3/properties/${this.objectType}`, {
          method: 'GET',
          skipResponseCloning: true
        })
      )
    }

    if (hasSensitiveProps) {
      requests.push(
        this.request<ResponseType>(
          `${HUBSPOT_BASE_URL}/crm/v3/properties/${this.objectType}?dataSensitivity=sensitive`,
          {
            method: 'GET',
            skipResponseCloning: true
          }
        )
      )
    }

    const responses = await Promise.allSettled(requests)

    const schemaDiff = {
      object_details: {
        object_type: schema.object_details.object_type,
        id_field_name: schema.object_details.id_field_name
      }
    } as SchemaDiff

    if (hasProps && requests.length > 0) {
      const response = responses.shift()
      const { missingProps, match } = this.determineMissingPropsAndMatchType(
        response as ResponseType,
        schema.properties
      )
      schemaDiff.missingProperties = missingProps
      schemaDiff.match = match
    }

    if (hasSensitiveProps && requests.length > 0) {
      const response = responses.shift()
      const { missingProps, match } = this.determineMissingPropsAndMatchType(
        response as ResponseType,
        schema.sensitiveProperties
      )
      schemaDiff.missingSensitiveProperties = missingProps

      if (schemaDiff.match === SchemaMatch.NoMatch && schemaDiff.match !== SchemaMatch.NoMatch) {
        // this should never happen. If it does, throw an error
        throw new IntegrationError('Unable to fetch property data from Hubspot', 'HUBSPOT_PROPERTIES_ERROR', 400)
      }

      if (schemaDiff.match === SchemaMatch.FullMatch) {
        schemaDiff.match = match
      }
    }

    return schemaDiff
  }

  async createProperties(schemaDiff: SchemaDiff) {
    if (!this.propertyGroup) {
      throw new PayloadValidationError(
        '"Property Group" is a required field when creating properties on an Object Schema in Hubspot'
      )
    }

    if (schemaDiff.missingProperties.length === 0 && schemaDiff.missingSensitiveProperties.length === 0) {
      return
    }

    interface Input {
      name: string
      label: string
      groupName: string
      type: string
      dataSensitivity: 'sensitive' | undefined
      fieldType: string
      options?: Array<{ label: string; value: string; hidden: boolean; description: string; displayOrder: number }>
    }
    interface RequestBody {
      inputs: Array<Input>
    }

    const { missingProperties: props, missingSensitiveProperties: sensitiveProps } = schemaDiff

    const input = (prop: Prop, sensitive: boolean): Input => {
      switch (prop.typeFieldType) {
        case HSPropTypeFieldType.NumberNumber:
          return {
            name: prop.name,
            label: prop.name,
            groupName: this.propertyGroup as string,
            type: 'number',
            dataSensitivity: sensitive === true ? 'sensitive' : undefined,
            fieldType: 'number'
          }
        case HSPropTypeFieldType.StringText:
          return {
            name: prop.name,
            label: prop.name,
            groupName: this.propertyGroup as string,
            type: 'string',
            dataSensitivity: sensitive === true ? 'sensitive' : undefined,
            fieldType: 'text'
          }
        case HSPropTypeFieldType.EnumerationBooleanCheckbox:
          return {
            name: prop.name,
            label: prop.name,
            groupName: this.propertyGroup as string,
            type: 'enumeration',
            dataSensitivity: sensitive === true ? 'sensitive' : undefined,
            fieldType: 'booleancheckbox',
            options: [
              {
                label: 'true',
                value: 'true',
                hidden: false,
                description: 'True',
                displayOrder: 1
              },
              {
                label: 'false',
                value: 'false',
                hidden: false,
                description: 'False',
                displayOrder: 2
              }
            ]
          }
        case HSPropTypeFieldType.DateTimeDate:
          return {
            name: prop.name,
            label: prop.name,
            groupName: this.propertyGroup as string,
            type: 'datetime',
            dataSensitivity: sensitive === true ? 'sensitive' : undefined,
            fieldType: 'date'
          }
        case HSPropTypeFieldType.DateDate:
          return {
            name: prop.name,
            label: prop.name,
            groupName: this.propertyGroup as string,
            type: 'date',
            dataSensitivity: sensitive === true ? 'sensitive' : undefined,
            fieldType: 'date'
          }
      }
    }

    const json: RequestBody = {
      inputs: [
        ...(props ? props.map((p) => input(p, false)) : []),
        ...(sensitiveProps ? sensitiveProps.map((p) => input(p, true)) : [])
      ]
    } as RequestBody

    await this.request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${this.objectType}/batch/create`, {
      method: 'POST',
      skipResponseCloning: true,
      json
    })
  }

  // #endregion

  async batchObjectRequest(action: BatchRequestType, objectType: string, data: ReadJSON | UpsertJSON | CreateJSON) {
    return this.request<RespJSON>(`${HUBSPOT_BASE_URL}/crm/v3/objects/${objectType}/batch/${action}`, {
      method: 'POST',
      json: data
    })
  }

  // #region From Object functions

  async sendFromRecords(payloads: Payload[]): Promise<PayloadWithFromId[]> {
    switch (this.syncMode) {
      case SyncMode.Upsert: {
        return await this.upsertRecords(payloads, this.objectType)
      }

      case SyncMode.Update: {
        return await this.updateRecords(payloads, this.objectType)
      }

      case SyncMode.Add: {
        return await this.addRecords(payloads, this.objectType)
      }
    }
  }

  async readRecords(
    payloads: Payload[],
    objectType: string,
    readType: ReadType
  ): Promise<PayloadWithFromId[] | Payload[]> {
    const idFieldName = payloads[0].object_details.id_field_name

    const readResponse = await this.batchObjectRequest(BatchRequestType.Read, objectType, {
      properties: [idFieldName],
      idProperty: idFieldName,
      inputs: payloads.map((payload) => {
        return { id: payload.object_details.id_field_value }
      })
    } as ReadJSON)

    switch (readType) {
      case ReadType.ReturnRecordsWithIds:
        return this.returnRecordsWithIds(payloads, readResponse)
      case ReadType.ReturnRecordsWithoutIds:
        return this.returnRecordsWithoutIds(payloads, readResponse)
    }
  }

  async upsertRecords(payloads: Payload[], objectType: string): Promise<PayloadWithFromId[]> {
    const response = await this.batchObjectRequest(BatchRequestType.Upsert, objectType, {
      inputs: payloads.map(({ object_details: { id_field_value }, properties, sensitive_properties }) => {
        const idFieldName = payloads[0].object_details.id_field_name
        return {
          idProperty: idFieldName,
          id: id_field_value,
          properties: { ...properties, ...sensitive_properties, [idFieldName]: id_field_value }
        }
      })
    } as UpsertJSON)

    return this.returnRecordsWithIds(payloads, response)
  }

  async updateRecords(payloads: Payload[], objectType: string): Promise<PayloadWithFromId[]> {
    const existingRecords = (await this.readRecords(
      payloads,
      objectType,
      ReadType.ReturnRecordsWithIds
    )) as unknown as Payload[]

    const response = await this.batchObjectRequest(BatchRequestType.Update, this.objectType, {
      inputs: existingRecords.map(({ object_details: { id_field_value }, properties, sensitive_properties }) => {
        const idFieldName = payloads[0].object_details.id_field_name
        return {
          idProperty: idFieldName,
          id: id_field_value,
          properties: { ...properties, ...sensitive_properties }
        }
      })
    } as UpsertJSON)

    return this.returnRecordsWithIds(existingRecords, response)
  }

  async addRecords(payloads: Payload[], objectType: string): Promise<PayloadWithFromId[]> {
    const recordsToCreate = (await this.readRecords(
      payloads,
      objectType,
      ReadType.ReturnRecordsWithoutIds
    )) as Payload[]

    const response: ModifiedResponse<RespJSON> = await this.batchObjectRequest(
      BatchRequestType.Create,
      this.objectType,
      {
        inputs: recordsToCreate.map(
          ({ object_details: { id_field_value: fromIdFieldValue }, properties, sensitive_properties }) => {
            const idFieldName = payloads[0].object_details.id_field_name
            return {
              idProperty: idFieldName,
              properties: { ...properties, ...sensitive_properties, [idFieldName]: fromIdFieldValue }
            }
          }
        )
      } as CreateJSON
    )

    return this.returnRecordsWithIds(recordsToCreate, response)
  }

  returnRecordsWithIds(payloads: Payload[], response: ModifiedResponse<RespJSON>): PayloadWithFromId[] {
    response?.data?.results.forEach((result) => {
      payloads
        .filter((p) => {
          return p.object_details.id_field_value == (result.properties[p.object_details.id_field_name] as string)
        })
        .forEach((p) => {
          const pw = { ...p, object_details: { ...p.object_details, record_id: result.id } } as PayloadWithFromId
          if (pw.associations) {
            pw.associations.forEach((association) => {
              association.from_record_id = result.id
            })
          }
        })
    })

    return payloads as unknown as PayloadWithFromId[]
  }

  returnRecordsWithoutIds(payloads: Payload[], response: ModifiedResponse<RespJSON>): Payload[] {
    const missingRecords = payloads.filter((payload) => {
      return !response.data.results.some((result) => {
        return result.properties[payload.object_details.id_field_name] === payload.object_details.id_field_value
      })
    })

    return missingRecords
  }

  // #endregion

  // #region Associated Record functions

  createAssociationPayloads(payloads: PayloadWithFromId[]): AssociationPayload[][] {
    const associationPayloads: AssociationPayload[] = payloads.flatMap((payload) =>
      Array.isArray(payload.associations)
        ? payload.associations.map((association) => ({
            object_details: {
              object_type: association.object_type,
              id_field_name: association.id_field_name,
              id_field_value: association.id_field_value,
              from_record_id: association.from_record_id
            },
            association_details: {
              association_label: association.association_label
            }
          }))
        : []
    )

    return this.groupPayloads(associationPayloads, ['object_type', 'id_field_name'])
  }

  groupPayloads(associations: AssociationPayload[], groupBy: (keyof GroupableFields)[]): AssociationPayload[][] {
    const groupedPayloads: AssociationPayload[][] = []

    const groups: { [key: string]: AssociationPayload[] } = associations.reduce((acc, payload) => {
      const key = groupBy.map((prop) => payload.object_details[prop]).join('_')
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(payload)
      return acc
    }, {} as { [key: string]: AssociationPayload[] })

    for (const key in groups) {
      const items = groups[key]
      for (let i = 0; i < items.length; i += MAX_HUBSPOT_BATCH_SIZE) {
        groupedPayloads.push(items.slice(i, i + MAX_HUBSPOT_BATCH_SIZE))
      }
    }

    return groupedPayloads
  }

  async sendAssociatedRecords(payloads: AssociationPayload[][]): Promise<AssociationPayloadWithId[]> {
    switch (this.associationSyncMode) {
      case AssociationSyncMode.Upsert: {
        return await this.upsertAssociatedRecords(payloads)
      }
      case AssociationSyncMode.Read: {
        return await this.readAssociatedRecords(payloads)
      }
    }
  }

  async readAssociatedRecords(groupedPayloads: AssociationPayload[][]): Promise<AssociationPayloadWithId[]> {
    const requests = groupedPayloads.map(async (payloads) => {
      const { object_type: objectType } = payloads[0].object_details

      return await this.batchObjectRequest(AssociationSyncMode.Read, objectType, {
        idProperty: payloads[0].object_details.id_field_name,
        properties: [payloads[0].object_details.id_field_name],
        inputs: payloads.map((payload) => {
          return {
            id: payload.object_details.id_field_value
          }
        })
      })
    })

    const responses = await Promise.all(requests)

    return this.returnAssociatedRecordsWithIds(groupedPayloads, responses)
  }

  async upsertAssociatedRecords(groupedPayloads: AssociationPayload[][]): Promise<AssociationPayloadWithId[]> {
    const requests = groupedPayloads.map(async (payloads) => {
      const { object_type: objectType } = payloads[0].object_details

      return await this.batchObjectRequest(AssociationSyncMode.Upsert, objectType, {
        inputs: payloads.map((payload) => {
          return {
            idProperty: payload.object_details.id_field_name,
            id: payload.object_details.id_field_value,
            properties: {
              [payload.object_details.id_field_name]: payload.object_details.id_field_value
            }
          }
        })
      })
    })

    const responses = await Promise.all(requests)

    return this.returnAssociatedRecordsWithIds(groupedPayloads, responses)
  }

  returnAssociatedRecordsWithIds(
    groupedPayloads: AssociationPayload[][],
    responses: ModifiedResponse<RespJSON>[]
  ): AssociationPayloadWithId[] {
    responses.forEach((response, index) => {
      const payloads = groupedPayloads[index]
      response?.data?.results.forEach((result) => {
        payloads
          .filter(
            (payload) =>
              payload.object_details.id_field_value ==
              (result.properties[payload.object_details.id_field_name] as string)
          )
          .forEach((payload) => ((payload as AssociationPayloadWithId).object_details.record_id = result.id))
      })
    })

    return groupedPayloads
      .flat()
      .filter((payload) => (payload as AssociationPayloadWithId).object_details.record_id) as AssociationPayloadWithId[]
  }

  // #region Association functions

  async batchAssociationsRequest(body: BatchAssociationsRequestBody, toObjectType: string) {
    return this.request(`${HUBSPOT_BASE_URL}/crm/v4/associations/${this.objectType}/${toObjectType}/batch/create`, {
      method: 'POST',
      json: body
    })
  }

  async sendAssociations(payloads: AssociationPayloadWithId[]) {
    const groupedPayloads: AssociationPayloadWithId[][] = this.groupPayloads(payloads as AssociationPayload[], [
      'object_type'
    ]) as AssociationPayloadWithId[][]

    function getAssociationType(associationLabel: string): AssociationType {
      const [associationCategory, associationTypeId] = associationLabel.split(':')
      return { associationCategory, associationTypeId } as AssociationType
    }

    const requests = groupedPayloads.map(async (payloads) => {
      const toObjectType = payloads[0].object_details.object_type

      const inputs = payloads.map((payload) => {
        const { associationCategory, associationTypeId } = getAssociationType(
          payload.association_details.association_label
        )
        const input = {
          types: [
            {
              associationCategory,
              associationTypeId
            }
          ],
          from: {
            id: payload.object_details.from_record_id
          },
          to: {
            id: payload.object_details.record_id
          }
        }
        return input
      })
      return this.batchAssociationsRequest({ inputs }, toObjectType)
    })

    await Promise.all(requests)
  }

  // #endregion

  // #endregion
}
