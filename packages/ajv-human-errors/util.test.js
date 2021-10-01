const util = require('./util')

describe('capitalize', () => {
  it('returns a capitalized string', () => {
    expect(util.capitalize(null)).toStrictEqual(null)
    expect(util.capitalize({})).toStrictEqual({})
    expect(util.capitalize('')).toStrictEqual('')
    expect(util.capitalize('a')).toStrictEqual('A')
    expect(util.capitalize('foo bar')).toStrictEqual('Foo bar')
  })
})

describe('jsonPath', () => {
  it('translates JSON Pointer to JSON Path', () => {
    expect(util.jsonPath('')).toStrictEqual('$')
    expect(util.jsonPath('/foo')).toStrictEqual('$.foo')
    expect(util.jsonPath('/foo/bar')).toStrictEqual('$.foo.bar')
    expect(util.jsonPath('/foo/bar.baz')).toStrictEqual('$.foo.bar\\.baz')
    expect(util.jsonPath('/foo/bar/0')).toStrictEqual('$.foo.bar[0]')
    expect(util.jsonPath('/foo/bar/0/baz~0~1/x')).toStrictEqual('$.foo.bar[0].baz~/.x')
  })
})

describe('humanizePath', () => {
  it('returns humanize path string', () => {
    expect(util.humanizePath('')).toStrictEqual('the root value')
    expect(util.humanizePath('/foo/bar')).toStrictEqual('the value at $.foo.bar')
  })
})

describe('humanizeTypeOf', () => {
  it('returns human-readable English', () => {
    expect(util.humanizeTypeOf(null)).toStrictEqual('null')
    expect(util.humanizeTypeOf(undefined)).toStrictEqual('undefined')
    expect(util.humanizeTypeOf({})).toStrictEqual('an object')
    expect(util.humanizeTypeOf([])).toStrictEqual('an array')
    expect(util.humanizeTypeOf(1)).toStrictEqual('a number')
    expect(util.humanizeTypeOf('x')).toStrictEqual('a string')
  })
})

describe('indefiniteArticle', () => {
  it('returns the right indefinite article for basic JS types', () => {
    expect(util.indefiniteArticle('array')).toStrictEqual('an')
    expect(util.indefiniteArticle('object')).toStrictEqual('an')
    expect(util.indefiniteArticle('string')).toStrictEqual('a')
    expect(util.indefiniteArticle('number')).toStrictEqual('a')
  })
})

describe('humanizeList', () => {
  it('returns human-readable English', () => {
    expect(util.humanizeList([])).toStrictEqual('nothing')
    expect(util.humanizeList(['a'])).toStrictEqual('a')
    expect(util.humanizeList(['a', 'b'], 'or')).toStrictEqual('a or b')
    expect(util.humanizeList(['a', 'b', 'c'], 'and')).toStrictEqual('a, b, and c')
  })
})

describe('pluralize', () => {
  it('returns basic pluralized form', () => {
    expect(util.pluralize('character', 0)).toStrictEqual('characters')
    expect(util.pluralize('character', 1)).toStrictEqual('character')
    expect(util.pluralize('character', 2)).toStrictEqual('characters')
  })
})
