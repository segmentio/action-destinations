import { createTestIntegration, DynamicFieldResponse } from '@segment/actions-core'
import { Features } from '@segment/actions-core/mapping-kit'
import nock from 'nock'
import { CANARY_API_VERSION } from '../functions'
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

  it('should use Canary API Version when feature flag is ON', async () => {
    const settings = {
      customerId: '123-456-7890'
    }
    // When Flag is ON, will use Canary API Version.
    const features: Features = { 'google-enhanced-canary-version': true }
    nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/1234567890/googleAds:searchStream`)
      .post('')
      .reply(201, [
        {
          results: [
            {
              conversionAction: {
                resourceName: 'customers/1234567890/conversionActions/819597798',
                id: '819597798',
                name: 'Purchase'
              }
            },
            {
              conversionAction: {
                resourceName: 'customers/1234567890/conversionActions/1055693999',
                id: '1055693999',
                name: 'Page view'
              }
            },
            {
              conversionAction: {
                resourceName: 'customers/1234567890/conversionActions/1055694122',
                id: '1055694122',
                name: 'Add to cart'
              }
            }
          ],
          fieldMask: 'conversionAction.id,conversionAction.name',
          requestId: 'u6QgrVJQCSKQrTXx0j4tAg'
        }
      ])

    const payload = {}
    const responses = (await testDestination.testDynamicField('uploadConversionAdjustment', 'conversion_action', {
      settings,
      payload,
      auth,
      features
    })) as DynamicFieldResponse

    expect(responses.choices.length).toBe(3)
    expect(responses.choices).toStrictEqual([
      { value: '819597798', label: 'Purchase' },
      { value: '1055693999', label: 'Page view' },
      { value: '1055694122', label: 'Add to cart' }
    ])
  })

  it('should return error message and code if dynamic fetch fails', async () => {
    const settings = {
      customerId: '1234567890'
    }
    const features: Features = { 'google-enhanced-canary-version': true }

    const errorResponse = {
      response: {
        status: '401',
        statusText: 'Unauthorized'
      }
    }
    nock(`https://googleads.googleapis.com`)
      .post(`/v15/customers/${settings.customerId}/googleAds:searchStream`)
      .reply(401, errorResponse)

    const payload = {}
    const responses = (await testDestination.testDynamicField('uploadConversionAdjustment', 'conversion_action', {
      settings,
      payload,
      auth,
      features
    })) as DynamicFieldResponse

    expect(responses.choices.length).toBe(0)
    expect(responses.error?.message).toEqual(errorResponse.response.statusText)
    expect(responses.error?.code).toEqual(errorResponse.response.status)
  })
})
