import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const settings = {
  client_code: 'segmentexchangepartn',
  client_id: '123-test'
}

describe('AdobeTarget', () => {
  describe('updateProfile', () => {
    it('Handle a Basic Event', async () => {
      nock(
        `http://segmentexchangepartn.tt.omtrdc.net/rest/v1/profiles/thirdPartyId/${settings.client_id}?client=${settings.client_code}`
      )
        .get(/.*/)
        .reply(200, {})
      nock(
        `https://${settings.client_code}.tt.omtrdc.net/m2/${settings.client_code}/profile/update?mbox3rdPartyId=${settings.client_id}`
      )
        .post(/.*/)
        .reply(200, {})

      const event = createTestEvent({
        event: 'identify',
        userId: '123-test',
        properties: {
          name: 'Rajul',
          age: '21',
          city: 'New York City',
          zipCode: '12345',
          param1: 'value1',
          param2: 'value2'
        }
      })
      const responses = await testDestination.testAction('updateProfile', {
        event,
        settings,
        mapping: {
          traits: {
            city: {
              '@path': '$.properties.city'
            },
            name: {
              '@path': '$.properties.name'
            },
            age: {
              '@path': '$.properties.age'
            },
            param1: {
              '@path': '$.properties.param1'
            },
            param2: {
              '@path': '$.properties.param2'
            }
          },
          user_id: {
            '@path': '$.userId'
          }
        }
      })

      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(200)
      expect(responses[1].status).toBe(200)
      expect(responses[1].url).toBe(
        'https://segmentexchangepartn.tt.omtrdc.net/m2/segmentexchangepartn/profile/update?mbox3rdPartyId=123-test&profile.city=New%20York%20City&profile.name=Rajul&profile.age=21&profile.param1=value1&profile.param2=value2'
      )
    })
    it('Handle a Nested Event', async () => {
      nock(
        `http://segmentexchangepartn.tt.omtrdc.net/rest/v1/profiles/thirdPartyId/${settings.client_id}?client=${settings.client_code}`
      )
        .get(/.*/)
        .reply(200, {})
      nock(
        `https://${settings.client_code}.tt.omtrdc.net/m2/${settings.client_code}/profile/update?mbox3rdPartyId=${settings.client_id}`
      )
        .post(/.*/)
        .reply(200, {})

      const event = createTestEvent({
        event: 'identify',
        userId: '123-test',
        properties: {
          name: 'Rajul',
          age: '21',
          traits: {
            address: {
              city: 'New York City',
              zipCode: '12345'
            },
            param1: 'value1',
            param2: 'value2'
          }
        }
      })
      const responses = await testDestination.testAction('updateProfile', {
        event,
        settings,
        mapping: {
          traits: {
            address: {
              city: {
                '@path': '$.properties.traits.address.city'
              },
              zipCode: {
                '@path': '$.properties.traits.address.zipCode'
              }
            },
            name: {
              '@path': '$.properties.name'
            },
            age: {
              '@path': '$.properties.age'
            },
            param1: {
              '@path': '$.properties.traits.param1'
            },
            param2: {
              '@path': '$.properties.traits.param2'
            }
          },
          user_id: {
            '@path': '$.userId'
          }
        }
      })
      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(200)
      expect(responses[1].status).toBe(200)
      expect(responses[1].url).toBe(
        'https://segmentexchangepartn.tt.omtrdc.net/m2/segmentexchangepartn/profile/update?mbox3rdPartyId=123-test&profile.address.city=New%20York%20City&profile.address.zipCode=12345&profile.name=Rajul&profile.age=21&profile.param1=value1&profile.param2=value2'
      )
    })
    it('should throw an error for missing required field: userId', async () => {
      nock(
        `https://${settings.client_code}.tt.omtrdc.net/m2/${settings.client_code}/profile/update?mbox3rdPartyId=${settings.client_id}`
      )
        .post(/.*/)
        .reply(201, {})

      const event = createTestEvent({
        event: 'identify',
        properties: {
          name: 'Rajul',
          age: '21',
          address: {
            city: 'New York City',
            zipCode: '12345'
          },
          param1: 'value1',
          param2: 'value2'
        }
      })
      await expect(
        testDestination.testAction('updateProfile', {
          event,
          settings,
          mapping: {
            traits: {
              address: {
                city: {
                  '@path': '$.properties.address.city'
                },
                zipCode: {
                  '@path': '$.properties.address.zipCode'
                }
              },
              name: {
                '@path': '$.properties.name'
              },
              age: {
                '@path': '$.properties.age'
              },
              param1: {
                '@path': '$.properties.param1'
              },
              param2: {
                '@path': '$.properties.param2'
              }
            }
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'user_id'.")
    })
    it('should throw an error for missing required field: traits', async () => {
      nock(
        `https://${settings.client_code}.tt.omtrdc.net/m2/${settings.client_code}/profile/update?mbox3rdPartyId=${settings.client_id}`
      )
        .post(/.*/)
        .reply(201, {})

      const event = createTestEvent({
        event: 'identify',
        userId: '123-test',
        properties: {
          name: 'Rajul',
          age: '21',
          address: {
            city: 'New York City',
            zipCode: '12345'
          },
          param1: 'value1',
          param2: 'value2'
        }
      })
      await expect(
        testDestination.testAction('updateProfile', {
          event,
          settings,
          mapping: {
            user_id: {
              '@path': '$.userId'
            }
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'traits'.")
    })
  })
  it('should handle default mappings', async () => {
    nock(
      `http://segmentexchangepartn.tt.omtrdc.net/rest/v1/profiles/thirdPartyId/${settings.client_id}?client=${settings.client_code}`
    )
      .get(/.*/)
      .reply(200, {})
    nock(
      `https://${settings.client_code}.tt.omtrdc.net/m2/${settings.client_code}/profile/update?mbox3rdPartyId=${settings.client_id}`
    )
      .post(/.*/)
      .reply(200, {})

    const event = createTestEvent({
      event: 'identify',
      userId: '123-test',
      traits: {
        address: {
          city: 'New York City',
          zipCode: '12345'
        },
        param1: 'value1',
        param2: 'value2'
      }
    })
    const responses = await testDestination.testAction('updateProfile', {
      event,
      settings,
      useDefaultMappings: true
    })
    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
    expect(responses[1].url).toBe(
      'https://segmentexchangepartn.tt.omtrdc.net/m2/segmentexchangepartn/profile/update?mbox3rdPartyId=123-test&profile.address.city=New%20York%20City&profile.address.zipCode=12345&profile.param1=value1&profile.param2=value2'
    )
  })
})
