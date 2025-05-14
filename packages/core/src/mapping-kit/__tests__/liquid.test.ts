import { transform } from '../index'

describe('@liquid', () => {
  test('connected', () => {
    const output = transform({ field: { '@liquid': 'test' } }, { properties: { test: 'abc' } })

    expect(output).toStrictEqual({ field: 'test' })
  })
  test('simple', () => {
    const output = transform(
      { field: { '@liquid': 'Hello, {{ properties.world }} !' } },
      { properties: { world: 'Earth' } }
    )

    expect(output).toStrictEqual({ field: 'Hello, Earth !' })
  })

  test('simple with multiple mappings', () => {
    const output = transform(
      {
        fieldA: { '@liquid': 'Hello, {{ properties.world }}' },
        fieldB: { '@liquid': 'Hi Patrick this is {{ properties.name }}' }
      },
      { properties: { world: 'Earth', name: 'SpongeBob' } }
    )

    expect(output).toStrictEqual({
      fieldA: 'Hello, Earth',
      fieldB: 'Hi Patrick this is SpongeBob'
    })
  })

  test('simple with multiple mappings and nested objects', () => {
    const output = transform(
      {
        fieldA: { '@liquid': 'Hello, {{ properties.planet.country.city }}' },
        fieldB: { '@liquid': 'Hi Patrick this is {{ properties.name }}, I want a {{ traits.preferences.food }}' }
      },
      {
        properties: { planet: { country: { city: 'Bikini Bottom' } }, name: 'SpongeBob' },
        traits: { preferences: { food: 'Krabby Patty' } }
      }
    )

    expect(output).toStrictEqual({
      fieldA: 'Hello, Bikini Bottom',
      fieldB: 'Hi Patrick this is SpongeBob, I want a Krabby Patty'
    })
  })

  test('with a tag', () => {
    const output = transform(
      {
        field: {
          '@liquid':
            '{% if properties.world == "Earth" %}Hello {{ properties.world }} {% else %} Hello World {% endif %}'
        }
      },
      { properties: { world: 'Earth' } }
    )

    expect(output).toStrictEqual({ field: 'Hello Earth ' })
  })

  test('with a filter', () => {
    const output = transform(
      { field: { '@liquid': 'HELLO {{ properties.world | upcase }}' } },
      { properties: { world: 'earth' } }
    )

    expect(output).toStrictEqual({ field: 'HELLO EARTH' })
  })

  test('with a tag and with a filter', () => {
    const output = transform(
      {
        field: {
          '@liquid':
            '{% if properties.world == "earth" %}Hello {{ properties.world | upcase }}{% else %} Hello World {% endif %}'
        }
      },
      { properties: { world: 'earth' } }
    )

    expect(output).toStrictEqual({ field: 'Hello EARTH' })
  })

  test('@liquid template must be a string', () => {
    expect(() => {
      transform({ field: { '@liquid': 123 } }, { properties: { test: 'test' } })
    }).toThrow(new RegExp('should be a string but it is'))

    expect(() => {
      transform({ field: { '@liquid': {} } }, { properties: { test: 'test' } })
    }).toThrow(new RegExp('should be a string but it is'))

    expect(() => {
      transform({ field: { '@liquid': [] } }, { properties: { test: 'test' } })
    }).toThrow(new RegExp('should be a string but it is'))

    expect(() => {
      transform({ field: { '@liquid': true } }, { properties: { test: 'test' } })
    }).toThrow(new RegExp('should be a string but it is'))
  })

  describe('performance limits', () => {
    test('limit of 1000 characters maximum enforced', () => {
      const bigString = 'a'.repeat(1001)

      expect(() =>
        transform({ field: { '@liquid': '{{ properties.test }}' + bigString } }, { properties: { test: 'test' } })
      ).toThrow(new RegExp('^liquid template values are limited to 1000 characters'))
    })
  })

  describe('disabled liquid tags', () => {
    const disabledTags = ['case', 'for', 'include', 'layout', 'render', 'tablerow']

    disabledTags.forEach((tag) => {
      test(`tag: ${tag} is disabled`, () => {
        expect(() =>
          transform({ field: { '@liquid': `{% ${tag} %} , {{ properties.test }}` } }, { properties: { test: 'test' } })
        ).toThrow(new RegExp(`^tag "${tag}" is disabled`))
      })
    })
  })

  describe('disabled liquid filters', () => {
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

    disabledFilters.forEach((filter) => {
      test(`filter: ${filter} is disabled`, () => {
        expect(() =>
          transform({ field: { '@liquid': `{{ properties.test | ${filter} }}` } }, { properties: { test: 'test' } })
        ).toThrow(new RegExp(`^filter "${filter}" is disabled`))
      })
    })
  })
})
