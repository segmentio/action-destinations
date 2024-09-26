import {
  Schema,
  SchemaDiff
} from '../types'

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

export async function saveSchemaToCache(_schema: Schema) {
  // no op function until caching implemented
}