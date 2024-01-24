import { capitalize, humanizeList, humanizePath, humanizeTypeOf, indefiniteArticle, jsonPath, pluralize } from './util';

describe('capitalize', () => {
  it('returns a capitalized string', () => {
    expect(capitalize(null)).toStrictEqual(null);
    // @ts-expect-error intentionally invalid value
    expect(capitalize({})).toStrictEqual({});
    expect(capitalize('')).toStrictEqual('');
    expect(capitalize('a')).toStrictEqual('A');
    expect(capitalize('foo bar')).toStrictEqual('Foo bar');
  });
});

describe('jsonPath', () => {
  it('translates JSON Pointer to JSON Path', () => {
    expect(jsonPath('')).toStrictEqual('$');
    expect(jsonPath('/foo')).toStrictEqual('$.foo');
    expect(jsonPath('/foo/bar')).toStrictEqual('$.foo.bar');
    expect(jsonPath('/foo/bar.baz')).toStrictEqual('$.foo.bar\\.baz');
    expect(jsonPath('/foo/bar/0')).toStrictEqual('$.foo.bar[0]');
    expect(jsonPath('/foo/bar/0/baz~0~1/x')).toStrictEqual('$.foo.bar[0].baz~/.x');
  });
});

describe('humanizePath', () => {
  it('returns humanize path string', () => {
    expect(humanizePath('')).toStrictEqual('the root value');
    expect(humanizePath('/foo/bar')).toStrictEqual('the value at $.foo.bar');
  });
});

describe('humanizeTypeOf', () => {
  it('returns human-readable English', () => {
    expect(humanizeTypeOf(null)).toStrictEqual('null');
    expect(humanizeTypeOf(undefined)).toStrictEqual('undefined');
    expect(humanizeTypeOf({})).toStrictEqual('an object');
    expect(humanizeTypeOf([])).toStrictEqual('an array');
    expect(humanizeTypeOf(1)).toStrictEqual('a number');
    expect(humanizeTypeOf('x')).toStrictEqual('a string');
  });
});

describe('indefiniteArticle', () => {
  it('returns the right indefinite article for basic JS types', () => {
    expect(indefiniteArticle('array')).toStrictEqual('an');
    expect(indefiniteArticle('object')).toStrictEqual('an');
    expect(indefiniteArticle('string')).toStrictEqual('a');
    expect(indefiniteArticle('number')).toStrictEqual('a');
  });
});

describe('humanizeList', () => {
  it('returns human-readable English', () => {
    expect(humanizeList([])).toStrictEqual('nothing');
    expect(humanizeList(['a'])).toStrictEqual('a');
    expect(humanizeList(['a', 'b'], 'or')).toStrictEqual('a or b');
    expect(humanizeList(['a', 'b', 'c'], 'and')).toStrictEqual('a, b, and c');
  });
});

describe('pluralize', () => {
  it('returns basic pluralized form', () => {
    expect(pluralize('character', 0)).toStrictEqual('characters');
    expect(pluralize('character', 1)).toStrictEqual('character');
    expect(pluralize('character', 2)).toStrictEqual('characters');
  });
});
