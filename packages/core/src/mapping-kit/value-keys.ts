type ValueType = 'enrichment' | 'function' | 'literal' | 'variable'

function isObject(value: any): value is object {
  return value !== null && typeof value === 'object'
}

export interface DirectiveMetadata {
  _metadata?: {
    label?: string
    type: ValueType
  }
}

export function isDirective(value: FieldValue): value is Directive {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.keys(value).some((key) =>
      [
        '@if',
        '@path',
        '@template',
        '@literal',
        '@arrayPath',
        '@case',
        '@replace',
        '@json',
        '@flatten',
        '@merge',
        '@transform',
        '@excludeWhenNull'
      ].includes(key)
    )
  )
}

export interface LiteralDirective extends DirectiveMetadata {
  '@literal': PrimitiveValue | Record<string, FieldValue>
}

export function isLiteralDirective(value: FieldValue): value is LiteralDirective {
  return isDirective(value) && '@literal' in value
}
export interface TemplateDirective extends DirectiveMetadata {
  '@template': string
}

export function isTemplateDirective(value: FieldValue): value is TemplateDirective {
  return isDirective(value) && '@template' in value
}

export function getFieldValue(value: FieldValue): unknown {
  if (isTemplateDirective(value)) {
    return value['@template']
  }

  return value
}

export interface PathDirective extends DirectiveMetadata {
  '@path': string
}

export function isPathDirective(value: FieldValue): value is PathDirective {
  return isDirective(value) && '@path' in value
}

type RequireOnlyOne<T, Keys extends keyof T = keyof T> = {
  [K in Keys]-?: Partial<Record<Exclude<Keys, K>, undefined>> & Required<Pick<T, K>>
}[Keys] &
  Pick<T, Exclude<keyof T, Keys>>

export interface IfDirective extends DirectiveMetadata {
  '@if': RequireOnlyOne<
    {
      blank?: FieldValue
      else?: FieldValue
      exists?: FieldValue
      then: FieldValue
    },
    'blank' | 'exists'
  >
}

export function isIfDirective(value: FieldValue): value is IfDirective {
  return (
    isDirective(value) &&
    '@if' in value &&
    value['@if'] !== null &&
    typeof value['@if'] === 'object' &&
    ('exists' in value['@if'] || 'blank' in value['@if'])
  )
}

export interface ArrayPathDirective extends DirectiveMetadata {
  '@arrayPath': [Directive | string, { [key: string]: FieldValue } | undefined] | [Directive | string]
}

export function isArrayPathDirective(value: FieldValue): value is ArrayPathDirective {
  return isDirective(value) && '@arrayPath' in value && Array.isArray(value['@arrayPath'])
}

export interface CaseDirective extends DirectiveMetadata {
  '@case': {
    operator: string
    value?: FieldValue
  }
}

export function isCaseDirective(value: FieldValue): value is CaseDirective {
  return (
    isDirective(value) &&
    '@case' in value &&
    value['@case'] !== null &&
    typeof value['@case'] === 'object' &&
    'operator' in value['@case']
  )
}

export interface ReplaceDirective extends DirectiveMetadata {
  '@replace': {
    global: PrimitiveValue
    ignorecase: PrimitiveValue
    pattern: string
    replacement: string
    pattern2: string
    replacement2: string
    value?: FieldValue
  }
}

export function isReplaceDirective(value: FieldValue): value is ReplaceDirective {
  return (
    isDirective(value) &&
    '@replace' in value &&
    value['@replace'] !== null &&
    typeof value['@replace'] === 'object' &&
    'pattern' in value['@replace']
  )
}

export interface JSONDirective extends DirectiveMetadata {
  '@json': {
    value: FieldValue
    mode: PrimitiveValue
  }
}

export function isJSONDirective(value: FieldValue): value is JSONDirective {
  return (
    isDirective(value) &&
    '@json' in value &&
    value['@json'] !== null &&
    typeof value['@json'] === 'object' &&
    'value' in value['@json']
  )
}

export interface FlattenDirective extends DirectiveMetadata {
  '@flatten': {
    value: FieldValue
    separator: string
  }
}

export function isFlattenDirective(value: FieldValue): value is FlattenDirective {
  return (
    isDirective(value) &&
    '@flatten' in value &&
    value['@flatten'] !== null &&
    typeof value['@flatten'] === 'object' &&
    'value' in value['@flatten']
  )
}

export interface MergeDirective extends DirectiveMetadata {
  '@merge': {
    objects: { [key: string]: FieldValue }[]
    direction: 'left' | 'right'
  }
}

export function isMergeDirective(value: FieldValue): value is MergeDirective {
  return (
    isDirective(value) &&
    '@merge' in value &&
    value['@merge'] !== null &&
    typeof value['@merge'] === 'object' &&
    'objects' in value['@merge']
  )
}

export interface TransformDirective extends DirectiveMetadata {
  '@transform': {
    apply: FieldValue
    mapping: FieldValue
  }
}

export function isTransformDirective(value: FieldValue): value is TransformDirective {
  return (
    isDirective(value) &&
    '@transform' in value &&
    value['@transform'] !== null &&
    typeof value['@transform'] === 'object' &&
    'apply' in value['@transform'] &&
    'mapping' in value['@transform']
  )
}

export interface ExcludeWhenNullDirective extends DirectiveMetadata {
  '@excludeWhenNull': FieldValue
}

export function isExcludeWhenNullDirective(value: FieldValue): value is ExcludeWhenNullDirective {
  return isDirective(value) && '@excludeWhenNull' in value
}

type DirectiveKeysToType<T> = {
  ['@arrayPath']: (input: ArrayPathDirective) => T
  ['@case']: (input: CaseDirective) => T
  ['@if']: (input: IfDirective) => T
  ['@literal']: (input: LiteralDirective) => T
  ['@path']: (input: PathDirective) => T
  ['@replace']: (input: ReplaceDirective) => T
  ['@template']: (input: TemplateDirective) => T
  ['@json']: (input: JSONDirective) => T
  ['@flatten']: (input: FlattenDirective) => T
  ['@merge']: (input: MergeDirective) => T
  ['@transform']: (input: TransformDirective) => T
  ['@excludeWhenNull']: (input: ExcludeWhenNullDirective) => T
}

function directiveType<T>(directive: Directive, checker: DirectiveKeysToType<T>): T | null {
  if (isArrayPathDirective(directive)) {
    return checker['@arrayPath'](directive)
  }
  if (isCaseDirective(directive)) {
    return checker['@case'](directive)
  }
  if (isIfDirective(directive)) {
    return checker['@if'](directive)
  }
  if (isLiteralDirective(directive)) {
    return checker['@literal'](directive)
  }
  if (isPathDirective(directive)) {
    return checker['@path'](directive)
  }
  if (isReplaceDirective(directive)) {
    return checker['@replace'](directive)
  }
  if (isTemplateDirective(directive)) {
    return checker['@template'](directive)
  }
  if (isJSONDirective(directive)) {
    return checker['@json'](directive)
  }
  if (isFlattenDirective(directive)) {
    return checker['@flatten'](directive)
  }
  if (isExcludeWhenNullDirective(directive)) {
    return checker['@excludeWhenNull'](directive)
  }
  return null
}

export type Directive =
  | ArrayPathDirective
  | CaseDirective
  | IfDirective
  | LiteralDirective
  | PathDirective
  | ReplaceDirective
  | TemplateDirective
  | JSONDirective
  | FlattenDirective
  | MergeDirective
  | TransformDirective
  | ExcludeWhenNullDirective

export type PrimitiveValue = boolean | number | string | null
export type FieldValue = Directive | PrimitiveValue | { [key: string]: FieldValue } | FieldValue[] | undefined

/**
 * @param value
 * @returns an array containing all keys of nested @directives
 */
export function getFieldValueKeys(value: FieldValue): string[] {
  if (isDirective(value)) {
    return (
      directiveType<string[]>(value, {
        '@arrayPath': (input: ArrayPathDirective) => input['@arrayPath'].flatMap(getRawKeys),
        '@case': (input: CaseDirective) => getRawKeys(input['@case'].value),
        '@if': (input: IfDirective) => [
          ...getRawKeys(input['@if'].blank),
          ...getRawKeys(input['@if'].exists),
          ...getRawKeys(input['@if'].then),
          ...getRawKeys(input['@if'].else)
        ],
        '@literal': (_: LiteralDirective) => [''],
        '@path': (input: PathDirective) => [input['@path']],
        '@replace': (input: ReplaceDirective) => getRawKeys(input['@replace'].value),
        '@template': (input: TemplateDirective) => getTemplateKeys(input['@template']),
        '@json': (input: JSONDirective) => getRawKeys(input['@json'].value),
        '@flatten': (input: FlattenDirective) => getRawKeys(input['@flatten'].value),
        '@merge': (input: MergeDirective) => getRawKeys(input['@merge'].objects),
        '@transform': (input: TransformDirective) => [
          ...getRawKeys(input['@transform'].apply),
          ...getRawKeys(input['@transform'].mapping)
        ],
        '@excludeWhenNull': (_: ExcludeWhenNullDirective) => ['']
      })?.filter((k) => k) ?? []
    )
  } else if (isObject(value)) {
    return Object.values(value).flatMap(getFieldValueKeys)
  }
  return []
}

/**
 * Function to get raw keys from a FieldValue
 */
export function getRawKeys(input: FieldValue): string[] {
  if (isDirective(input)) {
    return getFieldValueKeys(input)
  } else if (isObject(input)) {
    return Object.values(input).flatMap(getFieldValueKeys)
  }
  return []
}

/**
 * Function to grab all values between any set of {{}} in a string
 */
export function getTemplateKeys(input: string): string[] {
  const regex = /{{(.*?)}}/g
  return Array.from(input.matchAll(regex), (m) => m[1])
}
