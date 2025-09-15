import { PayloadValidationError, ModifiedResponse } from '@segment/actions-core'
import { Client } from '../client'
import { formatHS } from './schema-functions'
import {
  CreatePropsReq,
  HSPropTypeFieldType,
  CreatePropsReqItem,
  Prop,
  ReadPropsResp,
  Result,
  CachableSchema,
  SchemaDiff
} from '../types'

export async function getSchemaFromHubspot(client: Client, schema: CachableSchema): Promise<CachableSchema> {
  const requests = []
  const hasProps = schema.properties.length
  const hasSensitiveProps = schema.sensitiveProperties.length
  const hsSchema: CachableSchema = {
    object_details: schema.object_details,
    properties: [],
    sensitiveProperties: []
  }
  if (hasProps) {
    requests.push(client.readProperties(false))
  }
  if (hasSensitiveProps) {
    requests.push(client.readProperties(true))
  }
  const responses = await Promise.all(requests)
  if (hasProps && requests.length > 0) {
    const response = responses.shift() as ModifiedResponse<ReadPropsResp>
    hsSchema.properties = extractProperties(response)
  }
  if (hasSensitiveProps && requests.length > 0) {
    const response = responses.shift() as ModifiedResponse<ReadPropsResp>
    hsSchema.sensitiveProperties = extractProperties(response)
  }
  return hsSchema
}

function extractProperties(response: ModifiedResponse<ReadPropsResp>): Prop[] {
  const results = response.data.results ?? []
  const props: Prop[] = []

  results.forEach((item: Result) => {
    const hSPropTypeFieldType = formatHS(item.type, item.fieldType)
    if (hSPropTypeFieldType) {
      props.push({
        name: item.name,
        type: item.type,
        fieldType: item.fieldType,
        typeFieldType: hSPropTypeFieldType
      })
    }
  })

  return props
}

export async function createProperties(client: Client, schemaDiff: SchemaDiff, propertyGroup?: string) {
  if (!propertyGroup) {
    throw new PayloadValidationError(
      '"Property Group" is a required field when creating properties on an Object Schema in Hubspot'
    )
  }

  if (schemaDiff?.missingProperties?.length === 0 && schemaDiff?.missingSensitiveProperties?.length === 0) {
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
      case HSPropTypeFieldType.StringTextArea:
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
