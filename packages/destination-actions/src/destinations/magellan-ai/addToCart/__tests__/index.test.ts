import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const pixelToken = '123abc'
const requiredFields = {
  value: 1234.56,
  currency: 'AUD',
  quantity: 10
}
const optionalFields = {
  productId: 'product_id_0123',
  productName: 'Foo Bar Widget',
  productType: 'widget',
  productVendor: 'ACME',
  variantId: 'variant_id_789abc',
  variantName: 'Jumbo Widget'
}

describe('MagellanAI.addToCart', () => {
  it('invokes the correct endpoint', async () => {
    const expectedPayload = { token: pixelToken, ...requiredFields }
    nock('https://mgln.ai').post('/add_to_cart', expectedPayload).reply(200)

    await testDestination.testAction('addToCart', {
      mapping: requiredFields,
      settings: { pixelToken: pixelToken }
    })
  })

  for (const requiredField in requiredFields) {
    it(`fails if the ${requiredField} field is missing`, async () => {
      try {
        await testDestination.testAction('addToCart', {
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
    nock('https://mgln.ai').post('/add_to_cart', expectedPayload).reply(200)

    await testDestination.testAction('addToCart', {
      mapping: { ...requiredFields, ...optionalFields },
      settings: { pixelToken: pixelToken }
    })
  })

  it('rejects any extraneous fields', async () => {
    const expectedPayload = { token: pixelToken, ...requiredFields, ...optionalFields }
    nock('https://mgln.ai').post('/add_to_cart', expectedPayload).reply(200)

    await testDestination.testAction('addToCart', {
      mapping: { ...requiredFields, ...optionalFields, foo: 'bar', baz: 123 },
      settings: { pixelToken: pixelToken }
    })
  })
})
