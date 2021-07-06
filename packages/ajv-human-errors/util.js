module.exports.capitalize = (s) => {
  if (typeof s !== 'string' || s.length === 0) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Ultra-naieve implementation because we only pluralize "character" currently.
module.exports.pluralize = (s, num) => {
  if (num === 1) return s
  else return s + 's'
}

// jsonPath converts a JSON Pointer to JSON Path.
function jsonPath (s) {
  if (s === '') return '$'

  const path = s
    .substring(1)
    .split(/\//)
    .map(s => {
      // unescape JSON Pointer and escape JSON Path
      return s.replace(/~1/g, '/').replace(/~0/g, '~').replace(/\./g, '\\.')
    })
    .map(s => {
      // use array access format
      if (s.match(/^\d+$/)) return `[${s}]`
      else return '.' + s
    }).join('')

  return '$' + path
}

module.exports.jsonPath = jsonPath

// humanizePath takes a JSON Pointer string and converts it to a more human-readable form using JSON
// Path.
module.exports.humanizePath = (s) => {
  if (s === '') return 'the root value'
  return `the value at ${jsonPath(s)}`
}

// humanizeTypeOf returns a human-readable type for the given value with an indefinite article if it
// makes sense.
module.exports.humanizeTypeOf = (v) => {
  const raw = typeof v
  switch (raw) {
    case 'object':
      if (v === null) return 'null'
      if (Array.isArray(v)) return 'an array'
      return 'an object'
    case 'undefined':
      return 'undefined'
    default:
      return `${indefiniteArticle(raw)} ${raw}`
  }
}

// indefiniteArticle returns "a" or "an" for the given word. Obviously this is not comprehensive,
// but it covers the possible return values of `typeof`.
function indefiniteArticle (s) {
  switch (s[0]) {
    case 'a':
    case 'e':
    case 'i':
    case 'o':
    case 'u':
      return 'an'
    default:
      return 'a'
  }
}

module.exports.indefiniteArticle = indefiniteArticle

// humanizeList returns a human-readable version of the given list of values.
module.exports.humanizeList = (arr, conjunction = 'and') => {
  if (arr.length === 0) return 'nothing'
  if (arr.length === 1) return arr[0]
  if (arr.length === 2) return `${arr[0]} ${conjunction} ${arr[1]}`
  return `${arr.slice(0, -1).join(', ')}, ${conjunction} ${arr[arr.length - 1]}`
}
