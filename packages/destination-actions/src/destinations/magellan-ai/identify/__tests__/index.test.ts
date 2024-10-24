import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const pixelToken = '123abc'
const requiredFields = {
  userId: 'user_foo',
  ip: '12.34.56.78',
  ua: 'Foo Bar User Agent'
}
const expectedPayload = { token: pixelToken, ...requiredFields }

describe('MagellanAI.identify', () => {
  it('invokes the correct endpoint', async () => {
    nock('https://mgln.ai').post('/identify', expectedPayload).reply(200)

    await testDestination.testAction('identify', {
      mapping: {
        userId: 'user_foo',
        ip: '12.34.56.78',
        ua: 'Foo Bar User Agent'
      },
      settings: { pixelToken: pixelToken }
    })
  })

  for (const requiredField in requiredFields) {
    it(`fails if the ${requiredField} field is missing`, async () => {
      try {
        await testDestination.testAction('identify', {
          mapping: { ...requiredFields, [requiredField]: undefined },
          settings: { pixelToken: pixelToken }
        })
      } catch (err) {
        expect(err.message).toContain(`The root value is missing the required field '${requiredField}'.`)
      }
    })
  }

  it('rejects extraneous data', async () => {
    nock('https://mgln.ai').post('/identify', expectedPayload).reply(200)

    await testDestination.testAction('identify', {
      mapping: {
        userId: 'user_foo',
        ip: '12.34.56.78',
        ua: 'Foo Bar User Agent',
        foo: 'bar'
      },
      settings: { pixelToken: pixelToken }
    })
  })
})
