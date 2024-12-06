import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { SegmentEvent } from '@segment/actions-core/*'

const testDestination = createTestIntegration(Destination)
const timestamp = new Date('Thu Jun 10 2024 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const responsysHost = 'https://123456-api.responsys.ocs.oraclecloud.com'
const profileListName = 'TEST_PROFILE_LIST'
const folderName = 'TEST_FOLDER'

describe('Responsys.sendAudienceAsPet', () => {
  describe('Successful scenarios', () => {
    describe('Single event', () => {
      const audienceKey = 'looney_tunes_audience'
      const event = createTestEvent({
        timestamp,
        type: 'identify',
        context: {
          personas: {
            computation_key: audienceKey
          }
        },
        traits: {
          email: 'daffy@warnerbros.com',
          firstName: 'Daffy',
          lastName: 'Duck'
        },
        userId: '12345'
      })

      const actionPayload = {
        event,
        mapping: {
          folder_name: folderName,
          pet_name: {
            '@path': '$.context.personas.computation_key'
          },
          userData: {
            EMAIL_ADDRESS_: {
              '@path': '$.traits.email'
            },
            CUSTOMER_ID_: {
              '@path': '$.userId'
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
        }
      }

      it('sends an event with default mappings + default settings, PET does not exist yet', async () => {
        nock(responsysHost).get(`/rest/api/v1.3/lists/${profileListName}/listExtensions`).reply(200, [])

        nock(responsysHost)
          .post(`/rest/api/v1.3/lists/${profileListName}/listExtensions`)
          .reply(200, { results: [{}] })

        nock(responsysHost)
          .post(`/rest/asyncApi/v1.3/lists/${profileListName}/members`)
          .reply(200, { results: [{}] })

        nock(responsysHost)
          .post(`/rest/api/v1.3/lists/${profileListName}/listExtensions/${audienceKey}/members`)
          .reply(200, { results: [{}] })

        const responses = await testDestination.testAction('sendAudienceAsPet', actionPayload)

        expect(responses.length).toBe(4)
        expect(responses[0].status).toBe(200)
        expect(responses[1].status).toBe(200)
        expect(responses[2].status).toBe(200)
        expect(responses[3].status).toBe(200)
      })

      it('sends an event with default mappings + default settings, PET exists', async () => {
        nock(responsysHost)
          .get(`/rest/api/v1.3/lists/${profileListName}/listExtensions`)
          .reply(200, [
            {
              profileExtension: { objectName: audienceKey }
            }
          ])

        nock(responsysHost)
          .post(`/rest/asyncApi/v1.3/lists/${profileListName}/members`)
          .reply(200, { results: [{}] })

        nock(responsysHost)
          .post(`/rest/api/v1.3/lists/${profileListName}/listExtensions/${audienceKey}/members`)
          .reply(200, { results: [{}] })

        const responses = await testDestination.testAction('sendAudienceAsPet', actionPayload)

        expect(responses.length).toBe(3)
        expect(responses[0].status).toBe(200)
        expect(responses[1].status).toBe(200)
        expect(responses[2].status).toBe(200)
      })
    })

    describe('Batch', () => {
      const events: SegmentEvent[] = [
        {
          timestamp,
          type: 'identify',
          context: {
            personas: {
              computation_key: 'looney_tunes_audience'
            }
          },
          traits: {
            email: 'bugs@warnerbros.com'
          },
          anonymousId: 'abcdef-abcd-1234-1234-1234'
        },
        {
          timestamp,
          type: 'identify',
          context: {
            personas: {
              computation_key: 'looney_tunes_audience'
            }
          },
          traits: {
            email: 'daffy@warnerbros.com'
          },
          userId: '12345'
        },
        {
          timestamp,
          type: 'identify',
          context: {
            personas: {
              computation_key: 'looney_tunes_audience'
            }
          },
          traits: {
            riid: '123456'
          },
          anonymousId: 'abcdef-abcd-2345-1234-3456'
        }
      ]

      it('sends events with different match keys', async () => {
        const actionPayload = {
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
            userData: {
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
            baseUrl: responsysHost,
            username: 'abcd',
            userPassword: 'abcd',
            insertOnNoMatch: false,
            matchColumnName1: 'EMAIL_ADDRESS_',
            updateOnMatch: 'REPLACE_ALL',
            defaultPermissionStatus: 'OPTOUT',
            profileListName
          }
        }

        nock(responsysHost).get(`/rest/api/v1.3/lists/${profileListName}/listExtensions`).reply(200, [])

        nock(responsysHost)
          .post(`/rest/api/v1.3/lists/${profileListName}/listExtensions`)
          .reply(200, { results: [{}] })

        nock(responsysHost)
          .post(`/rest/asyncApi/v1.3/lists/${profileListName}/members`)
          .reply(200, { results: [{}] })

        nock(responsysHost)
          .post(`/rest/api/v1.3/lists/${profileListName}/listExtensions/looney_tunes_audience/members`)
          .times(3)
          .reply(200, { results: [{}] })

        /* for (const event of events) {
          ;(event.context as any).personas.audience_settings = {
            computation_key: 'looney_tunes_audience',
            external_audience_id: '12345'
          }
        } */

        const responses = await testDestination.executeBatch('sendAudienceAsPet', actionPayload)

        expect(responses.length).toBe(3)
        expect(responses[0].status).toBe(200)
        expect(responses[1].status).toBe(200)
        expect(responses[2].status).toBe(200)
      })
    })
  })
})
