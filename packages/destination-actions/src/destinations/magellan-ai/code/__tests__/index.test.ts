import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const pixelToken = '123abc'
const requiredFields = {
  code: 'FOOBAR29',
  type: 'discount%',
  ip: '12.34.56.78',
  ua: 'Foo Bar User Agent'
}
const expectedPayload = { token: pixelToken, ...requiredFields }

describe('MagellanAI.code', () => {
  it('invokes the correct endpoint', async () => {
    nock('https://mgln.ai').post('/code', expectedPayload).reply(200)

    await testDestination.testAction('code', {
      mapping: {
        code: 'FOOBAR29',
        type: 'discount%',
        ip: '12.34.56.78',
        ua: 'Foo Bar User Agent'
      },
      settings: { pixelToken: pixelToken }
    })
  })

  for (const requiredField in requiredFields) {
    it(`fails if the ${requiredField} field is missing`, async () => {
      try {
        await testDestination.testAction('code', {
          mapping: { ...requiredFields, [requiredField]: undefined },
          settings: { pixelToken: pixelToken }
        })
      } catch (err) {
        expect(err.message).toContain(`The root value is missing the required field '${requiredField}'.`)
      }
    })
  }

  it('rejects extraneous data', async () => {
    nock('https://mgln.ai').post('/code', expectedPayload).reply(200)

    await testDestination.testAction('code', {
      mapping: {
        code: 'FOOBAR29',
        type: 'discount%',
        ip: '12.34.56.78',
        ua: 'Foo Bar User Agent',
        baz: 'bar'
      },
      settings: { pixelToken: pixelToken }
    })
  })
})
