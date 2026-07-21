import { formatAttributes } from '../utils'

describe('utils', () => {
  it('formatAttributes() should work', async () => {
    const attributes = {
      'bad_name Attribute %^%$': 'value',
      arrayAttribute: [1, 2, 3],
      strAttribute: 'string value',
      numberAttribute: 42,
      booleanAttribute: true,
      dateAttribute: '2023-10-01T12:00:00Z',
      urlAttribute: 'https://example.com'
    }

    const formattedAttributes = formatAttributes(attributes, false)

    expect(formattedAttributes).toEqual({
      bad_nameattribute: 'value',
      numberAttribute: 42,
      strattribute: 'string value',
      booleanAttribute: true,
      'date(dateattribute)': '2023-10-01T12:00:00Z',
      'url(urlattribute)': 'https://example.com'
    })
  })
})
