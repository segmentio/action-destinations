import { createTestIntegration, DynamicFieldResponse } from '@segment/actions-core'
import destination from '../index'

const testDestination = createTestIntegration(destination)

const auth = {
  refreshToken: 'xyz321',
  accessToken: 'abc123'
}

describe('.getConversionActionId', () => {
  it('should dynamically fetch event keys for uploadClickConversion action', async () => {
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

describe('.getConversionActionId', () => {
  it('should dynamically fetch event keys for uploadCallConversion action', async () => {
    const settings = {
      customerId: '12345678'
    }
    const payload = {}
    const responses = (await testDestination.testDynamicField('uploadCallConversion', 'conversion_action', {
      settings,
      payload,
      auth
    })) as DynamicFieldResponse

    expect(responses.choices.length).toBeGreaterThanOrEqual(0)
  })
})

describe('.getConversionActionId', () => {
  it('should dynamically fetch event keys for uploadConversionAdjustment action', async () => {
    const settings = {
      customerId: '12345678'
    }
    const payload = {}
    const responses = (await testDestination.testDynamicField('uploadConversionAdjustment', 'conversion_action', {
      settings,
      payload,
      auth
    })) as DynamicFieldResponse

    expect(responses.choices.length).toBeGreaterThanOrEqual(0)
  })
})
