import { createTestIntegration } from '../../create-test-integration'
import { DestinationDefinition } from '../../destination-kit'
import { InputField } from '../../destination-kit/types'
import { JSONObject } from '../../json-object'

/**
 * Documents how Liquid function output is coerced to the target field type.
 *
 * Every case runs twice:
 * - keepOutputType: false (production today). `@liquid` always renders to a string.
 * - keepOutputType: true. A template that writes a single output returns the evaluated value
 *   (boolean, number, array, object, null or undefined) instead of a string.
 *
 * In both modes any further typing happens afterwards, when `Action.execute` runs the resolved payload
 * through `removeEmptyValues` and AJV (`coerceTypes: 'array'`).
 *
 * Both modes share the same expectations. Tests under "coerced today" describe behavior that works in
 * production. Tests under "gaps" assert the behavior a customer would expect and are EXPECTED TO FAIL
 * where typed output doesn't cover them yet.
 */

let mockKeepOutputType = false

// Route the @liquid directive through an engine with the keepOutputType mode under test
jest.mock('../liquid-directive', () => {
  const actual = jest.requireActual('../liquid-directive')
  const typedEngine = actual.createLiquidEngine({ keepOutputType: true })
  return {
    ...actual,
    evaluateLiquid: (liquidValue: unknown, event: unknown, statsContext: unknown) =>
      mockKeepOutputType
        ? actual.evaluateLiquid(liquidValue, event, statsContext, typedEngine)
        : actual.evaluateLiquid(liquidValue, event, statsContext)
  }
})

const fields: Record<string, InputField> = {
  str: { label: 'String', description: 'string', type: 'string' },
  strNullable: { label: 'Nullable String', description: 'string | null', type: 'string', allowNull: true },
  bool: { label: 'Boolean', description: 'boolean', type: 'boolean' },
  boolNullable: { label: 'Nullable Boolean', description: 'boolean | null', type: 'boolean', allowNull: true },
  num: { label: 'Number', description: 'number', type: 'number' },
  numNullable: { label: 'Nullable Number', description: 'number | null', type: 'number', allowNull: true },
  int: { label: 'Integer', description: 'integer', type: 'integer' },
  dt: { label: 'Datetime', description: 'datetime', type: 'datetime' },
  strArr: { label: 'String Array', description: 'string[]', type: 'string', multiple: true },
  numArr: { label: 'Number Array', description: 'number[]', type: 'number', multiple: true },
  boolArr: { label: 'Boolean Array', description: 'boolean[]', type: 'boolean', multiple: true },
  obj: {
    label: 'Object',
    description: 'object with defined properties',
    type: 'object',
    properties: {
      flag: { label: 'Flag', type: 'boolean' },
      count: { label: 'Count', type: 'number' },
      tags: { label: 'Tags', type: 'string', multiple: true }
    }
  },
  freeObj: {
    label: 'Free Object',
    description: 'object with freely defined keys',
    type: 'object',
    additionalProperties: true,
    defaultObjectUI: 'keyvalue'
  },
  anyObj: { label: 'Any Object', description: 'object without properties', type: 'object' },
  objArr: {
    label: 'Object Array',
    description: 'array of objects',
    type: 'object',
    multiple: true,
    properties: {
      flag: { label: 'Flag', type: 'boolean' }
    }
  }
}

let received: JSONObject | undefined

const destination: DestinationDefinition<JSONObject> = {
  name: 'Liquid Type Coercion',
  mode: 'cloud',
  actions: {
    probe: {
      title: 'Probe',
      description: 'Captures the validated payload',
      fields,
      perform: (_request, { payload }) => {
        received = payload as JSONObject
      }
    }
  }
}

const testDestination = createTestIntegration(destination)

const properties = {
  yes: true,
  no: false,
  num: 42,
  float: 8.4,
  zero: 0,
  negative: -3,
  nul: null,
  str: 'hello',
  csv: 'a,b',
  tags: ['a', 'b'],
  nums: [1, 2],
  bools: [true, false],
  empty: [],
  obj: { k: 1 }
}

/** Runs a single-field mapping through Action.execute and returns the payload `perform` received. */
async function run(mapping: JSONObject): Promise<JSONObject | undefined> {
  received = undefined
  await testDestination.testAction('probe', { event: { properties }, mapping })
  return received
}

const liquid = (template: string) => ({ '@liquid': template })

describe.each([false, true])('@liquid output type coercion (keepOutputType: %s)', (keepOutputType) => {
  beforeAll(() => {
    mockKeepOutputType = keepOutputType
  })

  describe('string', () => {
    describe('coerced today', () => {
      test('string output stays a string', async () => {
        expect(await run({ str: liquid('{{ properties.str }}') })).toStrictEqual({ str: 'hello' })
      })

      test('number output is a string', async () => {
        expect(await run({ str: liquid('{{ properties.num }}') })).toStrictEqual({ str: '42' })
      })

      test('boolean output is a string', async () => {
        expect(await run({ str: liquid('{{ properties.yes }}') })).toStrictEqual({ str: 'true' })
      })

      test('array output is joined into a single string', async () => {
        // Existing behavior customers may rely on
        expect(await run({ str: liquid('{{ properties.tags }}') })).toStrictEqual({ str: 'ab' })
      })

      test('null output omits the field', async () => {
        expect(await run({ str: liquid('{{ properties.nul }}') })).toStrictEqual({})
      })

      test('missing property omits the field', async () => {
        expect(await run({ str: liquid('{{ properties.missing }}') })).toStrictEqual({})
      })
    })

    describe('gaps', () => {
      test('null output is null on a nullable field', async () => {
        // Today: null renders as '' and removeEmptyValues omits the field
        expect(await run({ strNullable: liquid('{{ properties.nul }}') })).toStrictEqual({ strNullable: null })
      })

      test('nil literal is null on a nullable field', async () => {
        expect(await run({ strNullable: liquid('{{ nil }}') })).toStrictEqual({ strNullable: null })
      })
    })
  })

  describe('boolean', () => {
    describe('coerced today', () => {
      test('true property is coerced to true', async () => {
        expect(await run({ bool: liquid('{{ properties.yes }}') })).toStrictEqual({ bool: true })
      })

      test('false property is coerced to false', async () => {
        expect(await run({ bool: liquid('{{ properties.no }}') })).toStrictEqual({ bool: false })
      })

      test('literal "true" is coerced to true', async () => {
        expect(await run({ bool: liquid('true') })).toStrictEqual({ bool: true })
      })

      test('if/else rendering true or false is coerced', async () => {
        const template = '{% if properties.num > 10 %}true{% else %}false{% endif %}'
        expect(await run({ bool: liquid(template) })).toStrictEqual({ bool: true })
      })

      test('if without else renders empty and omits the field', async () => {
        expect(await run({ bool: liquid('{% if properties.no %}true{% endif %}') })).toStrictEqual({})
      })

      test('null output omits the field', async () => {
        expect(await run({ bool: liquid('{{ properties.nul }}') })).toStrictEqual({})
      })

      test('missing property omits the field', async () => {
        expect(await run({ bool: liquid('{{ properties.missing }}') })).toStrictEqual({})
      })

      test('non-boolean string fails validation', async () => {
        await expect(run({ bool: liquid('{{ properties.str }}') })).rejects.toThrow()
      })
    })

    describe('gaps', () => {
      test('capitalized "True" is coerced to true', async () => {
        expect(await run({ bool: liquid('True') })).toStrictEqual({ bool: true })
      })

      test('surrounding whitespace is ignored', async () => {
        const template = '{% if properties.yes %} true {% endif %}'
        expect(await run({ bool: liquid(template) })).toStrictEqual({ bool: true })
      })

      test('trailing newline is ignored', async () => {
        expect(await run({ bool: liquid('{{ properties.yes }}\n') })).toStrictEqual({ bool: true })
      })

      test('null output is null on a nullable field', async () => {
        // Today: null renders as '' and removeEmptyValues omits the field
        expect(await run({ boolNullable: liquid('{{ properties.nul }}') })).toStrictEqual({ boolNullable: null })
      })

      test('nil literal is null on a nullable field', async () => {
        expect(await run({ boolNullable: liquid('{{ nil }}') })).toStrictEqual({ boolNullable: null })
      })
    })
  })

  describe('number', () => {
    describe('coerced today', () => {
      test('integer property is coerced to a number', async () => {
        expect(await run({ num: liquid('{{ properties.num }}') })).toStrictEqual({ num: 42 })
      })

      test('math filter output is coerced to a number', async () => {
        expect(await run({ num: liquid('{{ properties.num | plus: 1 }}') })).toStrictEqual({ num: 43 })
      })

      test('float property is coerced to a number', async () => {
        expect(await run({ num: liquid('{{ properties.float }}') })).toStrictEqual({ num: 8.4 })
      })

      test('zero is coerced to 0, not omitted', async () => {
        expect(await run({ num: liquid('{{ properties.zero }}') })).toStrictEqual({ num: 0 })
      })

      test('negative number is coerced', async () => {
        expect(await run({ num: liquid('{{ properties.negative }}') })).toStrictEqual({ num: -3 })
      })

      test('null output omits the field', async () => {
        expect(await run({ num: liquid('{{ properties.nul }}') })).toStrictEqual({})
      })

      test('missing property omits the field', async () => {
        expect(await run({ num: liquid('{{ properties.missing }}') })).toStrictEqual({})
      })

      test('math filter on a missing property produces 0', async () => {
        expect(await run({ num: liquid('{{ properties.missing | plus: 0 }}') })).toStrictEqual({ num: 0 })
      })

      test('non-numeric string fails validation', async () => {
        await expect(run({ num: liquid('{{ properties.str }}') })).rejects.toThrow()
      })

      // Unlike booleans, AJV's number coercion tolerates surrounding whitespace
      test('surrounding whitespace is ignored', async () => {
        const template = '{% if properties.yes %} {{ properties.num }} {% endif %}'
        expect(await run({ num: liquid(template) })).toStrictEqual({ num: 42 })
      })

      test('trailing newline is ignored', async () => {
        expect(await run({ num: liquid('{{ properties.num }}\n') })).toStrictEqual({ num: 42 })
      })
    })

    describe('gaps', () => {
      test('null output is null on a nullable field', async () => {
        // Today: null renders as '' and removeEmptyValues omits the field
        expect(await run({ numNullable: liquid('{{ properties.nul }}') })).toStrictEqual({ numNullable: null })
      })

      test('nil literal is null on a nullable field', async () => {
        expect(await run({ numNullable: liquid('{{ nil }}') })).toStrictEqual({ numNullable: null })
      })
    })
  })

  describe('integer', () => {
    describe('coerced today', () => {
      test('integer property is coerced to an integer', async () => {
        expect(await run({ int: liquid('{{ properties.num }}') })).toStrictEqual({ int: 42 })
      })

      test('whole float string "42.0" is coerced to 42', async () => {
        expect(await run({ int: liquid('42.0') })).toStrictEqual({ int: 42 })
      })

      test('rounded float is coerced to an integer', async () => {
        expect(await run({ int: liquid('{{ properties.float | round }}') })).toStrictEqual({ int: 8 })
      })

      test('fractional value fails validation', async () => {
        await expect(run({ int: liquid('{{ properties.float }}') })).rejects.toThrow()
      })
    })
  })

  describe('datetime', () => {
    describe('coerced today', () => {
      test('ISO string is passed through as a string', async () => {
        expect(await run({ dt: liquid('2024-01-01T00:00:00.000Z') })).toStrictEqual({ dt: '2024-01-01T00:00:00.000Z' })
      })

      test('date filter output is passed through as a string', async () => {
        const template = '{{ "2024-01-01T00:00:00.000Z" | date: "%Y-%m-%d" }}'
        expect(await run({ dt: liquid(template) })).toStrictEqual({ dt: '2024-01-01' })
      })

      test('null output omits the field', async () => {
        expect(await run({ dt: liquid('{{ properties.nul }}') })).toStrictEqual({})
      })
    })
  })

  describe('array of strings (multiple: true)', () => {
    describe('coerced today', () => {
      test('single value is wrapped in an array', async () => {
        expect(await run({ strArr: liquid('{{ properties.str }}') })).toStrictEqual({ strArr: ['hello'] })
      })

      test('null output omits the field', async () => {
        expect(await run({ strArr: liquid('{{ properties.nul }}') })).toStrictEqual({})
      })
    })

    describe('gaps', () => {
      test('array property is passed through as an array', async () => {
        // Today: LiquidJS joins the array with no separator, producing ['ab']
        expect(await run({ strArr: liquid('{{ properties.tags }}') })).toStrictEqual({ strArr: ['a', 'b'] })
      })

      test('split filter output is an array', async () => {
        // Today: split returns an array, which is then joined back into 'ab'
        const template = '{{ properties.csv | split: "," }}'
        expect(await run({ strArr: liquid(template) })).toStrictEqual({ strArr: ['a', 'b'] })
      })

      test('json filter output is parsed into an array', async () => {
        // Today: the JSON string is wrapped as a single element, producing ['["a","b"]']
        expect(await run({ strArr: liquid('{{ properties.tags | json }}') })).toStrictEqual({ strArr: ['a', 'b'] })
      })

      test('empty array property produces an empty array', async () => {
        // Today: renders as '' and the field is omitted
        expect(await run({ strArr: liquid('{{ properties.empty }}') })).toStrictEqual({ strArr: [] })
      })
    })
  })

  describe('array of numbers (multiple: true)', () => {
    describe('coerced today', () => {
      test('single value is wrapped and coerced', async () => {
        expect(await run({ numArr: liquid('{{ properties.num }}') })).toStrictEqual({ numArr: [42] })
      })
    })

    describe('gaps', () => {
      test('array property is passed through as an array of numbers', async () => {
        // Today: silently wrong, [1, 2] renders as '12' and is coerced to [12]
        expect(await run({ numArr: liquid('{{ properties.nums }}') })).toStrictEqual({ numArr: [1, 2] })
      })

      test('split filter output is coerced to an array of numbers', async () => {
        expect(await run({ numArr: liquid('{{ "1,2" | split: "," }}') })).toStrictEqual({ numArr: [1, 2] })
      })
    })
  })

  describe('array of booleans (multiple: true)', () => {
    describe('coerced today', () => {
      test('single value is wrapped and coerced', async () => {
        expect(await run({ boolArr: liquid('{{ properties.yes }}') })).toStrictEqual({ boolArr: [true] })
      })
    })

    describe('gaps', () => {
      test('array property is passed through as an array of booleans', async () => {
        // Today: [true, false] renders as 'truefalse' and fails validation
        expect(await run({ boolArr: liquid('{{ properties.bools }}') })).toStrictEqual({ boolArr: [true, false] })
      })
    })
  })

  describe('object with defined properties', () => {
    describe('coerced today', () => {
      test('nested boolean and number values are coerced', async () => {
        const mapping = {
          obj: {
            flag: liquid('{{ properties.yes }}'),
            count: liquid('{{ properties.num }}')
          }
        }
        expect(await run(mapping)).toStrictEqual({ obj: { flag: true, count: 42 } })
      })

      test('nested single value is wrapped into a nested array', async () => {
        expect(await run({ obj: { tags: liquid('{{ properties.str }}') } })).toStrictEqual({ obj: { tags: ['hello'] } })
      })
    })

    describe('gaps', () => {
      test('nested array property is passed through as an array', async () => {
        // Today: the nested array renders as 'ab' and is wrapped, producing ['ab']
        expect(await run({ obj: { tags: liquid('{{ properties.tags }}') } })).toStrictEqual({
          obj: { tags: ['a', 'b'] }
        })
      })
    })
  })

  describe('object with freely defined keys', () => {
    describe('coerced today', () => {
      test('string value stays a string', async () => {
        expect(await run({ freeObj: { greeting: liquid('{{ properties.str }}') } })).toStrictEqual({
          freeObj: { greeting: 'hello' }
        })
      })
    })

    describe('gaps', () => {
      // There is no schema for these keys, so nothing coerces the values. Fixing this needs the
      // customer to choose each key's type.
      test('boolean value is a boolean', async () => {
        expect(await run({ freeObj: { flag: liquid('{{ properties.yes }}') } })).toStrictEqual({
          freeObj: { flag: true }
        })
      })

      test('number value is a number', async () => {
        expect(await run({ freeObj: { count: liquid('{{ properties.num }}') } })).toStrictEqual({
          freeObj: { count: 42 }
        })
      })

      test('array value is an array', async () => {
        expect(await run({ freeObj: { tags: liquid('{{ properties.tags }}') } })).toStrictEqual({
          freeObj: { tags: ['a', 'b'] }
        })
      })

      test('null value is null', async () => {
        // Today: renders as '' and is kept, since there is no schema to say the key may be removed
        expect(await run({ freeObj: { nothing: liquid('{{ properties.nul }}') } })).toStrictEqual({
          freeObj: { nothing: null }
        })
      })
    })
  })

  describe('whole object from a single liquid function', () => {
    describe('gaps', () => {
      test('object property is passed through as an object', async () => {
        // Today: the object is rendered to a string and fails validation
        expect(await run({ anyObj: liquid('{{ properties.obj }}') })).toStrictEqual({ anyObj: { k: 1 } })
      })

      test('json filter output is parsed into an object', async () => {
        expect(await run({ anyObj: liquid('{{ properties.obj | json }}') })).toStrictEqual({ anyObj: { k: 1 } })
      })
    })
  })

  describe('array of objects (multiple: true)', () => {
    describe('coerced today', () => {
      test('liquid inside each item is coerced', async () => {
        const mapping = { objArr: [{ flag: liquid('{{ properties.no }}') }] }
        expect(await run(mapping)).toStrictEqual({ objArr: [{ flag: false }] })
      })
    })
  })
})
