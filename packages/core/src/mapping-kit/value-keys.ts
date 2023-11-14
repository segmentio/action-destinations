// import { isDirective } from './is-directive'
// eslint-disable-next-line lodash/import-scope
import _ from 'lodash'

type ValueType = 'enrichment' | 'function' | 'literal' | 'variable'

interface DirectiveMetadata {
  _metadata?: {
    label?: string
    type: ValueType
  }
}

function isDirective(value: FieldValue): value is Directive {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.keys(value).some((key) =>
      ['@if', '@path', '@template', '@literal', '@arrayPath', '@case', '@replace'].includes(key)
    )
  )
}

interface LiteralDirective extends DirectiveMetadata {
  '@literal': PrimitiveValue | Record<string, FieldValue>
}

function isLiteralDirective(value: FieldValue): value is LiteralDirective {
  return isDirective(value) && '@literal' in value
}
interface TemplateDirective extends DirectiveMetadata {
  '@template': string
}

function isTemplateDirective(value: FieldValue): value is TemplateDirective {
  return isDirective(value) && '@template' in value
}

interface PathDirective extends DirectiveMetadata {
  '@path': string
}

function isPathDirective(value: FieldValue): value is PathDirective {
  return isDirective(value) && '@path' in value
}

type RequireOnlyOne<T, Keys extends keyof T = keyof T> = {
  [K in Keys]-?: Partial<Record<Exclude<Keys, K>, undefined>> & Required<Pick<T, K>>
}[Keys] &
  Pick<T, Exclude<keyof T, Keys>>

interface IfDirective extends DirectiveMetadata {
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

function isIfDirective(value: FieldValue): value is IfDirective {
  return (
    isDirective(value) &&
    '@if' in value &&
    value['@if'] !== null &&
    typeof value['@if'] === 'object' &&
    ('exists' in value['@if'] || 'blank' in value['@if'])
  )
}

interface ArrayPathDirective extends DirectiveMetadata {
  '@arrayPath': [Directive | string, { [key: string]: FieldValue } | undefined] | [Directive | string]
}

function isArrayPathDirective(value: FieldValue): value is ArrayPathDirective {
  return isDirective(value) && '@arrayPath' in value && Array.isArray(value['@arrayPath'])
}

interface CaseDirective extends DirectiveMetadata {
  '@case': {
    operator: string
    value?: FieldValue
  }
}

function isCaseDirective(value: FieldValue): value is CaseDirective {
  return (
    isDirective(value) &&
    '@case' in value &&
    value['@case'] !== null &&
    typeof value['@case'] === 'object' &&
    'operator' in value['@case']
  )
}

interface ReplaceDirective extends DirectiveMetadata {
  '@replace': {
    global: PrimitiveValue
    ignorecase: PrimitiveValue
    pattern: string
    replacement: string
    value?: FieldValue
  }
}

function isReplaceDirective(value: FieldValue): value is ReplaceDirective {
  return (
    isDirective(value) &&
    '@replace' in value &&
    value['@replace'] !== null &&
    typeof value['@replace'] === 'object' &&
    'pattern' in value['@replace']
  )
}
type DirectiveKeysToType<T> = {
  ['@arrayPath']: (input: ArrayPathDirective) => T
  ['@case']: (input: CaseDirective) => T
  ['@if']: (input: IfDirective) => T
  ['@literal']: (input: LiteralDirective) => T
  ['@path']: (input: PathDirective) => T
  ['@replace']: (input: ReplaceDirective) => T
  ['@template']: (input: TemplateDirective) => T
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
  return null
}

type Directive =
  | ArrayPathDirective
  | CaseDirective
  | IfDirective
  | LiteralDirective
  | PathDirective
  | ReplaceDirective
  | TemplateDirective
type PrimitiveValue = boolean | number | string | null
type FieldValue = Directive | PrimitiveValue | { [key: string]: FieldValue } | FieldValue[] | undefined

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
        '@template': (input: TemplateDirective) => getTemplateKeys(input['@template'])
      })?.filter((k) => k) ?? []
    )
  } else if (_.isObject(value)) {
    return Object.values(value).flatMap(getFieldValueKeys)
  }
  return []
}

function getRawKeys(input: FieldValue): string[] {
  if (isDirective(input)) {
    return getFieldValueKeys(input)
  } else if (_.isObject(input)) {
    return Object.values(input).flatMap(getFieldValueKeys)
  }
  return []
}

/**
 * Function to grab all values between any set of {{}} in a string
 */
function getTemplateKeys(input: string): string[] {
  const regex = /{{(.*?)}}/g
  return Array.from(input.matchAll(regex), (m) => m[1])
}
