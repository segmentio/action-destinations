const ogTimeout = global.setTimeout
// @ts-expect-error
jest.spyOn(global, 'setTimeout').mockImplementation(function (handler, delay) {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  ogTimeout(handler, delay)
  return {
    unref: jest.fn()
  }
})

import { test } from '@oclif/test'
import * as fs from 'fs'
import * as path from 'path'
import * as prompt from '../lib/prompt'
import * as rimraf from 'rimraf'

jest.setTimeout(10000)

describe('cli init command', () => {
  const testDir = path.join('.', 'testResults')
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdir(testDir, (err) => {
        console.log(err)
      })
    }
  })

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      rimraf.sync(testDir)
    }
  })

  test
    .stub(prompt, 'autoPrompt', () => {
      return { directory: testDir, name: 'test basic', slug: 'test-basic', template: 'basic-auth' }
    })
    .stdout()
    .command(['init'])
    .command(['generate:types'])
    .it('should scaffold an action with basic auth scheme', (ctx) => {
      expect(ctx.stdout).toContain('Done creating "test basic"')
      const scaffoldedAction = fs.readFileSync(path.join(testDir, 'test-basic', 'index.ts'), 'utf8')
      expect(scaffoldedAction).toContain("scheme: 'basic'")
    })

  test
    .stub(prompt, 'autoPrompt', () => {
      return { directory: testDir, name: 'test custom auth', slug: 'test-custom-auth', template: 'custom-auth' }
    })
    .stdout()
    .command(['init'])
    .command(['generate:types'])
    .it('should scaffold an action with custom auth scheme', (ctx) => {
      expect(ctx.stdout).toContain('Done creating "test custom auth"')
      const scaffoldedAction = fs.readFileSync(path.join(testDir, 'test-custom-auth', 'index.ts'), 'utf8')
      expect(scaffoldedAction).toContain("scheme: 'custom'")
    })

  test
    .stub(prompt, 'autoPrompt', () => {
      return { directory: testDir, name: 'test minimal', slug: 'test-minimal', template: 'minimal' }
    })
    .stdout()
    .command(['init'])
    .command(['generate:types'])
    .it('should scaffold a minimal action', (ctx) => {
      expect(ctx.stdout).toContain('Done creating "test minimal"')
      const scaffoldedAction = fs.readFileSync(path.join(testDir, 'test-minimal', 'index.ts'), 'utf8')
      expect(scaffoldedAction).toContain("name: 'test minimal'")
    })

  test
    .stub(prompt, 'autoPrompt', () => {
      return { directory: testDir, name: 'test oauth', slug: 'test-oauth', template: 'oauth2-auth' }
    })
    .stdout()
    .command(['init'])
    .command(['generate:types'])
    .it('should scaffold a oauth2 action', (ctx) => {
      expect(ctx.stdout).toContain('Done creating "test oauth"')
      const scaffoldedAction = fs.readFileSync(path.join(testDir, 'test-oauth', 'index.ts'), 'utf8')
      expect(scaffoldedAction).toContain("scheme: 'oauth2'")
    })
})
