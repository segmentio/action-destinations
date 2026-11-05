import { validateEvent } from '../functions/event-validator-functions'
import type { EventSpec } from '../types'

// Property names come from the Avo tracking plan API response. JSON.parse keeps
// `__proto__` as an own key, so the specs below are built via JSON.parse.
const buildSpec = (): EventSpec =>
  JSON.parse(`{
    "metadata": { "schemaId": "s", "branchId": "main", "latestActionId": "a" },
    "events": [
      {
        "branchId": "main",
        "baseEventId": "evt_1",
        "variantIds": [],
        "props": {
          "plan": { "type": "string", "required": false, "allowedValues": { "[\\"a\\",\\"b\\"]": ["evt_1"] } },
          "__proto__": {
            "type": "string", "required": false,
            "pinnedValues": { "polluted": ["evt_1"] },
            "allowedValues": { "polluted": ["evt_1"] },
            "minMaxRanges": { "polluted": ["evt_1"] },
            "children": { "polluted": { "type": "string", "required": false } }
          },
          "constructor": {
            "type": "string", "required": false,
            "pinnedValues": { "polluted": ["evt_1"] },
            "children": { "__proto__": { "type": "string", "required": false, "pinnedValues": { "polluted": ["evt_1"] } } }
          }
        }
      },
      {
        "branchId": "main",
        "baseEventId": "evt_2",
        "variantIds": [],
        "props": {
          "plan": { "type": "string", "required": false, "allowedValues": { "[\\"c\\"]": ["evt_2"] } },
          "__proto__": {
            "type": "string", "required": false,
            "pinnedValues": { "polluted": ["evt_2"] },
            "allowedValues": { "polluted": ["evt_2"] },
            "minMaxRanges": { "polluted": ["evt_2"] },
            "children": { "polluted": { "type": "string", "required": false } }
          },
          "constructor": {
            "type": "string", "required": false,
            "pinnedValues": { "polluted": ["evt_2"] },
            "children": { "__proto__": { "type": "string", "required": false, "pinnedValues": { "polluted": ["evt_2"] } } }
          }
        }
      }
    ]
  }`)

describe('EventValidator prototype pollution hardening', () => {
  it('does not pollute Object.prototype when merging multi-event specs with unsafe property names', () => {
    const spec = buildSpec()
    expect(Object.keys(spec.events[0].props)).toContain('__proto__')

    validateEvent({ plan: 'a' }, spec)

    const probe = {} as Record<string, unknown>
    expect(probe.pinnedValues).toBeUndefined()
    expect(probe.allowedValues).toBeUndefined()
    expect(probe.minMaxRanges).toBeUndefined()
    expect(probe.children).toBeUndefined()
    expect(probe.polluted).toBeUndefined()
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'pinnedValues')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'allowedValues')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'children')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'minMaxRanges')).toBe(false)
  })

  it('leaves merge output for normal property names unchanged', () => {
    const spec = buildSpec()
    // 'a' is allowed only by evt_1, 'c' only by evt_2, 'z' by neither
    expect(validateEvent({ plan: 'a' }, spec).propertyResults.plan).toEqual({ failedEventIds: ['evt_2'] })
    expect(validateEvent({ plan: 'c' }, spec).propertyResults.plan).toEqual({ failedEventIds: ['evt_1'] })
    expect(validateEvent({ plan: 'z' }, spec).propertyResults.plan).toEqual({ failedEventIds: ['evt_1', 'evt_2'] })
  })
})
