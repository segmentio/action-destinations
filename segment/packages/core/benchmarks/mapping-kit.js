const { add, complete, cycle, suite } = require('benny')
const { transform } = require('@segment/actions-core')

const event = {
  type: 'track',
  event: 'Sweater On',
  context: {
    library: {
      name: 'analytics.js',
      version: '2.11.1'
    }
  },
  properties: {
    neighborhood: 'Latrobe',
    noun: 'neighbor',
    sweaterColor: 'red'
  }
}

module.exports = suite(
  'Mapping Kit Transforms',

  add('@path directive', () => {
    transform({ '@path': '$.properties.neighborhood' }, event)
  }),

  add('@template directive', () => {
    transform({ '@template': '{{properties.neighborhood}}' }, event)
  }),

  add('multiple directives', () => {
    transform({
      'foo': 'bar',
      'baz': { '@path': '$.properties.biz' },
      'qux': {
        '@if': {
          'exists': { '@path': '$.properties.noun' },
          'then': 'yep',
          'else': 'nope'
        }
      }
    }, event)
  }),

  cycle(),
  complete()
)
