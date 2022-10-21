//import nock from 'nock'
//import { createTestEvent, createTestIntegration } from '@segment/actions-core'
//import oneplusx_asset_api from '../index'

//const testDestination = createTestIntegration(oneplusx_asset_api)

//describe('1Plusx Asset Api', () => {
//  describe('sendAssetData', () => {

//  })
//})

import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import oneplusx_asset_api from '../index'

const testDestination = createTestIntegration(oneplusx_asset_api)

const client_id = 'fox'

describe('1Plusx Asset Api', () => {
  describe('sendAssetData', () => {
    it('should send asset data with custom mappings', async () => {
      const event = createTestEvent({
        anonymousId: 'anon-user123',
        userId: 'user123',
        timestamp: '2021-07-12T23:02:40.563Z',
        event: 'Test Event',
        type: 'track',
        properties: {
          asset_uri: 'Video:123456',
          title: 'Solace',
          content: 'Detailed desciption of the asset',
          genre: ['Thriller', 'Horror'],
          actors: ['Hopkins', 'Affleck']
        },
        context: {
          app: {
            version: '1.0'
          },
          page: {
            url: 'https://segment.com/'
          },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57'
        }
      })

      nock(`https://${client_id}.assets.tagger.opecloud.com`)
        .post(`/v2/native/asset/${event.properties.asset_uri}`)
        .reply(200)

      const responses = await testDestination.testAction('sendAssetData', {
        event,
        settings: {
          client_id
        },
        mapping: {
          asset_uri: {
            '@path': '$.properties.asset_uri'
          },
          ope_title: {
            '@path': '$.properties.title'
          },
          ope_content: {
            '@path': '$.properties.content'
          }
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        ope_title: 'Solace',
        ope_content: 'Detailed desciption of the asset'
      })
    })

    it('should send asset data with custom mappings', async () => {
      const event = createTestEvent({
        anonymousId: 'anon-user123',
        userId: 'user123',
        timestamp: '2021-07-12T23:02:40.563Z',
        event: 'Test Event',
        type: 'track',
        properties: {
          asset_uri: 'Video:123456',
          title: 'Solace',
          content: 'Detailed desciption of the asset',
          genre: ['Thriller', 'Horror'],
          actors: ['Hopkins', 'Affleck']
        }
      })

      nock(`https://${client_id}.assets.tagger.opecloud.com`)
        .post(`/v2/native/asset/${event.properties.asset_uri}`)
        .reply(200)

      const responses = await testDestination.testAction('sendEvent', {
        event,
        settings: {
          client_id
        },
        mapping: {
          asset_uri: {
            '@path': '$.properties.asset_uri'
          },
          ope_title: {
            '@path': '$.properties.title'
          },
          ope_content: {
            '@path': '$.properties.content'
          },
          custom_fields: {
            genre: {
              '@path': '$.properties.genre'
            },
            actors: {
              '@path': '$.properties.actors'
            }
          }
        },
        useDefaultMappings: true
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        ope_title: 'Solace',
        ope_content: 'Test Event',
        custom_fields: {
          genre: ['Thriller', 'Horror'],
          actors: ['Hopkins', 'Affleck']
        }
      })
    })

    it('should send asset data if optional fields are missing', async () => {
      const event = createTestEvent({
        anonymousId: 'anon-user123',
        userId: 'user123',
        timestamp: '2021-07-12T23:02:40.563Z',
        event: 'Test Event',
        type: 'track',
        properties: {
          asset_uri: 'Video:123456',
          title: 'Solace',
          content: 'Detailed desciption of the asset',
          genre: ['Thriller', 'Horror'],
          actors: ['Hopkins', 'Affleck']
        }
      })

      nock(`https://${client_id}.assets.tagger.opecloud.com`)
        .post(`/v2/native/asset/${event.properties.asset_uri}`)
        .reply(200)

      const responses = await testDestination.testAction('sendEvent', {
        event,
        settings: {
          client_id
        },
        mapping: {
          asset_uri: {
            '@path': '$.properties.asset_uri'
          },

          custom_fields: {
            genre: {
              '@path': '$.properties.genre'
            },
            actors: {
              '@path': '$.properties.actors'
            }
          }
        },
        useDefaultMappings: true
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        custom_fields: {
          genre: ['Thriller', 'Horror'],
          actors: ['Hopkins', 'Affleck']
        }
      })
    })
  })
})
