import { Liquid } from 'liquidjs'

const liquidEngine = new Liquid({
  renderLimit: 500, // 500 ms
  parseLimit: 1000, // 1000 characters. This is also enforced by us to enable a custom error message
  memoryLimit: 1e8 // 100 MB memory
})

const disabledTags = ['case', 'for', 'include', 'layout', 'render', 'tablerow']

const disabledFilters = [
  'array_to_sentence_string',
  'concat',
  'find',
  'find_exp',
  'find_index',
  'find_index_exp',
  'group_by',
  'group_by_exp',
  'has',
  'has_exp',
  'map',
  'newline_to_br',
  'reject',
  'reject_exp',
  'reverse',
  'sort',
  'sort_natural',
  'uniq',
  'where_exp',
  'type'
]

disabledTags.forEach((tag) => {
  const disabled = {
    parse: function () {
      throw new Error(`tag "${tag}" is disabled`)
    },
    render: function () {
      throw new Error(`tag "${tag}" is disabled`)
    }
  }

  liquidEngine.registerTag(tag, disabled)
})

disabledFilters.forEach((filter) => {
  const disabledFilter = (name: string) => {
    return function () {
      throw new Error(`filter "${name}" is disabled`)
    }
  }

  liquidEngine.registerFilter(filter, disabledFilter(filter))
})

export function evaluateLiquid(liquidValue: any, event: any): string {
  if (typeof liquidValue !== 'string') {
    // type checking of @liquid directive is done in validate.ts as well
    throw new Error('liquid template value must be a string')
  }

  if (liquidValue.length === 0) {
    return ''
  }

  if (liquidValue.length > 1000) {
    throw new Error('liquid template values are limited to 1000 characters')
  }

  const res = liquidEngine.parseAndRenderSync(liquidValue, event)

  if (typeof res !== 'string') {
    return 'error'
  }

  return res
}
