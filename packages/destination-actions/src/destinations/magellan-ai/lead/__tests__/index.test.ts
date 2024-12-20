import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const pixelToken = '123abc'
const requiredFields = {
  value: 1099.99,
  currency: 'USD'
}
const optionalFields = {
  id: 'lead-ID-123',
  productId: 'product_id_0123',
  quantity: 100,
  type: 'Bulk',
  category: 'Sales'
}

describe('MagellanAI.lead', () => {
  it('invokes the correct endpoint', async () => {
    const expectedPayload = { token: pixelToken, ...requiredFields }
    nock('https://mgln.ai').post('/lead', expectedPayload).reply(200)

    await testDestination.testAction('lead', {
      mapping: requiredFields,
      settings: { pixelToken: pixelToken }
    })
  })

  for (const requiredField in requiredFields) {
    it(`fails if the ${requiredField} field is missing`, async () => {
      try {
        await testDestination.testAction('lead', {
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
    nock('https://mgln.ai').post('/lead', expectedPayload).reply(200)

    await testDestination.testAction('lead', {
      mapping: { ...requiredFields, ...optionalFields },
      settings: { pixelToken: pixelToken }
    })
  })

  it('rejects any extraneous fields', async () => {
    const expectedPayload = { token: pixelToken, ...requiredFields, ...optionalFields }
    nock('https://mgln.ai').post('/lead', expectedPayload).reply(200)

    await testDestination.testAction('lead', {
      mapping: { ...requiredFields, ...optionalFields, foo: 'bar', baz: 123 },
      settings: { pixelToken: pixelToken }
    })
  })
})
