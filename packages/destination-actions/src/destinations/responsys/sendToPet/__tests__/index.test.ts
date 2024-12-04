import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const timestamp = new Date('Thu Jun 10 2024 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const responsysHost = 'https://123456-api.responsys.ocs.oraclecloud.com'
const profileListName = 'TEST_PROFILE_LIST'
const folderName = 'TEST_FOLDER'
const petName = 'TEST_PET'

jest.setTimeout(10000)

describe('Responsys.sendToPet', () => {
  describe('Successful scenarios, async endpoints', () => {
    describe('Single event', () => {
      const event = createTestEvent({
        type: 'identify',
        userId: '12345',
        traits: {
          personalized1: 'value 1',
          personalized2: 'value 2',
          personalized3: 'value 3'
        }
      })

      const actionPayload = {
        event,
        mapping: {
          folder_name: folderName,
          pet_name: petName,
          userData: {
            EMAIL_ADDRESS_: {
              '@path': '$.traits.email'
            },
            CUSTOMER_ID_: {
              '@path': '$.userId'
            },
            PERSONALIZED1: {
              '@path': '$.traits.personalized1'
            },
            PERSONALIZED2: {
              '@path': '$.traits.personalized2'
            },
            PERSONALIZED3: {
              '@path': '$.traits.personalized3'
            }
          }
        },
        useDefaultMappings: true,
        settings: {
          baseUrl: responsysHost,
          username: 'abcd',
          userPassword: 'abcd',
          insertOnNoMatch: false,
          matchColumnName1: 'EMAIL_ADDRESS_',
          updateOnMatch: 'REPLACE_ALL',
          defaultPermissionStatus: 'OPTOUT',
          profileListName
        },
        auth: {
          accessToken: 'abcd1234',
          refreshToken: 'efgh5678'
        }
      }

      it('sends an event with default mappings + default settings, PET does not exist yet', async () => {
        nock(responsysHost).get(`/rest/api/v1.3/lists/${profileListName}/listExtensions`).reply(200, [])

        nock(responsysHost).post(`/rest/api/v1.3/lists/${profileListName}/listExtensions`).reply(200, {})

        nock(responsysHost).post(`/rest/asyncApi/v1.3/lists/${profileListName}/members`).reply(200, {
          requestId: '23456'
        })

        nock(responsysHost)
          .post(`/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${petName}/members`)
          .reply(200, {
            requestId: '34567'
          })

        nock(responsysHost).get(`/rest/asyncApi/v1.3/requests/23456`).reply(200, {})
        nock(responsysHost).get(`/rest/asyncApi/v1.3/requests/34567`).reply(200, {})

        const responses = await testDestination.testAction('sendToPet', actionPayload)

        expect(responses.length).toBe(3)
        expect(responses[0].status).toBe(200)
        expect(responses[1].status).toBe(200)
        expect(responses[2].status).toBe(200)
      })

      it('sends an event with default mappings + default settings, PET exists', async () => {
        nock(responsysHost)
          .get(`/rest/api/v1.3/lists/${profileListName}/listExtensions`)
          .reply(200, [
            {
              profileExtension: {
                objectName: petName,
                folderName: folderName
              }
            }
          ])

        nock(responsysHost).post(`/rest/asyncApi/v1.3/lists/${profileListName}/members`).reply(200, {
          requestId: '23456'
        })

        nock(responsysHost)
          .post(`/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${petName}/members`)
          .reply(200, {
            requestId: '34567'
          })

        nock(responsysHost).get(`/rest/asyncApi/v1.3/requests/23456`).reply(200, {})
        nock(responsysHost).get(`/rest/asyncApi/v1.3/requests/34567`).reply(200, {})

        const responses = await testDestination.testAction('sendToPet', actionPayload)

        expect(responses.length).toBe(2)
        expect(responses[0].status).toBe(200)
        expect(responses[1].status).toBe(200)
      })
    })

    describe('Batch', () => {
      const events: SegmentEvent[] = [
        {
          timestamp,
          type: 'identify',
          traits: {
            email: 'bugs@warnerbros.com',
            personalized1: 'value 1',
            personalized2: 'value 2',
            personalized3: 'value 3'
          },
          anonymousId: 'abcdef-abcd-1234-1234-1234'
        },
        {
          timestamp,
          type: 'identify',
          traits: {
            email: 'daffy@warnerbros.com',
            personalized1: 'value 4',
            personalized2: 'value 5',
            personalized3: 'value 6'
          },
          userId: '12345'
        }
      ]

      it('sends an event with default mappings + default settings, PET does not exist yet', async () => {
        const actionPayload = {
          events,
          mapping: {
            folder_name: folderName,
            pet_name: petName,
            userData: {
              EMAIL_ADDRESS_: {
                '@path': '$.traits.email'
              },
              CUSTOMER_ID_: {
                '@path': '$.userId'
              },
              RIID_: {
                '@path': '$.traits.riid'
              },
              PERSONALIZED1: {
                '@path': '$.traits.personalized1'
              },
              PERSONALIZED2: {
                '@path': '$.traits.personalized2'
              },
              PERSONALIZED3: {
                '@path': '$.traits.personalized3'
              }
            },
            use_responsys_async_api: true
          },
          settings: {
            baseUrl: responsysHost,
            username: 'abcd',
            userPassword: 'abcd',
            insertOnNoMatch: false,
            matchColumnName1: 'EMAIL_ADDRESS_',
            updateOnMatch: 'REPLACE_ALL',
            defaultPermissionStatus: 'OPTOUT',
            profileListName
          },
          auth: {
            accessToken: 'abcd1234',
            refreshToken: 'efgh5678'
          }
        }

        nock(responsysHost).get(`/rest/api/v1.3/lists/${profileListName}/listExtensions`).reply(200, [])

        nock(responsysHost).post(`/rest/api/v1.3/lists/${profileListName}/listExtensions`).reply(200, {})

        nock(responsysHost).post(`/rest/asyncApi/v1.3/lists/${profileListName}/members`).reply(200, {
          requestId: '23456'
        })

        nock(responsysHost)
          .post(`/rest/asyncApi/v1.3/lists/${profileListName}/listExtensions/${petName}/members`)
          .reply(200, {
            requestId: '34567'
          })

        nock(responsysHost).get(`/rest/asyncApi/v1.3/requests/23456`).reply(200, {})
        nock(responsysHost).get(`/rest/asyncApi/v1.3/requests/34567`).reply(200, {})

        const responses = await testDestination.executeBatch('sendToPet', actionPayload)

        expect(responses.length).toBe(2)
        expect(responses[0].status).toBe(200)
        expect(responses[1].status).toBe(200)
      })
    })
  })
})
