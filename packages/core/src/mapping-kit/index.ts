import { get } from '../get'
import { JSONObject, JSONValue, JSONLike, JSONLikeObject } from '../json-object'
import { isDirective } from './is-directive'
import { render } from './placeholders'
import { realTypeOf, isObject, isArray } from '../real-type-of'
import { removeUndefined } from '../remove-undefined'
import validate from './validate'

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

  if (opts.exists !== undefined) {
    const value = resolve(opts.exists, payload)
    condition = value !== undefined && value !== null
  } else {
    throw new Error('@if requires an "exists" key')
  }

  if (condition && opts.then !== undefined) {
    return resolve(opts.then, payload)
  } else if (!condition && opts.else) {
    return resolve(opts.else, payload)
  }
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
 * *WARNING* This function mutates `mapping` when an object
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

  for (const key of Object.keys(mapping)) {
    const value = mapping[key]
    mapping[key] = resolve(value, payload)
  }

  return mapping
}

export type InputData = { [key: string]: unknown }

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

  const cloned = cloneJson(mapping)
  const resolved = resolve(cloned, data as JSONObject)
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

  return removeUndefined(
    data.map((d) => {
      const cloned = cloneJson(mapping)
      const resolved = resolve(cloned, d as JSONObject)

      return resolved
      // Cast because we know there are no `undefined` values after `removeUndefined`
    })
  ) as JSONObject[]
}

function cloneJson<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}
