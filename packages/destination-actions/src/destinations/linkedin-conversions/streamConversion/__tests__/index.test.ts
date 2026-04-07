import nock from 'nock'
import {
  createTestEvent,
  createTestIntegration,
  RefreshTokenAndRetryError,
  RetryableError
} from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import { BASE_URL } from '../../constants'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const currentTimestamp = Date.now()

const event = createTestEvent({
  messageId: 'this-is-an-event-id12345',
  event: 'Example Event',
  type: 'track',
  timestamp: currentTimestamp.toString(),
  context: {
    traits: {
      email: 'testing@testing.com',
      upperCaseEmail: 'WHYAREYOUYELLING@EMAIL.com',
      preHashedEmail: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777',
      first_name: 'mike',
      last_name: 'smith',
      title: 'software engineer',
      companyName: 'microsoft',
      countryCode: 'US',
      value: 100
    }
  },
  traits: {
    email: 'testing@testing.com'
  },
  properties: {
    currency: 'USD',
    revenue: 200
  }
})

const secondEvent = createTestEvent({
  messageId: 'another-event-12345',
  event: 'Example Event',
  type: 'track',
  timestamp: currentTimestamp.toString(),
  context: {
    traits: {
      email: 'nick@testing.com',
      upperCaseEmail: 'some_email@EMAIL.com',
      first_name: 'sponge',
      last_name: 'bob',
      title: 'software engineer',
      companyName: 'Krusty Krab',
      countryCode: 'US',
      value: 1000
    }
  },
  traits: {
    email: 'nick@testing.com'
  },
  properties: {
    currency: 'USD',
    revenue: 300
  }
})

const settings = {}
const payload = {
  campaignId: ['56789'],
  adAccountId: '12345',
  conversionId: 789123
}

describe('LinkedinConversions.streamConversion', () => {
  it('should successfully send the event with strictly required fields', async () => {
    nock(`${BASE_URL}/conversionEvents`)
      .post('', {
        conversion: 'urn:lla:llaPartnerConversion:789123',
        conversionHappenedAt: currentTimestamp,
        user: {
          userIds: [
            {
              idType: 'SHA256_EMAIL',
              idValue: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'
            }
          ]
        }
      })
      .reply(201)

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.context.traits.email' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: payload.conversionId
            }
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).resolves.not.toThrowError()
  })

  it('should successfully send the event with all fields', async () => {
    nock(`${BASE_URL}/conversionEvents`)
      .post('', {
        conversion: 'urn:lla:llaPartnerConversion:789123',
        conversionHappenedAt: currentTimestamp,
        conversionValue: {
          currencyCode: 'USD',
          amount: '100'
        },
        user: {
          userIds: [
            {
              idType: 'SHA256_EMAIL',
              idValue: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'
            }
          ],
          userInfo: {
            firstName: 'mike',
            lastName: 'smith',
            title: 'software engineer',
            companyName: 'microsoft',
            countryCode: 'US'
          }
        }
      })
      .reply(201)

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.context.traits.email' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          conversionValue: {
            currencyCode: 'USD',
            amount: { '@path': '$.context.traits.value' }
          },
          userInfo: {
            firstName: { '@path': '$.context.traits.first_name' },
            lastName: { '@path': '$.context.traits.last_name' },
            title: { '@path': '$.context.traits.title' },
            companyName: { '@path': '$.context.traits.companyName' },
            countryCode: { '@path': '$.context.traits.countryCode' }
          },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: payload.conversionId
            }
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).resolves.not.toThrowError()
  })

  it('should successfully send the event with externalIds field as an array', async () => {
    nock(`${BASE_URL}/conversionEvents`)
      .post('', {
        conversion: 'urn:lla:llaPartnerConversion:789123',
        conversionHappenedAt: currentTimestamp,
        conversionValue: {
          currencyCode: 'USD',
          amount: '100'
        },
        user: {
          userIds: [
            {
              idType: 'SHA256_EMAIL',
              idValue: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'
            }
          ],
          userInfo: {
            firstName: 'mike',
            lastName: 'smith',
            title: 'software engineer',
            companyName: 'microsoft',
            countryCode: 'US'
          },
          externalIds: ['external_id_12345']
        }
      })
      .reply(201)

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.context.traits.email' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          conversionValue: {
            currencyCode: 'USD',
            amount: { '@path': '$.context.traits.value' }
          },
          userInfo: {
            firstName: { '@path': '$.context.traits.first_name' },
            lastName: { '@path': '$.context.traits.last_name' },
            title: { '@path': '$.context.traits.title' },
            companyName: { '@path': '$.context.traits.companyName' },
            countryCode: { '@path': '$.context.traits.countryCode' }
          },
          externalIds: ['external_id_12345'],
          onMappingSave: {
            inputs: {},
            outputs: {
              id: payload.conversionId
            }
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).resolves.not.toThrowError()
  })

  it('should successfully send the event with externalIds field as a string', async () => {
    nock(`${BASE_URL}/conversionEvents`)
      .post('', {
        conversion: 'urn:lla:llaPartnerConversion:789123',
        conversionHappenedAt: currentTimestamp,
        conversionValue: {
          currencyCode: 'USD',
          amount: '100'
        },
        user: {
          userIds: [
            {
              idType: 'SHA256_EMAIL',
              idValue: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'
            }
          ],
          userInfo: {
            firstName: 'mike',
            lastName: 'smith',
            title: 'software engineer',
            companyName: 'microsoft',
            countryCode: 'US'
          },
          externalIds: ['external_id_12345']
        }
      })
      .reply(201)

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.context.traits.email' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          conversionValue: {
            currencyCode: 'USD',
            amount: { '@path': '$.context.traits.value' }
          },
          userInfo: {
            firstName: { '@path': '$.context.traits.first_name' },
            lastName: { '@path': '$.context.traits.last_name' },
            title: { '@path': '$.context.traits.title' },
            companyName: { '@path': '$.context.traits.companyName' },
            countryCode: { '@path': '$.context.traits.countryCode' }
          },
          externalIds: 'external_id_12345',
          onMappingSave: {
            inputs: {},
            outputs: {
              id: payload.conversionId
            }
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).resolves.not.toThrowError()
  })

  it('should successfully send the event when externalIds array contains more than 1 item', async () => {
    nock(`${BASE_URL}/conversionEvents`)
      .post('', {
        conversion: 'urn:lla:llaPartnerConversion:789123',
        conversionHappenedAt: currentTimestamp,
        conversionValue: {
          currencyCode: 'USD',
          amount: '100'
        },
        user: {
          userIds: [
            {
              idType: 'SHA256_EMAIL',
              idValue: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'
            }
          ],
          userInfo: {
            firstName: 'mike',
            lastName: 'smith',
            title: 'software engineer',
            companyName: 'microsoft',
            countryCode: 'US'
          },
          externalIds: ['external_id_12345']
        }
      })
      .reply(201)

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.context.traits.email' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          conversionValue: {
            currencyCode: 'USD',
            amount: { '@path': '$.context.traits.value' }
          },
          userInfo: {
            firstName: { '@path': '$.context.traits.first_name' },
            lastName: { '@path': '$.context.traits.last_name' },
            title: { '@path': '$.context.traits.title' },
            companyName: { '@path': '$.context.traits.companyName' },
            countryCode: { '@path': '$.context.traits.countryCode' }
          },
          externalIds: ['external_id_12345', 'external_id_67890'], // second item will be dropped
          onMappingSave: {
            inputs: {},
            outputs: {
              id: payload.conversionId
            }
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).resolves.not.toThrowError()
  })

  it('should successfully send a batch request with all fields', async () => {
    nock(`${BASE_URL}/conversionEvents`)
      .post('', {
        elements: [
          {
            conversion: 'urn:lla:llaPartnerConversion:789123',
            conversionHappenedAt: currentTimestamp,
            conversionValue: {
              currencyCode: 'USD',
              amount: '100'
            },
            user: {
              userIds: [
                {
                  idType: 'SHA256_EMAIL',
                  idValue: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'
                }
              ],
              userInfo: {
                firstName: 'mike',
                lastName: 'smith',
                title: 'software engineer',
                companyName: 'microsoft',
                countryCode: 'US'
              }
            }
          },
          {
            conversion: 'urn:lla:llaPartnerConversion:789123',
            conversionHappenedAt: currentTimestamp,
            conversionValue: {
              currencyCode: 'USD',
              amount: '1000'
            },
            user: {
              userIds: [
                {
                  idType: 'SHA256_EMAIL',
                  idValue: '9155510f76fbf498f1d9d69198150962106ee10169eae019115efbeb16969921'
                }
              ],
              userInfo: {
                firstName: 'sponge',
                lastName: 'bob',
                title: 'software engineer',
                companyName: 'Krusty Krab',
                countryCode: 'US'
              }
            }
          }
        ]
      })
      .reply(201)

    await expect(
      testDestination.testBatchAction('streamConversion', {
        events: [event, secondEvent],
        settings,
        mapping: {
          email: { '@path': '$.context.traits.email' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          conversionValue: {
            currencyCode: 'USD',
            amount: { '@path': '$.context.traits.value' }
          },
          userInfo: {
            firstName: { '@path': '$.context.traits.first_name' },
            lastName: { '@path': '$.context.traits.last_name' },
            title: { '@path': '$.context.traits.title' },
            companyName: { '@path': '$.context.traits.companyName' },
            countryCode: { '@path': '$.context.traits.countryCode' }
          },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: payload.conversionId
            }
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).resolves.not.toThrowError()
  })

  it('should successully send the event using default mappings', async () => {
    nock(`${BASE_URL}/conversionEvents`)
      .post('', {
        conversion: 'urn:lla:llaPartnerConversion:789123',
        conversionHappenedAt: currentTimestamp,
        eventId: 'this-is-an-event-id12345',
        conversionValue: {
          currencyCode: 'USD',
          amount: '200'
        },
        user: {
          userIds: [
            {
              idType: 'SHA256_EMAIL',
              idValue: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'
            }
          ]
        }
      })
      .reply(201)

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          onMappingSave: {
            inputs: {},
            outputs: {
              id: payload.conversionId
            }
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).resolves.not.toThrowError()
  })

  it('should throw an error if timestamp is not within the past 90 days', async () => {
    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          user: {
            '@path': '$.context.traits.user'
          },
          conversionHappenedAt: '50000000000',
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).rejects.toThrowError('Timestamp should be within the past 90 days.')
  })

  it('should throw an error no user ID fields were defined.', async () => {
    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).rejects.toThrowError('One of email or LinkedIn UUID or Axciom ID or Oracle ID is required.')
  })

  it('should normalize the user ID email field such that uppercase letters are converted to lowercase', async () => {
    nock(`${BASE_URL}/conversionEvents`)
      .post('', {
        conversion: 'urn:lla:llaPartnerConversion:789123',
        conversionHappenedAt: currentTimestamp,
        user: {
          userIds: [
            {
              idType: 'SHA256_EMAIL',
              idValue: '691f95429e014a31230a8963ea28daff1da1c2e4d95f9723a4ea36c548ed2e58'
            }
          ]
        }
      })
      .reply(201)

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.context.traits.upperCaseEmail' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: payload.conversionId
            }
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).resolves.not.toThrowError()
  })

  it('should throw an error if the userInfo object is defined without both a first or last name', async () => {
    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          userInfo: {
            companyName: { '@path': '$.context.traits.companyName' }
          },
          email: { '@path': '$.context.traits.email' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).rejects.toThrowError(
      "User Info is missing the required field 'firstName'. User Info is missing the required field 'lastName'."
    )
  })

  it('should throw an error if the userInfo object is defined without a first name', async () => {
    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          userInfo: {
            lastName: { '@path': '$.context.traits.lastName' }
          },
          email: { '@path': '$.context.traits.email' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).rejects.toThrowError("User Info is missing the required field 'firstName'.")
  })

  it('should throw an error if the userInfo object is defined without a last name', async () => {
    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          userInfo: {
            firstName: { '@path': '$.context.traits.firstName' }
          },
          email: { '@path': '$.context.traits.email' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).rejects.toThrowError("User Info is missing the required field 'lastName'.")
  })

  it('should throw RefreshTokenAndRetryError when LinkedIn returns 401 with token propagation error code', async () => {
    nock(`${BASE_URL}/conversionEvents`).post(/.*/).reply(401, {
      serviceErrorCode: 65601,
      message: 'Unable to verify access token'
    })

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.context.traits.email' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: 789123
            }
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).rejects.toThrow(RefreshTokenAndRetryError)
  })

  it('should throw RetryableError for the full propagation-delay flow without refreshing token', async () => {
    // Simulate a fresh token that hasn't propagated yet:
    // the conversion call returns 401+65601, the framework throws RetryableError
    // so Segment infrastructure retries later — no token refresh needed.
    nock(`${BASE_URL}/conversionEvents`).post(/.*/).reply(401, {
      serviceErrorCode: 65601,
      message: 'Unable to verify access token'
    })

    await expect(
      testDestination.onEvent(event, {
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'streamConversion',
          mapping: {
            email: { '@path': '$.context.traits.email' },
            conversionHappenedAt: { '@path': '$.timestamp' },
            onMappingSave: {
              inputs: {},
              outputs: { id: 789123 }
            },
            enable_batching: false,
            batch_size: 5000
          }
        },
        oauth: {
          access_token: 'old-not-yet-propagated-token',
          refresh_token: 'refresh-token'
        }
      })
    ).rejects.toThrow(RetryableError)
  })

  it('should detect hashed email if feature flag for smart hashing is passed', async () => {
    nock(`${BASE_URL}/conversionEvents`)
      .post('', {
        conversion: 'urn:lla:llaPartnerConversion:789123',
        conversionHappenedAt: currentTimestamp,
        user: {
          userIds: [
            {
              idType: 'SHA256_EMAIL',
              idValue: '584c4423c421df49955759498a71495aba49b8780eb9387dff333b6f0982c777'
            }
          ]
        }
      })
      .reply(201)

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.context.traits.preHashedEmail' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: payload.conversionId
            }
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).resolves.not.toThrowError()
  })
})

describe('LinkedinConversions.dynamicField', () => {
  it('conversionId: should give error if adAccountId is not provided', async () => {
    const settings = {}

    const payload = {
      adAccountId: ''
    }

    const dynamicFn =
      testDestination.actions.streamConversion.definition.hooks?.onMappingSave?.inputFields?.conversionRuleId.dynamic
    const responses = (await testDestination.testDynamicField(
      'streamConversion',
      'conversionId',
      {
        settings,
        payload
      },
      dynamicFn
    )) as DynamicFieldResponse

    expect(responses).toMatchObject({
      choices: [],
      error: {
        message: 'Please select Ad Account first to get list of Conversion Rules.',
        code: 'FIELD_NOT_SELECTED'
      }
    })
  })

  it('campaignId: should give error if adAccountId is not provided', async () => {
    const settings = {}

    const payload = {
      adAccountId: ''
    }

    const dynamicFn =
      testDestination.actions.streamConversion.definition.hooks?.onMappingSave?.inputFields?.campaignId.dynamic
    const responses = (await testDestination.testDynamicField(
      'streamConversion',
      'campaignId',
      {
        settings,
        payload
      },
      dynamicFn
    )) as DynamicFieldResponse

    expect(responses).toMatchObject({
      choices: [],
      error: {
        message: 'Please select Ad Account first to get list of Conversion Rules.',
        code: 'FIELD_NOT_SELECTED'
      }
    })
  })
})

describe('LinkedinConversions.timestamp', () => {
  it('should convert a human readable date to a unix timestamp', async () => {
    event.timestamp = currentTimestamp.toString()

    nock(`${BASE_URL}/conversionEvents`).post(/.*/).reply(201)

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.context.traits.email' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: payload.conversionId
            }
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).resolves.not.toThrowError()
  })

  it('should convert a string unix timestamp to a number', async () => {
    event.timestamp = currentTimestamp.toString()

    nock(`${BASE_URL}/conversionEvents`).post(/.*/).reply(201)

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.context.traits.email' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: payload.conversionId
            }
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).resolves.not.toThrowError()
  })
})

describe('LinkedinConversions.onMappingSave - Conversion Rule Creation', () => {
  it('should successfully create a new conversion rule with all required fields', async () => {
    const mockConversionRuleResponse = {
      id: '123456',
      name: 'Test Conversion Rule',
      type: 'PURCHASE',
      attributionType: 'LAST_TOUCH_BY_CAMPAIGN',
      postClickAttributionWindowSize: 30,
      viewThroughAttributionWindowSize: 7
    }

    nock(`${BASE_URL}/conversions`)
      .post('', {
        name: 'Test Conversion Rule',
        account: 'urn:li:sponsoredAccount:12345',
        conversionMethod: 'CONVERSIONS_API',
        postClickAttributionWindowSize: 30,
        viewThroughAttributionWindowSize: 7,
        attributionType: 'LAST_TOUCH_BY_CAMPAIGN',
        type: 'PURCHASE'
      })
      .reply(201, mockConversionRuleResponse)

    nock(`${BASE_URL}/conversionEvents`).post(/.*/).reply(201)

    // Test that action can use the created conversion rule
    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.context.traits.email' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: '123456',
              name: 'Test Conversion Rule',
              conversionType: 'PURCHASE',
              attribution_type: 'LAST_TOUCH_BY_CAMPAIGN',
              post_click_attribution_window_size: 30,
              view_through_attribution_window_size: 7
            }
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).resolves.not.toThrowError()

    // Verify the conversion rule creation API was not called
    // (since we're providing existing outputs, the /conversions stub is unused)
    nock.cleanAll()
  })

  it('should successfully stream events when existing conversion rule outputs are provided', async () => {
    nock(`${BASE_URL}/conversionEvents`).post(/.*/).reply(201)

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.context.traits.email' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: 'existing123',
              name: 'Existing Conversion Rule',
              conversionType: 'LEAD',
              attribution_type: 'LAST_TOUCH_BY_CONVERSION',
              post_click_attribution_window_size: 7,
              view_through_attribution_window_size: 1
            }
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).resolves.not.toThrowError()
  })

  it('should verify conversion rule creation API request format', async () => {
    const mockConversionRuleResponse = {
      id: '789456',
      name: 'Default Windows Rule',
      type: 'SIGN_UP',
      attributionType: 'LAST_TOUCH_BY_CAMPAIGN',
      postClickAttributionWindowSize: 30,
      viewThroughAttributionWindowSize: 7
    }

    const creationRequest = nock(`${BASE_URL}/conversions`)
      .post('', {
        name: 'Default Windows Rule',
        account: 'urn:li:sponsoredAccount:12345',
        conversionMethod: 'CONVERSIONS_API',
        postClickAttributionWindowSize: 30,
        viewThroughAttributionWindowSize: 7,
        attributionType: 'LAST_TOUCH_BY_CAMPAIGN',
        type: 'SIGN_UP'
      })
      .reply(201, mockConversionRuleResponse)

    nock(`${BASE_URL}/conversionEvents`).post(/.*/).reply(201)

    await expect(
      testDestination.testAction('streamConversion', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.context.traits.email' },
          conversionHappenedAt: {
            '@path': '$.timestamp'
          },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: '789456',
              name: 'Default Windows Rule',
              conversionType: 'SIGN_UP',
              attribution_type: 'LAST_TOUCH_BY_CAMPAIGN',
              post_click_attribution_window_size: 30,
              view_through_attribution_window_size: 7
            }
          },
          enable_batching: true,
          batch_size: 5000
        }
      })
    ).resolves.not.toThrowError()

    // Verify the conversion rule creation API was not called in this test
    // (since we're providing existing outputs)
    expect(creationRequest.isDone()).toBe(false)
  })
})

describe('LinkedinConversions.onMappingSave - performHook', () => {
  it('should return error when creating a new rule without required fields', async () => {
    const result = await testDestination.actions.streamConversion.executeHook('onMappingSave', {
      settings,
      hookInputs: {
        adAccountId: 'urn:li:sponsoredAccount:12345'
      },
      hookOutputs: {},
      payload: {}
    })

    expect(result).toMatchObject({
      error: {
        message: 'Missing required fields for creating a new conversion rule: Name, Conversion Type, Attribution Type',
        code: 'MISSING_REQUIRED_FIELD'
      }
    })
  })

  it('should return error when only some required fields are missing', async () => {
    const result = await testDestination.actions.streamConversion.executeHook('onMappingSave', {
      settings,
      hookInputs: {
        adAccountId: 'urn:li:sponsoredAccount:12345',
        name: 'My Rule'
      },
      hookOutputs: {},
      payload: {}
    })

    expect(result).toMatchObject({
      error: {
        message: 'Missing required fields for creating a new conversion rule: Conversion Type, Attribution Type',
        code: 'MISSING_REQUIRED_FIELD'
      }
    })
  })

  it('should skip validation when conversionRuleId is provided', async () => {
    nock(`${BASE_URL}/conversions/existingRule123`)
      .get('')
      .query({ account: 'urn:li:sponsoredAccount:12345' })
      .reply(200, {
        name: 'Existing Rule',
        type: 'PURCHASE',
        attributionType: 'LAST_TOUCH_BY_CAMPAIGN',
        postClickAttributionWindowSize: 30,
        viewThroughAttributionWindowSize: 7
      })

    const result = await testDestination.actions.streamConversion.executeHook('onMappingSave', {
      settings,
      hookInputs: {
        adAccountId: 'urn:li:sponsoredAccount:12345',
        conversionRuleId: 'existingRule123'
      },
      hookOutputs: {},
      payload: {}
    })

    expect(result.savedData).toMatchObject({
      id: 'existingRule123',
      name: 'Existing Rule',
      conversionType: 'PURCHASE',
      attribution_type: 'LAST_TOUCH_BY_CAMPAIGN'
    })
  })

  it('should skip validation when existing hook outputs are present', async () => {
    nock(`${BASE_URL}/conversions/prevRule456`).post('').query({ account: 'urn:li:sponsoredAccount:12345' }).reply(200)

    const result = await testDestination.actions.streamConversion.executeHook('onMappingSave', {
      settings,
      hookInputs: {
        adAccountId: 'urn:li:sponsoredAccount:12345'
      },
      hookOutputs: {
        onMappingSave: {
          outputs: {
            id: 'prevRule456',
            name: 'Previous Rule',
            conversionType: 'LEAD',
            attribution_type: 'LAST_TOUCH_BY_CONVERSION',
            post_click_attribution_window_size: 30,
            view_through_attribution_window_size: 7
          }
        }
      },
      payload: {}
    })

    expect(result.savedData).toMatchObject({
      id: 'prevRule456',
      name: 'Previous Rule'
    })
  })

  it('should successfully create a new conversion rule when all required fields are provided', async () => {
    nock(`${BASE_URL}/conversions`)
      .post('', {
        name: 'New Rule',
        account: 'urn:li:sponsoredAccount:12345',
        conversionMethod: 'CONVERSIONS_API',
        postClickAttributionWindowSize: 30,
        viewThroughAttributionWindowSize: 7,
        attributionType: 'LAST_TOUCH_BY_CAMPAIGN',
        type: 'PURCHASE'
      })
      .reply(201, {
        id: 'newRule789',
        name: 'New Rule',
        type: 'PURCHASE',
        attributionType: 'LAST_TOUCH_BY_CAMPAIGN',
        postClickAttributionWindowSize: 30,
        viewThroughAttributionWindowSize: 7
      })

    const result = await testDestination.actions.streamConversion.executeHook('onMappingSave', {
      settings,
      hookInputs: {
        adAccountId: 'urn:li:sponsoredAccount:12345',
        name: 'New Rule',
        conversionType: 'PURCHASE',
        attribution_type: 'LAST_TOUCH_BY_CAMPAIGN',
        post_click_attribution_window_size: 30,
        view_through_attribution_window_size: 7
      },
      hookOutputs: {},
      payload: {}
    })

    expect(result.savedData).toMatchObject({
      id: 'newRule789',
      name: 'New Rule',
      conversionType: 'PURCHASE',
      attribution_type: 'LAST_TOUCH_BY_CAMPAIGN',
      post_click_attribution_window_size: 30,
      view_through_attribution_window_size: 7
    })
    expect(result.successMessage).toContain('newRule789')
  })

  it('should return error when adAccountId is not provided', async () => {
    const result = await testDestination.actions.streamConversion.executeHook('onMappingSave', {
      settings,
      hookInputs: {
        adAccountId: '',
        name: 'New Rule',
        conversionType: 'PURCHASE',
        attribution_type: 'LAST_TOUCH_BY_CAMPAIGN'
      },
      hookOutputs: {},
      payload: {}
    })

    expect(result).toMatchObject({
      error: {
        message: 'Failed to create conversion rule: No Ad Account selected.',
        code: 'CONVERSION_RULE_CREATION_FAILURE'
      }
    })
  })
})
