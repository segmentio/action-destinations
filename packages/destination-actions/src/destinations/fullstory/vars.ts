import camelCase from 'lodash/camelCase'

const isString = (x: any) => typeof x === 'string'

const isBool = (x: any) => typeof x === 'boolean'

const isReal = (x: any) => typeof x === 'number'

const isInt = (x: any) => typeof x === 'number' && x - Math.floor(x) === 0

const isDate = (x: any) => {
  if (!x) {
    return false
  }
  if (x.constructor === Date) {
    return !isNaN(x as any)
  }
  return false
}

const isArrayOf = (f: (val: any) => boolean) => {
  return function (x: any): boolean {
    if (!(x instanceof Array)) {
      return false
    }
    for (let i = 0; i < x.length; i++) {
      if (!f(x[i])) {
        return false
      }
    }
    return true
  }
}

const isObject = (x: any) => x && typeof x === 'object'

const typeValidators: Readonly<Record<string, (_: any) => boolean>> = {
  str: isString,
  bool: isBool,
  real: isReal,
  // Even though we won't infer an int type suffix since real will be preferred, we maintain int and
  // ints in this map since keys are also used to check for known type suffixes which we preserve.
  int: isInt,
  date: isDate,
  strs: isArrayOf(isString),
  bools: isArrayOf(isBool),
  reals: isArrayOf(isReal),
  ints: isArrayOf(isInt),
  dates: isArrayOf(isDate),
  objs: isArrayOf(isObject),
  obj: isObject
}

const inferType = (value: any) => {
  for (const t in typeValidators) {
    if (typeValidators[t](value)) {
      return t
    }
  }
  return null
}

const isKnownTypeSuffix = (suffix: string) => !!typeValidators[suffix]

/**
 * Camel cases `.`, `-`, `_`, and white space within property names. Preserves type suffix casing.
 *
 * NOTE: Does not fix otherwise malformed fieldNames.
 *
 * @param {string} name
 */
const camelCasePropertyName = (name: string) => {
  // Do not camel case known type suffixes.
  const parts = name.split('_')
  if (parts.length > 1) {
    const typeSuffix = parts.pop()
    if (typeSuffix && typeValidators[typeSuffix]) {
      return camelCase(parts.join('_')) + '_' + typeSuffix
    }
  }

  // No type suffix found. Camel case the whole field name.
  return camelCase(name)
}

const typeSuffixPropertyName = (name: string, value: unknown) => {
  const valueTypeName = typeof value

  if (valueTypeName === 'undefined') {
    // We can't infer the type for undefined values
    return name
  }

  const lastUnderscore = name.lastIndexOf('_')

  if (lastUnderscore === -1 || !isKnownTypeSuffix(name.substring(lastUnderscore + 1))) {
    // Either no type suffix or the name contains an underscore with an unknown suffix.
    const maybeType = inferType(value)
    if (maybeType === null) {
      // We can't infer the type. Don't change the property name.
      return name
    }

    return `${name}_${maybeType}`
  }

  return name
}

/**
 * Normalizes first level property names according to FullStory API custom var expectations. Type suffixes
 * will be added to first level property names when a known type suffix isn't present and the type can be
 * inferred. First level property names will also be camel cased if specified, preserving any known type
 * suffixes.
 *
 * @param obj The source object.
 * @param options Extended normalization options, including whether to camel case property names.
 * @returns A new object with first level property names normalized.
 */
export const normalizePropertyNames = (obj?: {}, options?: { camelCase?: boolean }): Record<string, unknown> => {
  if (!obj) {
    return {}
  }

  const normalizePropertyName = (name: string, value: unknown) => {
    let transformedName = name
    if (options?.camelCase) {
      transformedName = camelCasePropertyName(name)
    }
    return typeSuffixPropertyName(transformedName, value)
  }

  return Object.entries(obj).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [normalizePropertyName(key, value)]: value
    }),
    {}
  )
}
