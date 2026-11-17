'use strict'
// Flags prototype-pollution shapes that need data flow, which no-restricted-syntax selectors cannot see:
//   1. alias:        const t = a[x]; t[y] = v      (also t.y = v, Object.assign(t, ...))
//   2. walker:       cur = cur[k]; cur[last] = v
//   3. recursion:    function m(t, s) { ... m(t[k], s[k]) }  with a dynamic write in m
// "Dynamic" means a computed key that is not a literal.
const INDEX = /^(i|j|idx|index)$/ // numeric loop indexes cannot be '__proto__'
const isDyn = (n) =>
  n &&
  n.type === 'MemberExpression' &&
  n.computed &&
  n.property.type !== 'Literal' &&
  !(n.property.type === 'Identifier' && INDEX.test(n.property.name))
const unwrap = (n) => {
  while (n && ['TSAsExpression', 'TSNonNullExpression', 'TSTypeAssertion', 'ChainExpression'].includes(n.type))
    n = n.expression
  return n
}
// value expression yields a dynamic lookup: a[x], a[x] || {}, a[x] ??= {}, (a[x] = a[x] || {})
const yieldsDyn = (n) => {
  n = unwrap(n)
  if (!n) return false
  if (isDyn(n)) return true
  if (n.type === 'LogicalExpression') return yieldsDyn(n.left)
  if (n.type === 'AssignmentExpression') return isDyn(unwrap(n.left)) || yieldsDyn(n.right)
  return false
}
const REFLECT = new Map([
  ['Object', ['assign', 'defineProperty', 'defineProperties']],
  ['Reflect', ['set', 'defineProperty']]
])

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'disallow writes through objects obtained by a dynamic key (prototype pollution)' },
    schema: [],
    messages: {
      alias:
        "'{{name}}' was read with a dynamic key, so it can be Object.prototype (key '__proto__') or Object (key 'constructor'). Writing to it can pollute every object in the process. Use a Map or Object.create(null), allowlist the keys, or reject '__proto__'/'constructor'/'prototype'.",
      recursion:
        "Recursive call passes a dynamic-key lookup ('{{name}}[...]') into a function that writes with dynamic keys: a deep merge/set can reach Object.prototype. Skip '__proto__'/'constructor'/'prototype' keys and only recurse into own properties."
    }
  },
  create(context) {
    const tainted = new WeakSet()
    const sc = context.getSourceCode()
    const scopeOf = (node) => (sc.getScope ? sc.getScope(node) : context.getScope())
    const resolve = (node, id) => {
      for (let s = scopeOf(node); s; s = s.upper) {
        const v = s.set.get(id.name)
        if (v) return v
      }
      return null
    }
    const isTaintedId = (node, n) => {
      n = unwrap(n)
      if (!n || n.type !== 'Identifier') return null
      const v = resolve(node, n)
      return v && tainted.has(v) ? n.name : null
    }
    const markTarget = (node, id) => {
      const v = resolve(node, id)
      if (v) tainted.add(v)
    }
    const checkWrite = (node, target) => {
      target = unwrap(target)
      if (!target || target.type !== 'MemberExpression') return
      if (target.computed && target.property.type === 'Literal') return
      const name = isTaintedId(node, target.object)
      if (name) context.report({ node, messageId: 'alias', data: { name } })
    }
    const fnStack = []
    return {
      ':function'(node) {
        fnStack.push({
          node,
          name: node.id
            ? node.id.name
            : node.parent && node.parent.type === 'VariableDeclarator' && node.parent.id.type === 'Identifier'
            ? node.parent.id.name
            : null,
          params: new Set(
            node.params
              .map((p) => unwrap(p.type === 'AssignmentPattern' ? p.left : p))
              .filter((p) => p && p.type === 'Identifier')
              .map((p) => p.name)
          ),
          writtenParams: new Set(),
          calls: []
        })
      },
      ':function:exit'() {
        const f = fnStack.pop()
        for (const c of f.calls)
          if (f.writtenParams.has(c.name))
            context.report({ node: c.node, messageId: 'recursion', data: { name: c.name } })
      },
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier' && yieldsDyn(node.init)) markTarget(node, node.id)
      },
      AssignmentExpression(node) {
        const left = unwrap(node.left)
        if (left && left.type === 'Identifier' && yieldsDyn(node.right)) markTarget(node, left)
        checkWrite(node, left)
        if (isDyn(left) && fnStack.length) {
          // record writes of the form param[dynamicKey](.x)* = v
          let o = left
          while (o && o.type === 'MemberExpression') o = unwrap(o.object)
          const f = fnStack[fnStack.length - 1]
          if (o && o.type === 'Identifier' && f.params.has(o.name)) f.writtenParams.add(o.name)
        }
      },
      UpdateExpression(node) {
        checkWrite(node, node.argument)
      },
      'UnaryExpression[operator="delete"]'(node) {
        checkWrite(node, node.argument)
      },
      CallExpression(node) {
        const c = node.callee
        if (
          c.type === 'MemberExpression' &&
          !c.computed &&
          c.object.type === 'Identifier' &&
          (REFLECT.get(c.object.name) || []).includes(c.property.name)
        ) {
          const name = isTaintedId(node, node.arguments[0])
          if (name) context.report({ node, messageId: 'alias', data: { name } })
        }
        const f = fnStack[fnStack.length - 1]
        if (f && f.name && c.type === 'Identifier' && c.name === f.name) {
          // an argument whose member chain contains param[dynamicKey], e.g. m(t[k], ...) or m(t[k].children, ...)
          for (let a of node.arguments) {
            for (a = unwrap(a); a && a.type === 'MemberExpression'; a = unwrap(a.object)) {
              const o = unwrap(a.object)
              if (isDyn(a) && o.type === 'Identifier' && f.params.has(o.name)) {
                f.calls.push({ node, name: o.name })
                break
              }
            }
          }
        }
      }
    }
  }
}
