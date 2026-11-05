import { Linter } from 'eslint'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const protoPollution = require('../../../../eslint-rules/proto-pollution')

const linter = new Linter()
const lint = (code: string) =>
  linter.verify(code, {
    parserOptions: { ecmaVersion: 2019 },
    rules: { 'no-restricted-syntax': ['error', protoPollution] }
  })

describe('proto-pollution no-restricted-syntax selector', () => {
  it.each([
    'acc[sendIn][key] = value',
    'acc[a.b][c.d] = value',
    'acc[x][y] += 1',
    'acc[`${x}`][y] = v',
    'a.b[x][y] = v',
    'a[x][y][z] = v'
  ])('flags %s', (code) => {
    const messages = lint(code)
    expect(messages).toHaveLength(1)
    expect(messages[0].ruleId).toBe('no-restricted-syntax')
    expect(messages[0].message).toContain('__proto__')
  })

  it.each([
    "acc['header'][key] = value",
    'acc[0][1] = value',
    'acc.header[key] = value',
    'acc[x].y = value',
    'acc[x] = value',
    'acc[x][y]',
    'const v = acc[x][y]',
    'map.set(x, value)',
    'map.get(x).set(y, value)',
    'Object.defineProperty(acc, x, { value })'
  ])('does not flag %s', (code) => {
    expect(lint(code)).toHaveLength(0)
  })
})
