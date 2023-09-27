import { createTestIntegration, DynamicFieldResponse } from '@segment/actions-core'
import destination from '../index'

const testDestination = createTestIntegration(destination)

const auth = {
  refreshToken: 'xyz321',
  accessToken: 'abc123'
}

describe('.getConversionActionId', () => {
  it('should dynamically fetch event keys', async () => {
    const settings = {
      customerId: '12345678'
    }
    const payload = {}
    const responses = (await testDestination.testDynamicField('uploadClickConversion', 'conversion_action', {
      settings,
      payload,
      auth
    })) as DynamicFieldResponse

    expect(responses.choices.length).toBeGreaterThanOrEqual(0)
  })
})
