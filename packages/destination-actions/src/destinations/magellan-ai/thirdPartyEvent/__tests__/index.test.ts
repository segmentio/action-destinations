import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const pixelToken = '123abc'
const requiredFields = {
  evtname: 'Custom Event',
  host: 'Appsflyer',
  app: 'Magellan AI Mobile',
  ip: '12.34.56.78',
  ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  ts: '2024-04-24 12:34:56.000',
  plat: 'Android'
}
const optionalFields = {
  aifa: '12345678-1234-1234-1234-1234567890ab',
  andi: '12345678-1234-1234-1234-1234567890ab',
  idfa: '12345678-1234-1234-1234-1234567890ab',
  idfv: '12345678-1234-1234-1234-1234567890ab',
  evtattrs: {
    foo: 'bar',
    baz: 123
  }
}

describe('MagellanAI.thirdPartyEvent', () => {
  it('invokes the correct endpoint', async () => {
    const expectedPayload = { token: pixelToken, ...requiredFields }
    nock('https://mgln.ai').post('/event', expectedPayload).reply(200)

    await testDestination.testAction('thirdPartyEvent', {
      mapping: requiredFields,
      settings: { pixelToken: pixelToken }
    })
  })

  for (const requiredField in requiredFields) {
    it(`fails if the ${requiredField} field is missing`, async () => {
      try {
        await testDestination.testAction('thirdPartyEvent', {
          mapping: { ...requiredFields, [requiredField]: undefined },
          settings: { pixelToken: pixelToken }
        })
      } catch (err) {
        expect(err.message).toContain(`The root value is missing the required field '${requiredField}'.`)
      }
    })
  }

  it('accepts all optional fields', async () => {
    const expectedPayload = { token: pixelToken, ...requiredFields, ...optionalFields }
    nock('https://mgln.ai').post('/event', expectedPayload).reply(200)

    await testDestination.testAction('thirdPartyEvent', {
      mapping: { ...requiredFields, ...optionalFields },
      settings: { pixelToken: pixelToken }
    })
  })

  it('rejects any extraneous fields', async () => {
    const expectedPayload = { token: pixelToken, ...requiredFields, ...optionalFields }
    nock('https://mgln.ai').post('/event', expectedPayload).reply(200)

    await testDestination.testAction('thirdPartyEvent', {
      mapping: { ...requiredFields, ...optionalFields, foo: 'bar', baz: 123 },
      settings: { pixelToken: pixelToken }
    })
  })
})
