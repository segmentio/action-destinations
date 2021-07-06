const { add, complete, cycle, suite } = require('benny')
const { parseFql, validate } = require('@segment/destination-subscriptions')

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

const addFqlCase = (fql) => add(fql, () => {
  validate(parseFql(fql), event)
})

module.exports = suite(
  'FQL Parsing',

  addFqlCase('type = "track"'),
  addFqlCase('type = "nope"'),
  addFqlCase('contains(properties.neighborhood, "Lat")'),
  addFqlCase('match(properties.noun, "*bor")'),
  addFqlCase('properties.sweaterColor = "red"'),

  cycle(),
  complete()
)
