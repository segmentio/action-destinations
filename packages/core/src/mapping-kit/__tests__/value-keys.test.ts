import { getFieldValueKeys } from '../value-keys'

describe('getFieldValueKeys', () => {
  it('should return empty [] for strings', () => {
    const value = 'https://webhook.site/very-legit'

    const keys = getFieldValueKeys(value)

    expect(keys).toEqual([])
  })

  it('should return empty [] for booleans', () => {
    const value = false

    const keys = getFieldValueKeys(value)

    expect(keys).toEqual([])
  })

  it('should return empty [] for empty objects', () => {
    const value = {}

    const keys = getFieldValueKeys(value)

    expect(keys).toEqual([])
  })

  it('should return correct keys for single @path', () => {
    const value = {
      '@path': '$.properties.string'
    }

    const keys = getFieldValueKeys(value)

    expect(keys).toEqual(['$.properties.string'])
  })

  it('should return correct keys for single @templates', () => {
    const value = {
      value: {
        '@template': '{{__segment_entities.log-test-1.ENTITIES_TEST.PRODUCTS.NAME}}'
      }
    }

    const keys = getFieldValueKeys(value)

    expect(keys).toEqual(['__segment_entities.log-test-1.ENTITIES_TEST.PRODUCTS.NAME'])
  })

  it('should return correct keys for multiple @templates', () => {
    const value = {
      value: {
        '@template': '{{__segment_entities.log-test-1.ENTITIES_TEST.PRODUCTS.NAME}}-{{test}}'
      }
    }

    const keys = getFieldValueKeys(value)

    expect(keys).toEqual(['__segment_entities.log-test-1.ENTITIES_TEST.PRODUCTS.NAME', 'test'])
  })

  it('should return correct keys for objects', () => {
    const value = {
      Category: {
        '@template': '{{__segment_entities.log-test-1.ENTITIES_TEST.PRODUCTS.CATEGORY}}'
      },
      Enriched_ID: 'test',
      Name: {
        '@path': '$.properties.string'
      }
    }

    const keys = getFieldValueKeys(value)

    expect(keys).toEqual(['__segment_entities.log-test-1.ENTITIES_TEST.PRODUCTS.CATEGORY', '$.properties.string'])
  })

  it('should return correct keys for @arrayPath (not yet supported for enrichments)', () => {
    const value = {
      '@arrayPath': [{ '@template': '{{properties.products}}' }, { productId: { '@template': '{{productId}}' } }]
    }

    const keys = getFieldValueKeys(value)

    expect(keys).toEqual(['properties.products', 'productId'])
  })

  it('should return correct keys for @json', () => {
    const value = {
      '@json': {
        mode: 'encode',
        value: {
          '@template': '{{properties.products}}'
        }
      }
    }

    const keys = getFieldValueKeys(value)

    expect(keys).toEqual(['properties.products'])
  })
})
