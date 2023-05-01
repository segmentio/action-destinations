import AggregateError from 'aggregate-error'
import { CustomError } from 'ts-custom-error'
import { isDirective } from './is-directive'
import { isObject, realTypeOf, Dictionary } from '../real-type-of'
import { MAX_PATTERN_LENGTH, MAX_REPLACEMENT_LENGTH } from './index'

class ValidationError extends CustomError {
  constructor(message: string, stack: string[] = []) {
    super(`/${stack.join('/')} ${message}.`)
  }
}

function flatAggregate(errors: Error[]): Error[] {
  const result: Error[] = []

  errors.forEach((error) => {
    if (error instanceof AggregateError) {
      result.push(...error)
    } else {
      result.push(error)
    }
  })

  return result
}

function realTypeOrDirective(value: unknown) {
  const type = realTypeOf(value)
  if (type === 'object' && Object.keys(value as object).some((k) => k.startsWith('@'))) {
    return 'directive'
  }
  return type
}

type DirectiveValidator = (v: unknown, stack?: string[]) => void

interface DirectiveValidators {
  [directive: string]: DirectiveValidator | undefined
}

const directives: DirectiveValidators = {}

function validateDirective(obj: unknown, stack: string[] = []): void {
  // "allow" non-directive objects so that we can throw a more descriptive error below
  if (!isDirective(obj) && !isObject(obj)) {
    const type = realTypeOf(obj)
    throw new ValidationError(`should be a directive object but it is ${indefiniteArticle(type)} ${type}`, stack)
  }

  const keys = Object.keys(obj)
  const directiveKeys = keys.filter((key) => key.startsWith('@'))

  if (directiveKeys.length > 1) {
    throw new ValidationError(`should only have one @-prefixed key but it has ${directiveKeys.length} keys`, stack)
  }

  // Check that there aren't other keys besides @directive or _metadata
  const otherKeys = keys.filter((key) => !key.startsWith('@') && key !== '_metadata')

  if (otherKeys.length > 0) {
    throw new ValidationError(`should only have one @-prefixed key but it has ${keys.length} keys`, stack)
  }

  const directiveKey = directiveKeys[0]
  const fn = directives[directiveKey]

  if (typeof fn !== 'function') {
    throw new ValidationError(`has an invalid directive: ${directiveKey}`, stack)
  }

  fn(obj[directiveKey], stack)
}

function validateDirectiveOrRaw(v: unknown, stack: string[] = []) {
  const type = realTypeOrDirective(v)
  switch (type) {
    case 'directive':
      return validateDirective(v, stack)
    case 'object':
    case 'array':
    case 'boolean':
    case 'string':
    case 'number':
    case 'null':
      return
    default:
      throw new ValidationError(
        `should be a mapping directive or a JSON value but it is ${indefiniteArticle(type)} ${type}`,
        stack
      )
  }
}

function validateDirectiveOrString(v: unknown, stack: string[] = []) {
  const type = realTypeOrDirective(v)
  switch (type) {
    case 'directive':
      return validateDirective(v, stack)
    case 'string':
      return
    default:
      throw new ValidationError(
        `should be a string or a mapping directive but it is ${indefiniteArticle(type)} ${type}`,
        stack
      )
  }
}

type validator = (v: unknown, stack: string[]) => void
function chain(...validators: validator[]) {
  return (v: unknown, stack: string[] = []) => {
    validators.forEach((validate) => {
      validate(v, stack)
    })
  }
}

function validateStringLength(min: number, max: number) {
  return (v: unknown, stack: string[] = []) => {
    if (typeof v == 'string' && v.length < min) {
      throw new ValidationError(`should be a string of length ${min} or greater`, stack)
    }

    if (typeof v == 'string' && v.length > max) {
      throw new ValidationError(`should be a string of length ${max} or less`, stack)
    }
    return
  }
}

function validateString(v: unknown, stack: string[] = []) {
  const type = realTypeOrDirective(v)
  if (type !== 'string') {
    throw new ValidationError(`should be a string but it is ${indefiniteArticle(type)} ${type}`, stack)
  }
  return
}

function validateBoolean(v: unknown, stack: string[] = []) {
  const type = realTypeOrDirective(v)
  if (type !== 'boolean') {
    throw new ValidationError(`should be a boolean but it is ${indefiniteArticle(type)} ${type}`, stack)
  }
  return
}

function validateObject(value: unknown, stack: string[] = []) {
  const type = realTypeOrDirective(value)
  if (type !== 'object') {
    throw new ValidationError(`should be an object but it is ${indefiniteArticle(type)} ${type}`, stack)
  }

  const obj = value as Dictionary
  const keys = Object.keys(obj)

  const directiveKey = keys.find((k) => k.charAt(0) === '@')
  if (directiveKey) {
    throw new ValidationError(
      `shouldn't have directive (@-prefixed) keys but it has ${JSON.stringify(directiveKey)}`,
      stack
    )
  }

  const errors: Error[] = []
  keys.forEach((k) => {
    try {
      validate(obj[k], [...stack, k])
    } catch (e) {
      errors.push(e)
    }
  })

  if (errors.length) {
    throw new AggregateError(flatAggregate(errors))
  }
}

interface ValidateFields {
  [key: string]: {
    required?: DirectiveValidator
    optional?: DirectiveValidator
  }
}

function validateObjectWithFields(input: unknown, fields: ValidateFields, stack: string[] = []) {
  validateObject(input, stack)

  const errors: Error[] = []
  const obj = input as Dictionary

  Object.entries(fields).forEach(([prop, { required, optional }]) => {
    try {
      if (required) {
        if (obj[prop] === undefined) {
          throw new ValidationError(`should have field ${JSON.stringify(prop)} but it doesn't`, stack)
        }
        required(obj[prop], [...stack, prop])
      } else if (optional) {
        if (obj[prop] !== undefined) {
          optional(obj[prop], [...stack, prop])
        }
      }
    } catch (error) {
      errors.push(error)
    }
  })

  if (errors.length) {
    throw new AggregateError(flatAggregate(errors))
  }
}

function validateArray(arr: unknown, stack: string[] = []): void {
  const type = realTypeOf(arr)

  if (type !== 'array') {
    throw new ValidationError(`should be an array but it is ${indefiniteArticle(type)} ${type}`, stack)
  }
}

function directive(names: string[] | string, fn: DirectiveValidator): void {
  if (!Array.isArray(names)) {
    names = [names]
  }
  names.forEach((name) => {
    directives[name] = (v: unknown, stack: string[] = []) => {
      try {
        fn(v, [...stack, name])
      } catch (e) {
        if (e instanceof ValidationError || e instanceof AggregateError) {
          throw e
        }

        throw new ValidationError(e.message, stack)
      }
    }
  })
}

directive('@if', (v, stack) => {
  validateObjectWithFields(
    v,
    {
      exists: { optional: validateDirectiveOrRaw },
      then: { optional: validateDirectiveOrRaw },
      else: { optional: validateDirectiveOrRaw }
    },
    stack
  )
})

directive('@case', (v, stack) => {
  validateObjectWithFields(
    v,
    {
      operator: { optional: validateString },
      value: { optional: validateDirectiveOrString }
    },
    stack
  )
})

directive('@replace', (v, stack) => {
  validateObjectWithFields(
    v,
    {
      pattern: { required: chain(validateString, validateStringLength(1, MAX_PATTERN_LENGTH)) },
      replacement: { optional: chain(validateString, validateStringLength(0, MAX_REPLACEMENT_LENGTH)) },
      value: { required: validateDirectiveOrString },
      ignorecase: { optional: validateBoolean },
      global: { optional: validateBoolean }
    },
    stack
  )
})

directive('@arrayPath', (v, stack) => {
  const data = v as [unknown, unknown]
  validateArray(data, stack)
  validateDirectiveOrString(data[0], stack)
  validate(data[1], stack)
})

directive('@path', (v, stack) => {
  validateDirectiveOrString(v, stack)
})

directive('@template', (v, stack) => {
  validateDirectiveOrString(v, stack)
})

directive('@literal', (v, stack) => {
  validateDirectiveOrRaw(v, stack)
})

function indefiniteArticle(s: string): string {
  switch (s.charAt(0)) {
    case 'a':
    case 'e':
    case 'i':
    case 'o':
    case 'u':
      return 'an'
    default:
      return 'a'
  }
}

export default function validate(mapping: unknown, stack: string[] = []) {
  switch (realTypeOrDirective(mapping)) {
    case 'directive':
      return validateDirective(mapping, stack)
    case 'object':
      return validateObject(mapping, stack)
    case 'array':
      return validateArray(mapping, stack)
    default:
      // All other types are valid "raw" mappings
      return null
  }
}
