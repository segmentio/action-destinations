// @ts-ignore no types
import { AggregateAjvError } from '@segment/ajv-human-errors'
import Ajv from 'ajv'
import dayjs from 'dayjs'

const ajv = new Ajv({
  // Coerce types to be a bit more liberal.
  coerceTypes: true,
  // Return all validation errors, not just the first.
  allErrors: true,
  // Include reference to schema and data in error values.
  verbose: true,
  // Remove properties not defined the schema object
  removeAdditional: true,
  // Use a more parse-able format for JSON paths.
  jsonPointers: true
})

// Extend with additional supported formats for action `fields`
ajv.addFormat('password', () => true)
ajv.addFormat('text', () => true)
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
}

/**
 * Validates an object against a json schema
 * and caches the schema for subsequent validations when a key is provided
 */
export function validateSchema(obj: unknown, schema: object, options?: ValidationOptions) {
  const { schemaKey, throwIfInvalid = true } = options ?? {}
  let validate: Ajv.ValidateFunction

  if (schemaKey) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    validate = ajv.getSchema(schemaKey) || ajv.addSchema(schema, schemaKey).getSchema(schemaKey)!
  } else {
    validate = ajv.compile(schema)
  }

  const isValid = validate(obj) as boolean

  if (throwIfInvalid && !isValid) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    throw new AggregateAjvError(validate.errors)
  }

  return isValid
}
