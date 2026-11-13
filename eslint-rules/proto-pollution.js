// Shared `no-restricted-syntax` entry that flags nested dynamic writes `a[x][y] = v`
// where neither key is a literal. If `x` is "__proto__", `a[x]` resolves to a shared
// prototype object and the write modifies it.
module.exports = {
  selector:
    "AssignmentExpression > MemberExpression.left[computed=true][property.type!='Literal'] > MemberExpression.object[computed=true][property.type!='Literal']",
  message:
    'Nested dynamic property write can be abused via __proto__/constructor/prototype keys. ' +
    'Use Object.create(null) or a Map, check hasOwnProperty, and reject those keys. ' +
    'If reviewed and safe: // eslint-disable-next-line no-restricted-syntax -- reviewed: <reason>'
}
