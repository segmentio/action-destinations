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
import { ExecuteInput } from '@segment/actions-core'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(oneplusx_asset_api)

// Define settings values
const client_id = '123abc'
const client_secret = '456def'
const client_name = 'test01'

describe('1Plusx Asset Api', () => {
  describe('sendAssetData', () => {
    it('should authenticate with the API and receive the token', async () => {
      const accessToken = '12345abcde'
      const authData: Partial<ExecuteInput<Settings, undefined>> = {
        auth: {
          accessToken,
          refreshToken: ''
        }
      }

      const extendedRequest = testDestination.extendRequest?.(authData as ExecuteInput<Settings, undefined>)
      expect(extendedRequest?.headers?.['authorization']).toContain(`Bearer ${accessToken}`)
    })
    it('should send asset data with default mappigs', async () => {
      const event = createTestEvent({
        userId: 'user123',
        timestamp: '2021-07-12T23:02:40.563Z',
        event: 'Test Event',
        type: 'track',
        properties: {
          asset_uri: 'test_id:123456',
          title: 'Solace',
          content: 'Detailed desciption of the asset'
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
      const encoded_asset_uri = encodeURIComponent('test_id:123456')
      nock(`https://${client_name}.assets.tagger.opecloud.com`).put(`/v2/native/asset/${encoded_asset_uri}`).reply(200)

      const responses = await testDestination.testAction('sendAssetData', {
        event,
        settings: {
          client_id,
          client_secret,
          client_name
        },
        mapping: {
          asset_uri: {
            '@path': '$.properties.asset_uri'
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

    it('should send asset data without custom fields', async () => {
      const event = createTestEvent({
        userId: 'user123',
        timestamp: '2021-07-12T23:02:40.563Z',
        event: 'Test Event',
        type: 'track',
        properties: {
          asset_uri: 'test_id:123456',
          video_title: 'Solace',
          video_content: 'Detailed desciption of the asset',
          genre: ['Thriller', 'Horror'],
          actors: ['Hopkins', 'Affleck']
        }
      })
      const encoded_asset_uri = encodeURIComponent('test_id:123456')
      nock(`https://${client_name}.assets.tagger.opecloud.com`).put(`/v2/native/asset/${encoded_asset_uri}`).reply(200)

      const responses = await testDestination.testAction('sendAssetData', {
        event,
        settings: {
          client_id,
          client_secret,
          client_name
        },
        mapping: {
          asset_uri: {
            '@path': '$.properties.asset_uri'
          },
          ope_title: {
            '@path': '$.properties.video_title'
          },
          ope_content: {
            '@path': '$.properties.video_content'
          }
        },
        useDefaultMappings: false
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        ope_title: 'Solace',
        ope_content: 'Detailed desciption of the asset'
      })
    })

    it('should send asset data with custom fields', async () => {
      const event = createTestEvent({
        anonymousId: 'anon-user123',
        userId: 'user123',
        timestamp: '2021-07-12T23:02:40.563Z',
        event: 'Test Event',
        type: 'track',
        properties: {
          asset_uri: 'test_id:123456',
          title: 'Solace',
          content: 'Detailed desciption of the asset',
          genre: ['Thriller', 'Horror'],
          actors: ['Hopkins', 'Affleck']
        }
      })
      const encoded_asset_uri = encodeURIComponent('test_id:123456')
      nock(`https://${client_name}.assets.tagger.opecloud.com`).put(`/v2/native/asset/${encoded_asset_uri}`).reply(200)

      const responses = await testDestination.testAction('sendAssetData', {
        event,
        settings: {
          client_id,
          client_secret,
          client_name
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
            genre: { '@path': '$.properties.genre' },
            actors: { '@path': '$.properties.actors' }
          }
        },
        useDefaultMappings: true
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        ope_title: 'Solace',
        ope_content: 'Detailed desciption of the asset',
        genre: ['Thriller', 'Horror'],
        actors: ['Hopkins', 'Affleck']
      })
    })

    it('should send asset data if optional ope_ props are missing and useDefaultMappings=false', async () => {
      const event = createTestEvent({
        anonymousId: 'anon-user123',
        userId: 'user123',
        timestamp: '2021-07-12T23:02:40.563Z',
        event: 'Test Event',
        type: 'track',
        properties: {
          asset_uri: 'test_id:123456',
          title: 'Solace',
          content: 'Detailed desciption of the asset',
          genre: 'Thriller',
          actors: 'Hopkins'
        }
      })
      const encoded_asset_uri = encodeURIComponent('test_id:123456')
      nock(`https://${client_name}.assets.tagger.opecloud.com`).put(`/v2/native/asset/${encoded_asset_uri}`).reply(200)

      const responses = await testDestination.testAction('sendAssetData', {
        event,
        settings: {
          client_id,
          client_name,
          client_secret
        },
        mapping: {
          asset_uri: {
            '@path': '$.properties.asset_uri'
          },
          custom_fields: {
            genre: { '@path': '$.properties.genre' },
            actors: { '@path': '$.properties.actors' }
          }
        },
        useDefaultMappings: false
      })

      console.log(responses[0].options.json)
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        genre: 'Thriller',
        actors: 'Hopkins'
      })
    })
  })
})
