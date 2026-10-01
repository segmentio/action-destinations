import { Liquid } from 'liquidjs'
import { StatsContext } from '../destination-kit'
import { JSONLike } from '../json-object'

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

interface LiquidEngineOptions {
  /**
   * Return the evaluated value instead of a string when the template writes a single output,
   * e.g. `{{ properties.tags }}` returns an array. Mixed output is still rendered to a string.
   */
  keepOutputType?: boolean
}

export function createLiquidEngine({ keepOutputType = false }: LiquidEngineOptions = {}): Liquid {
  const engine = new Liquid({
    renderLimit: 500, // 500 ms
    parseLimit: 1000, // 1000 characters. This is also enforced by us to enable a custom error message
    memoryLimit: 1e8, // 100 MB memory
    keepOutputType
  })

  disabledTags.forEach((tag) => {
    const disabled = {
      parse: function () {
        throw new Error(`tag "${tag}" is disabled`)
      },
      render: function () {
        throw new Error(`tag "${tag}" is disabled`)
      }
    }

    engine.registerTag(tag, disabled)
  })

  disabledFilters.forEach((filter) => {
    const disabledFilter = (name: string) => {
      return function () {
        throw new Error(`filter "${name}" is disabled`)
      }
    }

    engine.registerFilter(filter, disabledFilter(filter))
  })

  return engine
}

const liquidEngine = createLiquidEngine()

export function getLiquidKeys(liquidValue: string): string[] {
  return liquidEngine.fullVariablesSync(liquidValue)
}

export function evaluateLiquid(liquidValue: any, event: any, statsContext?: StatsContext | undefined): string
export function evaluateLiquid(
  liquidValue: any,
  event: any,
  statsContext: StatsContext | undefined,
  engine: Liquid
): JSONLike
export function evaluateLiquid(
  liquidValue: any,
  event: any,
  statsContext?: StatsContext | undefined,
  engine: Liquid = liquidEngine
): JSONLike {
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

  let res: JSONLike
  const start = Date.now()
  let status: 'success' | 'fail' = 'success'

  try {
    res = engine.parseAndRenderSync(liquidValue, event)
  } catch (e) {
    status = 'fail'
    throw e
  } finally {
    const duration = Date.now() - start
    statsContext?.statsClient?.histogram('liquid.template.evaluation_ms', duration, [
      ...statsContext.tags,
      `result:${status}`
    ])
  }

  if (engine.options.keepOutputType) {
    return res
  }

  if (typeof res !== 'string') {
    return 'error'
  }

  return res
}
