import { PayloadValidationError, IntegrationError, ModifiedResponse } from '@segment/actions-core'
import { Client } from './client'
import {
  CreatePropsReq,
  HSPropTypeFieldType,
  CreatePropsReqItem,
  Prop,
  ReadPropsResp,
  Result,
  Schema,
  SchemaDiff,
  SchemaMatch,
} from './types'

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

  const responses = await Promise.all(requests)

  const schemaDiff = {
    object_details: {
      object_type: schema.object_details.object_type,
      id_field_name: schema.object_details.id_field_name
    }
  } as SchemaDiff

  if (hasProps && requests.length > 0) {
    const response = responses.shift() as ModifiedResponse<ReadPropsResp>
    const { missingProps, match } = determineMissingPropsAndMatchType(response, schema.properties)
    schemaDiff.missingProperties = missingProps
    schemaDiff.match = match
  }

  if (hasSensitiveProps && requests.length > 0) {
    const response = responses.shift() as ModifiedResponse<ReadPropsResp>
    const { missingProps, match } = determineMissingPropsAndMatchType(response, schema.sensitiveProperties)
    schemaDiff.missingSensitiveProperties = missingProps
    if (schemaDiff.match === SchemaMatch.FullMatch) {
      schemaDiff.match = match
    }
  }

  return schemaDiff
}

function determineMissingPropsAndMatchType(
  response: ModifiedResponse<ReadPropsResp>,
  properties: Prop[]
): { missingProps: Prop[]; match: SchemaMatch } {
  const results = response.data.results ?? []
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

  const input = (prop: Prop, sensitive: boolean): CreatePropsReqItem => {
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

  const json: CreatePropsReq = {
    inputs: [
      ...(props ? props.map((p) => input(p, false)) : []),
      ...(sensitiveProps ? sensitiveProps.map((p) => input(p, true)) : [])
    ]
  } as CreatePropsReq

  await client.createPropertiesDefinition(json)
}