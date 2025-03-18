import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'

import Destination from '../../index'

const responsysHost = 'https://123456-api.responsys.ocs.oraclecloud.com'
const profileListName = 'TEST_PROFILE_LIST'
const audienceKey = 'a_responsys_audience'
const folderName = 'TEST_FOLDER'

const testDestination = createTestIntegration(Destination)

jest.setTimeout(10000)

describe('ResponsysAudiences.syncAudience', () => {
  describe('Individual events', () => {
    const goodIdentifySubscribeEvent = createTestEvent({
      type: 'identify',
      context: {
        personas: {
          computation_class: 'audience',
          computation_key: audienceKey,
          external_audience_id: audienceKey,
          audience_settings: {}
        }
      },
      traits: {
        audience_key: audienceKey,
        a_responsys_audience: true
      }
    })

    const goodIdentifyUnsubscribeEvent = createTestEvent({
      type: 'identify',
      context: {
        personas: {
          computation_class: 'audience',
          computation_key: audienceKey,
          external_audience_id: audienceKey,
          audience_settings: {}
        }
      },
      traits: {
        audience_key: audienceKey,
        a_responsys_audience: false
      }
    })

    it('should not throw an error if the audience syncs successfully - identify, subscribe', async () => {
      nock(responsysHost).post(`/rest/asyncApi/v1.3/lists/${profileListName}/members`).reply(200, {
        requestId: '23456'
      })

      nock(responsysHost)
        .post(`/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${audienceKey}/members`)
        .reply(200, {
          requestId: '34567'
        })

      nock(responsysHost).get(`/rest/asyncApi/v1.3/requests/23456`).reply(200, {})
      nock(responsysHost).get(`/rest/asyncApi/v1.3/requests/34567`).reply(200, {})

      const responses = await testDestination.testAction('syncAudience', {
        event: goodIdentifySubscribeEvent,
        useDefaultMappings: true,
        settings: {
          profileListName: profileListName,
          username: 'username',
          userPassword: 'password',
          baseUrl: responsysHost,
          insertOnNoMatch: true,
          updateOnMatch: 'REPLACE_ALL',
          matchColumnName1: 'CUSTOMER_ID_'
        },
        auth: {
          accessToken: 'abcd1234',
          refreshToken: 'efgh5678'
        }
      })

      expect(responses).toBeTruthy()
      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(200)
      expect(responses[1].status).toBe(200)
    })

    it('should not throw an error if the audience syncs successfully - identify, unsubscribe', async () => {
      nock(responsysHost).post(`/rest/asyncApi/v1.3/lists/${profileListName}/members`).reply(200, {
        requestId: '23456'
      })

      nock(responsysHost)
        .post(`/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${audienceKey}/members`)
        .reply(200, {
          requestId: '34567'
        })

      nock(responsysHost).get(`/rest/asyncApi/v1.3/requests/23456`).reply(200, {})
      nock(responsysHost).get(`/rest/asyncApi/v1.3/requests/34567`).reply(200, {})

      const responses = await testDestination.testAction('syncAudience', {
        event: goodIdentifyUnsubscribeEvent,
        useDefaultMappings: true,
        settings: {
          profileListName: profileListName,
          username: 'username',
          userPassword: 'password',
          baseUrl: responsysHost,
          insertOnNoMatch: true,
          updateOnMatch: 'REPLACE_ALL',
          matchColumnName1: 'CUSTOMER_ID_'
        },
        auth: {
          accessToken: 'abcd1234',
          refreshToken: 'efgh5678'
        }
      })

      expect(responses).toBeTruthy()
      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(200)
      expect(responses[1].status).toBe(200)
    })
  })

  describe('Batch events', () => {
    const events: SegmentEvent[] = [
      {
        type: 'identify',
        context: {
          personas: {
            computation_key: audienceKey
          }
        },
        traits: {
          email: 'bugs@warnerbros.com'
        },
        anonymousId: 'abcdef-abcd-1234-1234-1234'
      },
      {
        type: 'identify',
        context: {
          personas: {
            computation_key: audienceKey
          }
        },
        traits: {
          email: 'daffy@warnerbros.com'
        },
        userId: '12345'
      },
      {
        type: 'identify',
        context: {
          personas: {
            computation_key: audienceKey
          }
        },
        traits: {
          riid: '123456'
        },
        anonymousId: 'abcdef-abcd-2345-1234-3456'
      }
    ]

    it('should not throw an error if the audience syncs successfully - batch', async () => {
      nock(responsysHost).post(`/rest/asyncApi/v1.3/lists/${profileListName}/members`).times(2).reply(200, {
        requestId: '23456'
      })

      nock(responsysHost)
        .post(`/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${audienceKey}/members`)
        .times(3)
        .reply(200, {
          requestId: '34567'
        })

      nock(responsysHost).get(`/rest/asyncApi/v1.3/requests/23456`).times(2).reply(200, {})
      nock(responsysHost).get(`/rest/asyncApi/v1.3/requests/34567`).times(3).reply(200, {})

      const responses = await testDestination.executeBatch('syncAudience', {
        events,
        mapping: {
          folder_name: folderName,
          pet_name: {
            '@path': '$.context.personas.computation_key'
          },
          computation_key: {
            '@path': '$.context.personas.computation_key'
          },
          traits_or_props: {
            '@path': '$.traits'
          },
          recipientData: {
            EMAIL_ADDRESS_: {
              '@path': '$.traits.email'
            },
            CUSTOMER_ID_: {
              '@path': '$.userId'
            },
            RIID_: {
              '@path': '$.traits.riid'
            }
          }
        },
        settings: {
          profileListName: profileListName,
          username: 'username',
          userPassword: 'password',
          baseUrl: responsysHost,
          insertOnNoMatch: true,
          updateOnMatch: 'REPLACE_ALL',
          matchColumnName1: 'CUSTOMER_ID_'
        },
        auth: {
          accessToken: 'abcd1234',
          refreshToken: 'efgh5678'
        }
      })

      expect(responses).toBeTruthy()
      expect(responses.length).toBe(3)
      expect(responses[0].status).toBe(200)
      expect(responses[1].status).toBe(200)
      expect(responses[2].status).toBe(200)
    })
  })
})
