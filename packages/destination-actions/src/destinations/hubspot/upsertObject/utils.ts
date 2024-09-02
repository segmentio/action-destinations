import { PayloadValidationError, IntegrationError, ModifiedResponse } from '@segment/actions-core'
import { Payload } from './generated-types'
import { MAX_HUBSPOT_BATCH_SIZE, OBJECT_NOT_FOUND_ERROR_RESPONSE } from './constants'
import { Client } from './client'
import {
  AssociationPayload,
  AssociationPayloadWithId,
  AssociationSyncMode,
  AssociationType,
  BatchRequestType,
  CreateJSON,
  CreatePropsDefinitionReq,
  GroupableFields,
  HSPropFieldType,
  HSPropType,
  HSPropTypeFieldType,
  Input,
  PayloadWithFromId,
  Prop,
  ReadJSON,
  ReadType,
  ResponseType,
  RespJSON,
  Result,
  Schema,
  SchemaDiff,
  SchemaMatch,
  SyncMode,
  UpsertJSON
} from './types'

export function validate(payloads: Payload[]): Payload[] {
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
    payload.properties = cleanPropObj(payload.properties)
    payload.sensitive_properties = cleanPropObj(payload.sensitive_properties)

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

function cleanPropObj(
  obj: { [k: string]: unknown } | undefined
): { [k: string]: string | number | boolean } | undefined {
  const cleanObj: { [k: string]: string | number | boolean } = {}

  if (obj === undefined) {
    return undefined
  }

  Object.keys(obj).forEach((key) => {
    const value = obj[key]
    const cleanKey = cleanProp(key)

    if (typeof value === 'boolean' || typeof value === 'number') {
      cleanObj[cleanKey] = value
    } else if (typeof value === 'string' && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
      // If the value can be cast to a boolean
      cleanObj[cleanKey] = value.toLowerCase() === 'true'
    } else if (!isNaN(Number(value))) {
      // If the value can be cast to a number
      cleanObj[cleanKey] = Number(value)
    } else if (typeof value === 'object' && value !== null) {
      // If the value is an object
      cleanObj[cleanKey] = JSON.stringify(value)
    } else {
      // If the value is anything else then stringify it
      cleanObj[cleanKey] = String(value)
    }
  })

  return cleanObj
}

function cleanProp(str: string): string {
  str = str.toLowerCase().replace(/[^a-z0-9_]/g, '_')

  if (!/^[a-z]/.test(str)) {
    throw new PayloadValidationError(
      `Property ${str} in event has an invalid name. Property names must start with a letter.`
    )
  }

  return str
}

export function objectSchema(payloads: Payload[], objectType: string): Schema {
  const extractProperties = (propertyType: 'properties' | 'sensitive_properties'): Prop[] => {
    return Object.values(
      payloads.reduce((acc, payload) => {
        const properties = payload[propertyType]
        if (properties) {
          Object.entries(properties).forEach(([propName, value]) => {
            const typeData = format(value)
            acc[propName] = {
              name: propName,
              type: typeData.type,
              fieldType: typeData.fieldType,
              typeFieldType: formatHS(typeData.type, typeData.fieldType)
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
      object_type: objectType,
      id_field_name: payloads[0].object_details.id_field_name
    },
    properties,
    sensitiveProperties
  }
}

function format(value: unknown): { type: HSPropType; fieldType: HSPropFieldType } {
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

function formatHS(type: HSPropType, fieldType: HSPropFieldType): HSPropTypeFieldType {
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

export async function compareToCache(schema: Schema): Promise<SchemaDiff> {
  // no op function until caching implemented

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

export async function sendFromRecords(
  client: Client,
  payloads: Payload[],
  objectType: string,
  syncMode: SyncMode
): Promise<PayloadWithFromId[]> {
  switch (syncMode) {
    case SyncMode.Upsert: {
      return await upsertRecords(client, payloads, objectType)
    }

    case SyncMode.Update: {
      return await updateRecords(client, payloads, objectType)
    }

    case SyncMode.Add: {
      return await addRecords(client, payloads, objectType)
    }
  }
}

async function upsertRecords(client: Client, payloads: Payload[], objectType: string): Promise<PayloadWithFromId[]> {
  const response = await client.batchObjectRequest(BatchRequestType.Upsert, objectType, {
    inputs: payloads.map(({ object_details: { id_field_value }, properties, sensitive_properties }) => {
      const idFieldName = payloads[0].object_details.id_field_name
      return {
        idProperty: idFieldName,
        id: id_field_value,
        properties: { ...properties, ...sensitive_properties, [idFieldName]: id_field_value }
      }
    })
  } as UpsertJSON)

  return returnRecordsWithIds(payloads, response)
}

async function updateRecords(client: Client, payloads: Payload[], objectType: string): Promise<PayloadWithFromId[]> {
  const existingRecords = (await readRecords(
    client,
    payloads,
    objectType,
    ReadType.ReturnRecordsWithIds
  )) as unknown as Payload[]

  const response = await client.batchObjectRequest(BatchRequestType.Update, objectType, {
    inputs: existingRecords.map(({ object_details: { id_field_value }, properties, sensitive_properties }) => {
      const idFieldName = payloads[0].object_details.id_field_name
      return {
        idProperty: idFieldName,
        id: id_field_value,
        properties: { ...properties, ...sensitive_properties }
      }
    })
  } as UpsertJSON)

  return returnRecordsWithIds(existingRecords, response)
}

async function addRecords(client: Client, payloads: Payload[], objectType: string): Promise<PayloadWithFromId[]> {
  const recordsToCreate = (await readRecords(
    client,
    payloads,
    objectType,
    ReadType.ReturnRecordsWithoutIds
  )) as Payload[]

  const response: ModifiedResponse<RespJSON> = await client.batchObjectRequest(BatchRequestType.Create, objectType, {
    inputs: recordsToCreate.map(
      ({ object_details: { id_field_value: fromIdFieldValue }, properties, sensitive_properties }) => {
        const idFieldName = payloads[0].object_details.id_field_name
        return {
          idProperty: idFieldName,
          properties: { ...properties, ...sensitive_properties, [idFieldName]: fromIdFieldValue }
        }
      }
    )
  } as CreateJSON)

  return returnRecordsWithIds(recordsToCreate, response)
}

async function readRecords(
  client: Client,
  payloads: Payload[],
  objectType: string,
  readType: ReadType
): Promise<PayloadWithFromId[] | Payload[]> {
  const idFieldName = payloads[0].object_details.id_field_name

  const readResponse = await client.batchObjectRequest(BatchRequestType.Read, objectType, {
    properties: [idFieldName],
    idProperty: idFieldName,
    inputs: payloads.map((payload) => {
      return { id: payload.object_details.id_field_value }
    })
  } as ReadJSON)

  switch (readType) {
    case ReadType.ReturnRecordsWithIds:
      return returnRecordsWithIds(payloads, readResponse)
    case ReadType.ReturnRecordsWithoutIds:
      return returnRecordsWithoutIds(payloads, readResponse)
  }
}

function returnRecordsWithIds(payloads: Payload[], response: ModifiedResponse<RespJSON>): PayloadWithFromId[] {
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

function returnRecordsWithoutIds(payloads: Payload[], response: ModifiedResponse<RespJSON>): Payload[] {
  const missingRecords = payloads.filter((payload) => {
    return !response.data.results.some((result) => {
      return result.properties[payload.object_details.id_field_name] === payload.object_details.id_field_value
    })
  })

  return missingRecords
}

export function createAssociationPayloads(payloads: PayloadWithFromId[]): AssociationPayload[][] {
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

  return groupPayloads(associationPayloads, ['object_type', 'id_field_name'])
}

function groupPayloads(associations: AssociationPayload[], groupBy: (keyof GroupableFields)[]): AssociationPayload[][] {
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

export async function sendAssociatedRecords(
  client: Client,
  payloads: AssociationPayload[][],
  associationSyncMode: AssociationSyncMode
): Promise<AssociationPayloadWithId[]> {
  switch (associationSyncMode) {
    case AssociationSyncMode.Upsert: {
      return await upsertAssociatedRecords(client, payloads)
    }
    case AssociationSyncMode.Read: {
      return await readAssociatedRecords(client, payloads)
    }
  }
}

async function readAssociatedRecords(
  client: Client,
  groupedPayloads: AssociationPayload[][]
): Promise<AssociationPayloadWithId[]> {
  const requests = groupedPayloads.map(async (payloads) => {
    const { object_type: objectType } = payloads[0].object_details

    return await client.batchObjectRequest(AssociationSyncMode.Read, objectType, {
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

  return returnAssociatedRecordsWithIds(groupedPayloads, responses)
}

async function upsertAssociatedRecords(
  client: Client,
  groupedPayloads: AssociationPayload[][]
): Promise<AssociationPayloadWithId[]> {
  const requests = groupedPayloads.map(async (payloads) => {
    const { object_type: objectType } = payloads[0].object_details

    return await client.batchObjectRequest(AssociationSyncMode.Upsert, objectType, {
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

  return returnAssociatedRecordsWithIds(groupedPayloads, responses)
}

function returnAssociatedRecordsWithIds(
  groupedPayloads: AssociationPayload[][],
  responses: ModifiedResponse<RespJSON>[]
): AssociationPayloadWithId[] {
  responses.forEach((response, index) => {
    const payloads = groupedPayloads[index]
    response?.data?.results.forEach((result) => {
      payloads
        .filter(
          (payload) =>
            payload.object_details.id_field_value == (result.properties[payload.object_details.id_field_name] as string)
        )
        .forEach((payload) => ((payload as AssociationPayloadWithId).object_details.record_id = result.id))
    })
  })

  return groupedPayloads
    .flat()
    .filter((payload) => (payload as AssociationPayloadWithId).object_details.record_id) as AssociationPayloadWithId[]
}

export async function sendAssociations(client: Client, payloads: AssociationPayloadWithId[]) {
  const groupedPayloads: AssociationPayloadWithId[][] = groupPayloads(payloads as AssociationPayload[], [
    'object_type'
  ]) as AssociationPayloadWithId[][]

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
    return client.batchAssociationsRequest({ inputs }, toObjectType)
  })

  await Promise.all(requests)
}

function getAssociationType(associationLabel: string): AssociationType {
  const [associationCategory, associationTypeId] = associationLabel.split(':')
  return { associationCategory, associationTypeId } as AssociationType
}

export async function compareToHubspot(client: Client, schema: Schema): Promise<SchemaDiff> {
  const requests = []
  const hasProps = schema.properties.length
  const hasSensitiveProps = schema.sensitiveProperties.length

  if (hasProps) {
    requests.push(client.readProperties(false))
  }

  if (hasSensitiveProps) {
    requests.push(client.readProperties(true))
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
    const { missingProps, match } = determineMissingPropsAndMatchType(response as ResponseType, schema.properties)
    schemaDiff.missingProperties = missingProps
    schemaDiff.match = match
  }

  if (hasSensitiveProps && requests.length > 0) {
    const response = responses.shift()
    const { missingProps, match } = determineMissingPropsAndMatchType(
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

function determineMissingPropsAndMatchType(
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

        checkForIncompatiblePropTypes(prop, match)

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

function checkForIncompatiblePropTypes(prop: Prop, hubspotProp?: Result) {
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

export async function saveSchemaToCache(_schema: Schema) {
  // no op function until caching implemented
}

export async function createProperties(client: Client, schemaDiff: SchemaDiff, propertyGroup?: string) {
  if (!propertyGroup) {
    throw new PayloadValidationError(
      '"Property Group" is a required field when creating properties on an Object Schema in Hubspot'
    )
  }

  if (schemaDiff.missingProperties.length === 0 && schemaDiff.missingSensitiveProperties.length === 0) {
    return
  }

  const { missingProperties: props, missingSensitiveProperties: sensitiveProps } = schemaDiff

  const input = (prop: Prop, sensitive: boolean): Input => {
    switch (prop.typeFieldType) {
      case HSPropTypeFieldType.NumberNumber:
        return {
          name: prop.name,
          label: prop.name,
          groupName: propertyGroup,
          type: 'number',
          dataSensitivity: sensitive === true ? 'sensitive' : undefined,
          fieldType: 'number'
        }
      case HSPropTypeFieldType.StringText:
        return {
          name: prop.name,
          label: prop.name,
          groupName: propertyGroup,
          type: 'string',
          dataSensitivity: sensitive === true ? 'sensitive' : undefined,
          fieldType: 'text'
        }
      case HSPropTypeFieldType.EnumerationBooleanCheckbox:
        return {
          name: prop.name,
          label: prop.name,
          groupName: propertyGroup,
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
          groupName: propertyGroup,
          type: 'datetime',
          dataSensitivity: sensitive === true ? 'sensitive' : undefined,
          fieldType: 'date'
        }
      case HSPropTypeFieldType.DateDate:
        return {
          name: prop.name,
          label: prop.name,
          groupName: propertyGroup,
          type: 'date',
          dataSensitivity: sensitive === true ? 'sensitive' : undefined,
          fieldType: 'date'
        }
    }
  }

  const json: CreatePropsDefinitionReq = {
    inputs: [
      ...(props ? props.map((p) => input(p, false)) : []),
      ...(sensitiveProps ? sensitiveProps.map((p) => input(p, true)) : [])
    ]
  } as CreatePropsDefinitionReq

  await client.createPropertiesDefinition(json)
}
