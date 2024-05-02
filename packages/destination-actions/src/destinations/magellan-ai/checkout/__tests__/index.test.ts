import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const pixelToken = '123abc'
const requiredFields = {
  value: 999.99,
  currency: 'USD'
}
const optionalFields = {
  id: 'order_123-abc',
  quantity: 20,
  discountCode: 'FOOBAR29',
  lineItems: [
    {
      productId: 'product_id_456def',
      productName: 'Baz Widget',
      productType: 'widget',
      productVendor: 'ACME',
      variantId: 'variant_id_012xyz',
      variantName: 'Small Widget',
      quantity: 5
    },
    {
      productId: 'product_id_789ghi',
      productName: 'Qux Widget',
      productType: 'widget',
      productVendor: 'ACME',
      variantId: 'variant_id_345rst',
      variantName: 'Medium Widget',
      quantity: 3
    }
  ]
}

describe('MagellanAI.checkout', () => {
  it('invokes the correct endpoint', async () => {
    const expectedPayload = { token: pixelToken, ...requiredFields }
    nock('https://mgln.ai').post('/checkout', expectedPayload).reply(200)

    await testDestination.testAction('checkout', {
      mapping: requiredFields,
      settings: { pixelToken: pixelToken }
    })
  })

  for (const requiredField in requiredFields) {
    it(`fails if the ${requiredField} field is missing`, async () => {
      try {
        await testDestination.testAction('checkout', {
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
    nock('https://mgln.ai').post('/checkout', expectedPayload).reply(200)

    await testDestination.testAction('checkout', {
      mapping: { ...requiredFields, ...optionalFields },
      settings: { pixelToken: pixelToken }
    })
  })

  it('rejects any extraneous fields', async () => {
    const expectedPayload = { token: pixelToken, ...requiredFields, ...optionalFields }
    nock('https://mgln.ai').post('/checkout', expectedPayload).reply(200)

    await testDestination.testAction('checkout', {
      mapping: { ...requiredFields, ...optionalFields, foo: 'bar', baz: 123 },
      settings: { pixelToken: pixelToken }
    })
  })
})
