import { createTestIntegration, DynamicFieldResponse } from '@segment/actions-core'
import { Features } from '@segment/actions-core/mapping-kit'
import nock from 'nock'
import { CANARY_API_VERSION, formatToE164, commonEmailValidation, convertTimestamp } from '../functions'
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
      .post(`/v19/customers/${settings.customerId}/googleAds:searchStream`)
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

describe('email formatting', () => {
  it('should format a non-hashed value', async () => {
    expect(commonEmailValidation('    test@gmail.com    ')).toEqual('test@gmail.com')
  })

  it('should throw error for non email value', async () => {
    expect(() => commonEmailValidation('test')).toThrowError(`Email provided doesn't seem to be in a valid format.`)
  })
})

describe('phone number formatting', () => {
  it('should format a US phone number', async () => {
    expect(formatToE164('16195551000', '+1')).toEqual('+16195551000')
    expect(formatToE164('6195551000', '+1')).toEqual('+16195551000')
    expect(formatToE164('6195551000', '1')).toEqual('+16195551000')
    expect(formatToE164('6195551000', '+1')).toEqual('+16195551000')
  })

  it('should format a UK phone number', async () => {
    expect(formatToE164('44 20 7123 4567', '44')).toEqual('+442071234567')
    expect(formatToE164('20 7123 4567', '44')).toEqual('+442071234567')
    expect(formatToE164('2071234567', '44')).toEqual('+442071234567')
    expect(formatToE164('442071234567', '44')).toEqual('+442071234567')
    expect(formatToE164('+44 20 7123 4567', '44')).toEqual('+442071234567')
    expect(formatToE164('+44 20 7123 4567', '+44')).toEqual('+442071234567')
  })

  it('should format a German phone number', async () => {
    expect(formatToE164('49 30 1234567', '49')).toEqual('+49301234567')
    expect(formatToE164('30 1234567', '49')).toEqual('+49301234567')
    expect(formatToE164('301234567', '49')).toEqual('+49301234567')
    expect(formatToE164('49301234567', '+49')).toEqual('+49301234567')
    expect(formatToE164('+49 30 1234567', '49')).toEqual('+49301234567')
    expect(formatToE164('+49 30 1234567', '49')).toEqual('+49301234567')
  })
})

describe('convertTimestamp', () => {
  it('should convert timestamp with milliseconds', () => {
    const timestamp = '2025-03-11T19:03:56.616960388Z'
    const result = convertTimestamp(timestamp)
    expect(result).toEqual('2025-03-11 19:03:56+00:00')
  })

  it('should convert timestamp without milliseconds', () => {
    const timestamp = '2025-03-11T17:57:29Z'
    const result = convertTimestamp(timestamp)
    expect(result).toEqual('2025-03-11 17:57:29+00:00')
  })
})
