import { AggregateAjvError } from '@segment/ajv-human-errors'
import Ajv, { ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import dayjs from 'dayjs'
import type { JSONSchema4 } from 'json-schema'
import { arrifyFields } from './arrify'
import { StatsContext } from './destination-kit'

// `addFormats` includes many standard formats we use like `uri`, `date`, `email`, etc.
const ajv = addFormats(
  new Ajv({
    // Coerce types to be a bit more liberal.
    coerceTypes: 'array',
    // Return all validation errors, not just the first.
    allErrors: true,
    // Allow multiple non-null types in `type` keyword.
    allowUnionTypes: true,
    // Include reference to schema and data in error values.
    verbose: true,
    // Remove properties not defined the schema object
    removeAdditional: true
  })
)

// Extend with additional supported formats for action `fields`
ajv.addFormat('text', true)
ajv.addFormat('date-like', (data: string) => {
  let date = dayjs(data)

  if (String(Number(data)) === data) {
    // parse as unix
    if (data.length === 13) {
      date = dayjs(Number(data))
    }

    date = dayjs.unix(Number(data))
  }

  return date.isValid()
})

interface ValidationOptions {
  schemaKey?: string
  throwIfInvalid?: boolean
  statsContext?: StatsContext
}

/**
 * Validates an object against a json schema
 * and caches the schema for subsequent validations when a key is provided
 */
export function validateSchema(obj: unknown, schema: JSONSchema4, options?: ValidationOptions) {
  const { schemaKey, throwIfInvalid = true, statsContext } = options ?? {}
  let validate: ValidateFunction

  if (schemaKey) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    validate = ajv.getSchema(schemaKey) || ajv.addSchema(schema, schemaKey).getSchema(schemaKey)!
  } else {
    validate = ajv.compile(schema)
  }

  // Ajv's `coerceTypes: 'array'` only works on scalars, so we need to manually arrify ourselves!
  arrifyFields(obj, schema)
  const isValid = validate(obj)

  if (throwIfInvalid && !isValid && validate.errors) {
    statsContext?.statsClient?.incr('ajv.discard', 1, statsContext.tags)
    throw new AggregateAjvError(validate.errors)
  }

  return isValid
}
