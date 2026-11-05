import { validateEvent } from '../functions/event-validator-functions'
import type { EventSpec } from '../types'

// Property names and constraint keys come from the tracking plan response. JSON.parse keeps
// `__proto__` as an own key, so specs and payloads below are built via JSON.parse.
const pin = (value: string, id: string) => ({ [value]: [id] })

const specFrom = (events: string[]): EventSpec =>
  JSON.parse(`{"metadata":{"schemaId":"s","branchId":"main","latestActionId":"a"},"events":[${events.join(',')}]}`)

// A safe top-level property whose children and constraint mappings use unusual keys.
const objectProp = (id: string) => ({
  type: 'object',
  required: false,
  pinnedValues: { ...pin('constructor', id), ...JSON.parse(`{"__proto__":["${id}"]}`) },
  children: JSON.parse(`{
    "name": { "type": "string", "required": false, "pinnedValues": { "constructor": ["${id}"] } },
    "constructor": { "type": "string", "required": false, "pinnedValues": { "__proto__": ["${id}"] } },
    "__proto__": { "type": "string", "required": false, "allowedValues": { "[\\"ok\\"]": ["${id}"] } }
  }`)
})

const listProp = (id: string) => ({
  type: 'object',
  required: false,
  isList: true,
  children: JSON.parse(`{
    "constructor": { "type": "string", "required": false, "pinnedValues": { "a": ["${id}"] } },
    "__proto__": { "type": "string", "required": false, "pinnedValues": { "a": ["${id}"] } }
  }`)
})

const expectNoPollution = () => {
  const probe = {} as Record<string, unknown>
  for (const k of ['pinnedValues', 'allowedValues', 'minMaxRanges', 'children', 'type', 'required', 'polluted']) {
    expect(probe[k]).toBeUndefined()
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, k)).toBe(false)
  }
}

const buildSpec = (ids: string[], prop: (id: string) => unknown, name = 'plan') =>
  specFrom(
    ids.map(
      (id) =>
        `{"branchId":"main","baseEventId":"${id}","variantIds":[],"props":${JSON.stringify({
          [name]: prop(id)
        })}}`
    )
  )

describe('EventValidator prototype-safe merging', () => {
  describe('multi-event path', () => {
    it('keeps unusual keys in children and constraint mappings through a merge', () => {
      const spec = buildSpec(['evt_1', 'evt_2'], objectProp)
      const bad = JSON.parse('{"name":"x","constructor":"x","__proto__":"x"}')

      const { plan } = validateEvent({ plan: bad }, spec).propertyResults
      // Pinned value "constructor" / "prototype" ids from both events were unioned, so both fail
      expect(plan.children?.name).toEqual({ failedEventIds: ['evt_1', 'evt_2'] })
      expect(plan.children?.['constructor']).toEqual({ failedEventIds: ['evt_1', 'evt_2'] })
      expect(Object.keys(plan.children ?? {})).toContain('__proto__')
      expect(Object.getOwnPropertyDescriptor(plan.children, '__proto__')?.value).toEqual({
        failedEventIds: ['evt_1', 'evt_2']
      })

      const good = JSON.parse('{"name":"constructor","constructor":"__proto__","__proto__":"ok"}')
      expect(validateEvent({ plan: good }, spec).propertyResults.plan).toEqual({})
      expectNoPollution()
    })

    it('validates top-level properties named constructor and __proto__', () => {
      const prop = (id: string) => ({ type: 'string', required: false, pinnedValues: { ok: [id] } })
      const spec = specFrom(
        ['evt_1', 'evt_2'].map(
          (id) =>
            `{"branchId":"main","baseEventId":"${id}","variantIds":[],"props":{"constructor":${JSON.stringify(
              prop(id)
            )},"__proto__":${JSON.stringify(prop(id))}}}`
        )
      )
      const results = validateEvent(
        JSON.parse('{"constructor":"bad","__proto__":"bad","other":"x"}'),
        spec
      ).propertyResults
      expect(results['constructor']).toEqual({ failedEventIds: ['evt_1', 'evt_2'] })
      expect(Object.getOwnPropertyDescriptor(results, '__proto__')?.value).toEqual({
        failedEventIds: ['evt_1', 'evt_2']
      })
      expect(results.other).toEqual({})
      expectNoPollution()
    })

    it('leaves merge output for normal names unchanged', () => {
      const prop = (id: string) => ({ type: 'string', required: false, allowedValues: { [`["${id}"]`]: [id] } })
      const spec = buildSpec(['a', 'c'], prop)
      expect(validateEvent({ plan: 'a' }, spec).propertyResults.plan).toEqual({ failedEventIds: ['c'] })
      expect(validateEvent({ plan: 'z' }, spec).propertyResults.plan).toEqual({ failedEventIds: ['a', 'c'] })
    })
  })

  describe('single-event path', () => {
    it('handles the same keys consistently', () => {
      const spec = buildSpec(['evt_1'], objectProp)
      const bad = JSON.parse('{"name":"x","constructor":"x","__proto__":"x"}')
      const { plan } = validateEvent({ plan: bad }, spec).propertyResults
      expect(plan.children?.name).toEqual({ failedEventIds: ['evt_1'] })
      expect(plan.children?.['constructor']).toEqual({ failedEventIds: ['evt_1'] })
      expect(Object.getOwnPropertyDescriptor(plan.children, '__proto__')?.value).toEqual({
        failedEventIds: ['evt_1']
      })
      expect(validateEvent({ plan: { name: 'constructor' } }, spec).propertyResults.plan).toEqual({})
      expectNoPollution()
    })

    it('does not resolve runtime properties against inherited members', () => {
      const spec = buildSpec(['evt_1'], objectProp)
      const results = validateEvent(
        JSON.parse('{"constructor":"x","toString":"x","__proto__":"x"}'),
        spec
      ).propertyResults
      expect(results['constructor']).toEqual({})
      expect(results.toString).toEqual({})
    })
  })

  describe('list of objects', () => {
    const items = JSON.parse('[{"constructor":"bad","__proto__":"bad"},{"constructor":"a","__proto__":"a"}]')

    it('aggregates child results keyed by unusual names (multi-event)', () => {
      const spec = buildSpec(['evt_1', 'evt_2'], listProp)
      const { plan } = validateEvent({ plan: items }, spec).propertyResults
      expect(plan.children?.['constructor']).toEqual({ failedEventIds: ['evt_1', 'evt_2'] })
      expect(Object.getOwnPropertyDescriptor(plan.children, '__proto__')?.value).toEqual({
        failedEventIds: ['evt_1', 'evt_2']
      })
      expectNoPollution()
    })

    it('aggregates child results keyed by unusual names (single event)', () => {
      const spec = buildSpec(['evt_1'], listProp)
      const { plan } = validateEvent({ plan: items }, spec).propertyResults
      expect(plan.children?.['constructor']).toEqual({ failedEventIds: ['evt_1'] })
      expect(Object.getOwnPropertyDescriptor(plan.children, '__proto__')?.value).toEqual({
        failedEventIds: ['evt_1']
      })
      expectNoPollution()
    })
  })
})
