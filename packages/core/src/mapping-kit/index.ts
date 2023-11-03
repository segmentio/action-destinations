import { get } from '../get'
import { JSONObject, JSONValue, JSONLike, JSONLikeObject } from '../json-object'
import { isDirective } from './is-directive'
import { render } from './placeholders'
import { realTypeOf, isObject, isArray } from '../real-type-of'
import { removeUndefined } from '../remove-undefined'
import validate from './validate'
import { arrify } from '../arrify'

export type InputData = { [key: string]: unknown }
export type Features = { [key: string]: boolean }
type Directive = (options: JSONValue, payload: JSONObject) => JSONLike
type StringDirective = (value: string, payload: JSONObject) => JSONLike

interface Directives {
  [directive: string]: Directive | undefined
}

const directives: Directives = {}
const directiveRegExp = /^@[a-z][a-zA-Z0-9]+$/

function registerDirective(name: string, fn: Directive): void {
  if (!directiveRegExp.exec(name)) {
    throw new Error(`"${name}" is an invalid directive name`)
  }

  directives[name] = fn
}

function registerStringDirective(name: string, fn: StringDirective): void {
  registerDirective(name, (value, payload) => {
    const str = resolve(value, payload)
    if (typeof str !== 'string') {
      throw new Error(`${name}: expected string, got ${realTypeOf(str)}`)
    }

    return fn(str, payload)
  })
}

function runDirective(obj: JSONObject, payload: JSONObject): JSONLike {
  const name = Object.keys(obj).find((key) => key.startsWith('@')) as string
  const directiveFn = directives[name]
  const value = obj[name]

  if (typeof directiveFn !== 'function') {
    throw new Error(`${name} is not a valid directive, got ${realTypeOf(directiveFn)}`)
  }

  return directiveFn(value, payload)
}

registerDirective('@if', (opts, payload) => {
  let condition = false

  if (!isObject(opts)) {
    throw new Error('@if requires an object with an "exists" key')
  }

  if (!opts.exists && !opts.blank) {
    throw new Error('@if requires an "exists" key or a "blank" key')
  } else if (opts.exists !== undefined) {
    const value = resolve(opts.exists, payload)
    condition = value !== undefined && value !== null
  } else if (opts.blank !== undefined) {
    const value = resolve(opts.blank, payload)
    condition = value !== undefined && value !== null && value != ''
  }

  if (condition && opts.then !== undefined) {
    return resolve(opts.then, payload)
  } else if (!condition && opts.else) {
    return resolve(opts.else, payload)
  }
})

registerDirective('@case', (opts, payload) => {
  if (!isObject(opts)) {
    throw new Error('@case requires an object with a "operator" key')
  }

  if (!opts.operator) {
    throw new Error('@case requires a "operator" key')
  }

  const operator = opts.operator
  if (opts.value) {
    const value = resolve(opts.value, payload)
    if (typeof value === 'string') {
      switch (operator) {
        case 'lower':
          return value.toLowerCase()
        case 'upper':
          return value.toUpperCase()
        default:
          throw new Error('operator key should have a value of "lower" or "upper"')
      }
    }
    return value
  }
})

export const MAX_PATTERN_LENGTH = 10
export const MAX_REPLACEMENT_LENGTH = 10
registerDirective('@replace', (opts, payload) => {
  if (!isObject(opts)) {
    throw new Error('@replace requires an object with a "pattern" key')
  }

  if (!opts.pattern) {
    throw new Error('@replace requires a "pattern" key')
  }

  // Assume null/missing replacement means empty
  if (opts.replacement == null) {
    // Empty replacement string is ok
    opts.replacement = ''
  }

  // case sensitive by default if this key is missing
  if (opts.ignorecase == null) {
    opts.ignorecase = false
  }

  // global by default if this key is missing
  if (opts.global == null) {
    opts.global = true
  }

  let pattern = opts.pattern
  const replacement = opts.replacement
  const ignorecase = opts.ignorecase
  const isGlobal = opts.global
  if (opts.value) {
    const value = resolve(opts.value, payload)
    if (
      typeof value === 'string' &&
      typeof pattern === 'string' &&
      typeof replacement === 'string' &&
      typeof ignorecase === 'boolean' &&
      typeof isGlobal === 'boolean'
    ) {
      if (pattern.length > MAX_PATTERN_LENGTH) {
        throw new Error(`@replace requires a "pattern" less than ${MAX_PATTERN_LENGTH} characters`)
      }

      if (replacement.length > MAX_REPLACEMENT_LENGTH) {
        throw new Error(`@replace requires a "replacement" less than ${MAX_REPLACEMENT_LENGTH} characters`)
      }

      // We don't want users providing regular expressions for the pattern (for now)
      // https://stackoverflow.com/questions/F3115150/how-to-escape-regular-expression-special-characters-using-javascript
      pattern = pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
      let flags = ''
      if (isGlobal) {
        flags += 'g'
      }
      if (ignorecase) {
        flags += 'i'
      }
      return value.replace(new RegExp(pattern, flags), replacement)
    }
  }
})

registerDirective('@arrayPath', (data, payload) => {
  if (!Array.isArray(data)) {
    throw new Error(`@arrayPath expected array, got ${realTypeOf(data)}`)
  }

  const [path, itemShape] = data as [string, undefined | JSONObject]
  const root = typeof path === 'string' ? (get(payload, path.replace('$.', '')) as JSONLike) : resolve(path, payload)

  // If a shape has been provided, resolve each item in the array with this shape
  if (
    ['object', 'array'].includes(realTypeOf(root)) &&
    realTypeOf(itemShape) === 'object' &&
    Object.keys(itemShape as JSONObject).length > 0
  ) {
    return arrify(root).map((item) => resolve(itemShape, item as JSONObject))
  }

  return root
})

registerStringDirective('@path', (path, payload) => {
  return get(payload, path.replace('$.', ''))
})

registerStringDirective('@template', (template: string, payload) => {
  return render(template, payload)
})

// Literal should be used in place of 'empty' template strings as they will not resolve correctly
registerDirective('@literal', (value, payload) => {
  return resolve(value, payload)
})

/**
 * Resolves a mapping value/object by applying the input payload based on directives
 * @param mapping - the mapping directives or raw values to resolve
 * @param payload - the input data to apply to the mapping directives
 * @todo support arrays or array directives?
 */
function resolve(mapping: JSONLike, payload: JSONObject): JSONLike {
  if (!isObject(mapping) && !isArray(mapping)) {
    return mapping
  }

  if (isDirective(mapping)) {
    return runDirective(mapping, payload)
  }

  if (Array.isArray(mapping)) {
    return mapping.map((value) => resolve(value, payload))
  }

  const resolved: JSONLikeObject = {}

  for (const key of Object.keys(mapping)) {
    resolved[key] = resolve(mapping[key], payload)
  }

  return resolved
}

/**
 * Validates and transforms a mapping by applying the input payload
 * based on the directives and raw values defined in the mapping object
 * @param mapping - the directives and raw values
 * @param data - the input data to apply to directives
 */
export function transform(mapping: JSONLikeObject, data: InputData | undefined = {}): JSONObject {
  const realType = realTypeOf(data)
  if (realType !== 'object') {
    throw new Error(`data must be an object, got ${realType}`)
  }

  // throws if the mapping config is invalid
  validate(mapping)

  const resolved = resolve(mapping, data as JSONObject)
  const cleaned = removeUndefined(resolved)

  // Cast because we know there are no `undefined` values anymore
  return cleaned as JSONObject
}

/**
 * Validates and transforms a mapping across multiple payloads
 * @param mapping - the directives and raw values
 * @param data - the array input data to apply to directives
 */
export function transformBatch(mapping: JSONLikeObject, data: Array<InputData> | undefined = []): JSONObject[] {
  const realType = realTypeOf(data)
  if (!isArray(data)) {
    throw new Error(`data must be an array, got ${realType}`)
  }

  // throws if the mapping config is invalid
  validate(mapping)

  const resolved = data.map((d) => resolve(mapping, d as JSONObject))

  // Cast because we know there are no `undefined` values after `removeUndefined`
  return removeUndefined(resolved) as JSONObject[]
}
