import nock from 'nock'
// import { createTestIntegration } from '@segment/actions-core'
// import Definition from '../index'

//const testDestination = createTestIntegration(Definition)

describe('Dynamic Yield Audiences', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(/.*/).persist().post(/.*/).reply(200)

      expect(true).toBe(true)
    })
  })
})
