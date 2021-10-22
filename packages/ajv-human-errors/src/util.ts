export const capitalize = (s: string | null) => {
  if (typeof s !== 'string' || s.length === 0) {
    return s;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Ultra-naieve implementation because we only pluralize "character" currently.
 */
export const pluralize = (s: string, num: number) => {
  if (num === 1) {
    return s;
  }
  return `${s}s`;
};

/**
 * converts a JSON Pointer to JSON Path.
 */
export const jsonPath = (s: string) => {
  if (s === '') {
    return '$';
  }

  const path = s
    .substring(1)
    .split(/\//)
    .map(s => {
      // unescape JSON Pointer and escape JSON Path
      return s.replace(/~1/g, '/').replace(/~0/g, '~').replace(/\./g, '\\.');
    })
    .map(s => {
      // use array access format
      if (/^\d+$/.exec(s)) {
        return `[${s}]`;
      }
      return `.${s}`;
    }).join('');

  return '$' + path;
};

/**
 * takes a JSON Pointer string and converts it to a more human-readable form using JSON Path.
 */
export const humanizePath = (s: string) => {
  if (s === '') {
    return 'the root value';
  }
  return `the value at ${jsonPath(s)}`;
};

/**
 * returns "a" or "an" for the given word.
 * Obviously this is not comprehensive, but it covers the possible return values of `typeof`.
 */
export const indefiniteArticle = (s: string) => {
  switch (s[0]) {
    case 'a':
    case 'e':
    case 'i':
    case 'o':
    case 'u':
      return 'an';

    default:
      return 'a';
  }
};

/**
 * returns a human-readable type for the given value with an indefinite article if it makes sense.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- this function actually is designed to accept any value
export const humanizeTypeOf = (value: any) => {
  const raw = typeof value;
  switch (raw) {
    case 'object':
      if (value === null) {
        return 'null';
      }
      if (Array.isArray(value)) {
        return 'an array';
      }
      return 'an object';

    case 'undefined':
      return 'undefined';

    default:
      return `${indefiniteArticle(raw)} ${raw}`;
  }
};

/**
 * returns a human-readable version of the given list of values.
 */
export const humanizeList = (arr: string[], conjunction = 'and') => {
  if (arr.length === 0) {
    return 'nothing';
  }
  if (arr.length === 1) {
    return arr[0];
  }
  if (arr.length === 2) {
    return `${arr[0]} ${conjunction} ${arr[1]}`;
  }
  return `${arr.slice(0, -1).join(', ')}, ${conjunction} ${arr[arr.length - 1]}`;
};
