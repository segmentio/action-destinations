import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
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
