import { Linter } from 'eslint'
/* eslint-disable @typescript-eslint/no-var-requires */
const protoPollution = require('../../../../eslint-rules/proto-pollution')
const protoPollutionAlias = require('../../../../eslint-rules/proto-pollution-alias')
/* eslint-enable @typescript-eslint/no-var-requires */

const linter = new Linter()
linter.defineRule('proto-pollution-alias', protoPollutionAlias)
const config: Linter.Config = {
  parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
  rules: {
    'no-restricted-syntax': ['error', ...protoPollution],
    'proto-pollution-alias': 'error'
  }
}
const ruleIds = (code: string) => {
  const messages = linter.verify(code, config)
  expect(messages.filter((m) => m.fatal)).toEqual([])
  return [...new Set(messages.map((m) => m.ruleId))]
}

// [description, code, rule expected to flag it]
const vulnerable: [string, string, string][] = [
  ['init then nested write', 'acc[a] = acc[a] || {}; acc[a][key] = value', 'no-restricted-syntax'],
  [
    'nested write in for-in',
    'for (let key in m) { const bucket = m[key]; props[bucket][key] = search }',
    'no-restricted-syntax'
  ],
  ['nested init and push', 'if (!r[f]) r[f] = {}; if (!r[f][p]) r[f][p] = []; r[f][p].push(d)', 'no-restricted-syntax'],
  ['static inner key', 'acc[a].name = v', 'no-restricted-syntax'],
  ['alias of dynamic lookup', 'const t = acc[a]; t[b] = v', 'proto-pollution-alias'],
  ['logical assignment init', '(acc[a] ||= {})[b] = v', 'no-restricted-syntax'],
  ['inline || init', '(acc[a] = acc[a] || {})[b] = v', 'no-restricted-syntax'],
  ['Object.assign target', 'Object.assign(acc[a], src)', 'no-restricted-syntax'],
  ['Object.defineProperty target', 'Object.defineProperty(acc[a], b, { value: v })', 'no-restricted-syntax'],
  ['Reflect.set target', 'Reflect.set(acc[a], b, v)', 'no-restricted-syntax'],
  ['update expression', 'acc[a][b]++', 'no-restricted-syntax'],
  ['delete', 'delete acc[a][b]', 'no-restricted-syntax'],
  ['destructuring target', '({ x: acc[a][b] } = obj)', 'no-restricted-syntax'],
  ['template literal key', 'acc[`${a}`][b] = v', 'no-restricted-syntax'],
  ['three levels', 'acc[a][b][c] = v', 'no-restricted-syntax'],
  [
    'loop walker',
    'let cur = obj; for (const k of path.slice(0, -1)) cur = cur[k] = cur[k] || {}; cur[last] = v',
    'proto-pollution-alias'
  ],
  [
    'recursive merge',
    'function merge(t, s) { for (const k in s) { if (typeof s[k] === "object") { t[k] = t[k] || {}; merge(t[k], s[k]) } else t[k] = s[k] } }',
    'proto-pollution-alias'
  ],
  [
    'recursive merge into child property',
    'function mergeC(t, s) { for (const p of Object.keys(s)) { if (!t[p]) { t[p] = s[p]; continue } t[p].pinned = s[p].pinned; mergeC(t[p].children, s[p].children) } }',
    'proto-pollution-alias'
  ],
  ['lodash set', "const { set } = require('lodash'); set(obj, path, v)", 'no-restricted-syntax'],
  ['lodash merge', "const _ = require('lodash'); _.merge(target, JSON.parse(body))", 'no-restricted-syntax']
]

const clean: [string, string][] = [
  ['single-level write', 'acc[k] = v'],
  ['literal outer key', "acc['events'][k] = v"],
  ['Map', 'm.get(a).set(b, v)'],
  ['read only', 'const v = acc[a][b]'],
  ['numeric indexes', 'grid[i][j] = 0'],
  ['numeric index then static key', 'parts[i].err = e'],
  ['static outer key', 'acc.header[key] = value']
]

describe('prototype-pollution lint rules', () => {
  it.each(vulnerable)('flags %s', (_name, code, rule) => {
    expect(ruleIds(code)).toContain(rule)
  })

  it.each(clean)('does not flag %s', (_name, code) => {
    expect(ruleIds(code)).toEqual([])
  })

  it('catches the full vulnerable pattern set', () => {
    expect(vulnerable.filter(([, code]) => ruleIds(code).length > 0)).toHaveLength(vulnerable.length)
  })

  it.each([
    ['no-restricted-syntax', 'acc[a][b] = v'],
    ['proto-pollution-alias', 'const t = acc[a]; t[b] = v']
  ])('honors a reviewed %s suppression', (rule, code) => {
    const lines = code.split('; ')
    const last = lines.pop()
    const suppressed = [...lines, `// eslint-disable-next-line ${rule} -- reviewed: test`, last].join('\n')
    expect(ruleIds(code)).toContain(rule)
    expect(linter.verify(suppressed, config).filter((m) => m.ruleId === rule)).toEqual([])
  })
})
