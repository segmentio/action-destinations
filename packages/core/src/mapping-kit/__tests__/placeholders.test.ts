import { render } from '../placeholders'

const fixtures = [
  {
    template: '{{foo}}',
    data: { foo: true },
    output: 'true'
  },
  {
    template: '{{foo}}',
    data: { foo: 1 },
    output: '1'
  },
  {
    template: '{{foo}}',
    data: { foo: { bar: 'baz' } },
    output: '[object Object]'
  },
  {
    template: '{{foo}}',
    data: { foo: null },
    output: ''
  },
  {
    template: '{{foo}}',
    data: { foo: undefined },
    output: ''
  },
  {
    template: '{{foo}}}',
    data: { foo: 'hello' },
    output: 'hello}'
  }
]

describe('placeholders', () => {
  test('throws if not given a template string', () => {
    // @ts-expect-error testing bad input
    expect(() => render({})).toThrowError(/Invalid template/)
  })

  test('returns the template as-is if there are no curlies', () => {
    const value = render('Hello world')
    expect(value).toBe('Hello world')
  })

  test('replaces non-existent data with empty string', () => {
    const value = render('Hello {{foo}}')
    expect(value).toBe('Hello ')
  })

  test('replaces placeholders with existing data', () => {
    const value = render('Hello {{foo}} {{bar}}', { foo: 'Mr.', bar: 'Bean' })
    expect(value).toBe('Hello Mr. Bean')
  })

  test('replaces placeholders with existing nested data', () => {
    const value = render('Hello {{foo.bar}}', { foo: { bar: 'World' } })
    expect(value).toBe('Hello World')
  })

  describe('replacements', () => {
    for (const fixture of fixtures) {
      test(`${fixture.template} -> ${JSON.stringify(fixture.data)}`, () => {
        const value = render(fixture.template, fixture.data)
        expect(value).toBe(fixture.output)
      })
    }
  })
})
