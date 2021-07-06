import { readdirSync } from 'fs'
import { join } from 'path'
import validate from '../validate'

function* fixtures(subdir: string) {
  const path = join(__dirname, '..', 'schema-fixtures', subdir)
  const files = readdirSync(path, { withFileTypes: true })

  for (const f of files) {
    if (!f.isFile() || !f.name.endsWith('.json')) {
      continue
    }

    // eslint-disable-next-line
    const { mapping, expectError } = require(join(path, f.name))
    yield {
      name: f.name,
      mapping,
      expectError
    }
  }
}

describe('validation', () => {
  describe('passes valid mappings', () => {
    for (const fixture of fixtures('valid')) {
      it(fixture.name, () => {
        expect(() => {
          validate(fixture.mapping)
        }).not.toThrow()
      })
    }
  })

  describe('fails invalid mappings', () => {
    for (const fixture of fixtures('invalid')) {
      it(fixture.name, () => {
        expect(fixture.expectError).toBeDefined()
        expect(typeof fixture.expectError === 'string' || Array.isArray(fixture.expectError)).toBe(true)

        try {
          validate(fixture.mapping)
        } catch (error) {
          if (typeof fixture.expectError === 'string') {
            expect(error.message).toMatch(fixture.expectError)
          } else {
            for (const err of error) {
              expect(fixture.expectError).toContain(err.message)
            }
          }
        }
      })
    }
  })
})
