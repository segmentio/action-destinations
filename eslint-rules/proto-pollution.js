'use strict'
// Shared `no-restricted-syntax` entries for prototype-pollution shapes.
// A "dynamic" access is a computed member whose key is not a literal (a[x], a[`${x}`]).
// If such a key is "__proto__", "constructor" or "prototype", a[x] resolves to a shared
// prototype object, and writing through it modifies every object in the process.
// Numeric loop indexes (i/j/idx/index) are excluded: they cannot be "__proto__".
// Data-flow shapes (aliases, loop walkers, recursive merges) are covered by the custom
// rule in ./proto-pollution-alias.js.
const DYN = "MemberExpression[computed=true][property.type!='Literal'][property.name!=/^(i|j|idx|index)$/]"
const NAMED = (o, p) => `[callee.type='MemberExpression'][callee.object.name='${o}'][callee.property.name='${p}']`

const HOWTO =
  'Use Object.create(null) or a Map, check hasOwnProperty, and reject __proto__/constructor/prototype keys. ' +
  'If reviewed and safe: // eslint-disable-next-line no-restricted-syntax -- reviewed: <reason>'

const selectors = {
  nested: [`AssignmentExpression > ${DYN}.left > ${DYN}.object`, 'Nested dynamic property write a[x][y] = v'],
  staticInner: [
    `AssignmentExpression > MemberExpression.left[computed=false] > ${DYN}.object`,
    'Write to a static property of a dynamic lookup a[x].y = v'
  ],
  initThenWrite: [
    `AssignmentExpression > ${DYN}.left > :matches(AssignmentExpression, LogicalExpression).object`,
    'Write through an initialised dynamic lookup (a[x] ||= {})[y] = v'
  ],
  update: [`UpdateExpression > ${DYN}.argument > ${DYN}.object`, 'Nested dynamic update a[x][y]++'],
  del: [`UnaryExpression[operator='delete'] > ${DYN}.argument > ${DYN}.object`, 'Nested dynamic delete a[x][y]'],
  destructure: [
    `:matches(ArrayPattern, Property, AssignmentPattern) > ${DYN} > ${DYN}.object`,
    'Destructuring into a nested dynamic target a[x][y]'
  ],
  reflectiveWrite: [
    `CallExpression:matches(${NAMED('Object', 'assign')}, ${NAMED('Object', 'defineProperty')}, ${NAMED(
      'Object',
      'defineProperties'
    )}, ${NAMED('Reflect', 'set')}, ${NAMED('Reflect', 'defineProperty')}) > ${DYN}.arguments:first-child`,
    'Object.assign/defineProperty/Reflect.set into a dynamic lookup a[x]'
  ],
  deepLib: [
    'CallExpression:matches([callee.name=/^(merge|mergeWith|defaultsDeep|set|setWith|zipObjectDeep|deepmerge|dset|unflatten)$/], [callee.property.name=/^(merge|mergeWith|defaultsDeep|set|setWith|zipObjectDeep|unflatten)$/][callee.object.name=/^(_|lodash|dotProp|objectPath|flat)$/])',
    'Deep merge/set helper: keys from untrusted input can reach __proto__'
  ]
}

module.exports = Object.entries(selectors).map(([name, [selector, what]]) => ({
  selector,
  message: `[proto-pollution/${name}] ${what} can be abused via __proto__/constructor/prototype keys. ${HOWTO}`
}))
