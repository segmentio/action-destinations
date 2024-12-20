import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const pixelToken = '123abc'
const expectedPayload = { userId: 'user_foo', token: pixelToken }

describe('MagellanAI.identify', () => {
  it('invokes the correct endpoint', async () => {
    nock('https://mgln.ai').post('/identify', expectedPayload).reply(200)

    await testDestination.testAction('identify', {
      mapping: { userId: 'user_foo' },
      settings: { pixelToken: pixelToken }
    })
  })

  it(`fails if the userId field is missing`, async () => {
    try {
      await testDestination.testAction('identify', {
        mapping: {},
        settings: { pixelToken: pixelToken }
      })
    } catch (err) {
      expect(err.message).toContain("The root value is missing the required field 'userId'.")
    }
  })

  it('rejects extraneous data', async () => {
    nock('https://mgln.ai').post('/identify', expectedPayload).reply(200)

    await testDestination.testAction('identify', {
      mapping: { userId: 'user_foo', foo: 'bar' },
      settings: { pixelToken: pixelToken }
    })
  })
})
