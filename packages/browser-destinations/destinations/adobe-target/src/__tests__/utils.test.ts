import { serializeProperties } from '../utils'

describe('Utils', () => {
  describe('serializeProperties', () => {
    test('converts array properties to string', async () => {
      const tags = ['leonardo', 'michelangelo', 'donatello', 'raphael']
      const properties = {
        eventName: 'purchase',
        total: 42.42,
        item: 'car',
        itemTags: tags
      }

      expect(serializeProperties(properties)).toEqual({
        eventName: 'purchase',
        total: 42.42,
        item: 'car',
        itemTags: '["leonardo","michelangelo","donatello","raphael"]'
      })
    })
  })
})
