import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { StatsClient, StatsContext } from '@segment/actions-core/destination-kit'

const testDestination = createTestIntegration(Destination)
const settings = {
  client_code: 'segmentexchangepartn',
  client_id: '123-test'
}

describe('AdobeTarget', () => {
  beforeEach((done) => {
    nock.cleanAll()
    nock.abortPendingRequests()
    done()
  })

  describe('updateProfile', () => {
    it('Handle a Basic Event', async () => {
      nock(
        `https://${settings.client_code}.tt.omtrdc.net/rest/v1/profiles/thirdPartyId/${settings.client_id}?client=${settings.client_code}`
      )
        .get(/.*/)
        .reply(200, {})
      nock(
        `https://${settings.client_code}.tt.omtrdc.net/m2/${settings.client_code}/profile/update?mbox3rdPartyId=${settings.client_id}`
      )
        .post(/.*/)
        .reply(200, {})

      const event = createTestEvent({
        type: 'identify',
        userId: '123-test',
        traits: {
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
              '@path': '$.traits.city'
            },
            name: {
              '@path': '$.traits.name'
            },
            age: {
              '@path': '$.traits.age'
            },
            param1: {
              '@path': '$.traits.param1'
            },
            param2: {
              '@path': '$.traits.param2'
            }
          },
          user_id: {
            '@path': '$.userId'
          }
        }
      })

      expect(responses.length).toBe(2)
      expect(responses[1].url).toBe(
        'https://segmentexchangepartn.tt.omtrdc.net/m2/segmentexchangepartn/profile/update?mbox3rdPartyId=123-test&profile.city=New%20York%20City&profile.name=Rajul&profile.age=21&profile.param1=value1&profile.param2=value2'
      )
      responses.forEach((response) => {
        expect(response.request.headers).toMatchInlineSnapshot(`
          Headers {
            Symbol(map): Object {
              "user-agent": Array [
                "Segment (Actions)",
              ],
            },
          }
        `)
        expect(response.status).toBe(200)
      })
    })
    it('Handle a Nested Event', async () => {
      nock(
        `https://${settings.client_code}.tt.omtrdc.net/rest/v1/profiles/thirdPartyId/${settings.client_id}?client=${settings.client_code}`
      )
        .get(/.*/)
        .reply(200, {})
      nock(
        `https://${settings.client_code}.tt.omtrdc.net/m2/${settings.client_code}/profile/update?mbox3rdPartyId=${settings.client_id}`
      )
        .post(/.*/)
        .reply(200, {})

      const event = createTestEvent({
        type: 'identify',
        userId: '123-test',
        traits: {
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
      const responses = await testDestination.testAction('updateProfile', {
        event,
        settings,
        mapping: {
          traits: {
            address: {
              city: {
                '@path': '$.traits.address.city'
              },
              zipCode: {
                '@path': '$.traits.address.zipCode'
              }
            },
            name: {
              '@path': '$.traits.name'
            },
            age: {
              '@path': '$.traits.age'
            },
            param1: {
              '@path': '$.traits.param1'
            },
            param2: {
              '@path': '$.traits.param2'
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
        type: 'identify',
        traits: {
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
                  '@path': '$.traits.address.city'
                },
                zipCode: {
                  '@path': '$.traits.address.zipCode'
                }
              },
              name: {
                '@path': '$.traits.name'
              },
              age: {
                '@path': '$.traits.age'
              },
              param1: {
                '@path': '$.traits.param1'
              },
              param2: {
                '@path': '$.traits.param2'
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
        type: 'identify',
        userId: '123-test'
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
    it('removes null values from nested event', async () => {
      nock(
        `https://${settings.client_code}.tt.omtrdc.net/rest/v1/profiles/thirdPartyId/${settings.client_id}?client=${settings.client_code}`
      )
        .get(/.*/)
        .reply(200, {})
      nock(
        `https://${settings.client_code}.tt.omtrdc.net/m2/${settings.client_code}/profile/update?mbox3rdPartyId=${settings.client_id}`
      )
        .post(/.*/)
        .reply(200, {})

      const event = createTestEvent({
        type: 'identify',
        userId: '123-test',
        traits: {
          name: 'Rajul',
          age: null,
          address: {
            city: 'New York City',
            zipCode: null
          },
          param1: 'value1',
          param2: 'value2'
        }
      })
      const responses = await testDestination.testAction('updateProfile', {
        event,
        settings,
        mapping: {
          traits: {
            address: {
              city: {
                '@path': '$.traits.address.city'
              },
              zipCode: {
                '@path': '$.traits.address.zipCode'
              }
            },
            name: {
              '@path': '$.traits.name'
            },
            age: {
              '@path': '$.traits.age'
            },
            param1: {
              '@path': '$.traits.param1'
            },
            param2: {
              '@path': '$.traits.param2'
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
        'https://segmentexchangepartn.tt.omtrdc.net/m2/segmentexchangepartn/profile/update?mbox3rdPartyId=123-test&profile.address.city=New%20York%20City&profile.name=Rajul&profile.param1=value1&profile.param2=value2'
      )
    })
    it('uses bearer token if provided', async () => {
      const authSettings = {
        bearer_token: 'test-token',
        ...settings
      }

      const event = createTestEvent({
        type: 'identify',
        userId: '123-test',
        traits: {
          name: 'Rajul',
          age: '21',
          city: 'New York City',
          zipCode: '12345',
          param1: 'value1',
          param2: 'value2'
        }
      })

      nock(/.*/).get(/.*/).reply(200)
      nock(/.*/).post(/.*/).reply(200)

      const responses = await testDestination.testAction('updateProfile', {
        event,
        settings: authSettings,
        mapping: {
          traits: {
            city: {
              '@path': '$.traits.city'
            },
            name: {
              '@path': '$.traits.name'
            },
            age: {
              '@path': '$.traits.age'
            },
            param1: {
              '@path': '$.traits.param1'
            },
            param2: {
              '@path': '$.traits.param2'
            }
          },
          user_id: {
            '@path': '$.userId'
          }
        }
      })

      expect(responses.length).toBe(2)
      expect(responses[1].url).toBe(
        'https://segmentexchangepartn.tt.omtrdc.net/m2/segmentexchangepartn/profile/update?mbox3rdPartyId=123-test&profile.city=New%20York%20City&profile.name=Rajul&profile.age=21&profile.param1=value1&profile.param2=value2'
      )

      responses.forEach((response) => {
        expect(response.request.headers).toMatchInlineSnapshot(`
          Headers {
            Symbol(map): Object {
              "authorization": Array [
                "Bearer test-token",
              ],
              "user-agent": Array [
                "Segment (Actions)",
              ],
            },
          }
        `)
        expect(response.status).toBe(200)
      })
    })
  })

  it('should handle default mappings', async () => {
    nock(
      `https://${settings.client_code}.tt.omtrdc.net/rest/v1/profiles/thirdPartyId/${settings.client_id}?client=${settings.client_code}`
    )
      .get(/.*/)
      .reply(200, {})
    nock(
      `https://${settings.client_code}.tt.omtrdc.net/m2/${settings.client_code}/profile/update?mbox3rdPartyId=${settings.client_id}`
    )
      .post(/.*/)
      .reply(200, {})

    const event = createTestEvent({
      type: 'identify',
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
      useDefaultMappings: true,
      mapping: {
        traits: {
          address: {
            city: {
              '@path': '$.traits.address.city'
            },
            zipCode: {
              '@path': '$.traits.address.zipCode'
            }
          },
          name: {
            '@path': '$.traits.name'
          },
          age: {
            '@path': '$.traits.age'
          },
          param1: {
            '@path': '$.traits.param1'
          },
          param2: {
            '@path': '$.traits.param2'
          }
        }
      }
    })
    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
    expect(responses[1].url).toBe(
      'https://segmentexchangepartn.tt.omtrdc.net/m2/segmentexchangepartn/profile/update?mbox3rdPartyId=123-test&profile.address.city=New%20York%20City&profile.address.zipCode=12345&profile.param1=value1&profile.param2=value2'
    )
  })

  it('should throw an error for invalid cliend code', async () => {
    nock(
      `https://${settings.client_code}.tt.omtrdc.net/rest/v1/profiles/thirdPartyId/${settings.client_id}?client=FAKE`
    )
      .get(/.*/)
      .reply(400, {})
    nock(`https://${settings.client_code}.tt.omtrdc.net/m2/${settings.client_code}/profile/update?mbox3rdPartyId=FAKE`)
      .post(/.*/)
      .reply(400, {})
    const event = createTestEvent({
      type: 'identify',
      userId: '123-test',
      traits: {
        name: 'Rajul',
        age: '21',
        city: 'New York City',
        zipCode: '12345',
        param1: 'value1',
        param2: 'value2'
      }
    })

    await expect(
      testDestination.testAction('updateProfile', {
        event,
        settings,
        statsContext: {
          statsClient: {
            incr: jest.fn(),
            observe: jest.fn(),
            _name: jest.fn(),
            _tags: jest.fn(),
            set: jest.fn(),
            histogram: jest.fn()
          } as StatsClient
        } as StatsContext,
        mapping: {
          traits: {
            city: {
              '@path': '$.traits.city'
            },
            name: {
              '@path': '$.traits.name'
            },
            age: {
              '@path': '$.traits.age'
            },
            param1: {
              '@path': '$.traits.param1'
            },
            param2: {
              '@path': '$.traits.param2'
            }
          },
          user_id: {
            '@path': '$.userId'
          }
        }
      })
    ).rejects.toThrowError('Bad Request')
  })
})
