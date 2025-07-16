import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

let testDestination = createTestIntegration(Destination)
const apiBaseUrl = 'https://cf-blast.livelikecdn.com/api/v1'

describe('LivelikeCloud.syncToUserGroup', () => {

  beforeAll(async () => {
    // Disables all HTTP requests
    nock.disableNetConnect();
  });

  afterAll(() => {
    // Re-enable HTTP requests
    nock.enableNetConnect();
  });  

  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
    testDestination = createTestIntegration(Destination)
  });

  describe('Engage Audience payloads', () => {
    
    const mapping = {
      audience_id: { '@path': '$.context.personas.computation_id'},
      audience_name: {'@path': '$.context.personas.computation_key'} ,
      timestamp: { '@path': '$.timestamp' },
      traits_or_properties: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      },
      livelike_profile_id: {
        '@if': {
          exists: {'@path': '$.traits.livelike_profile_id'},
          then: {'@path': '$.traits.livelike_profile_id' },
          else: {'@path': '$.properties.livelike_profile_id'} 
        }
      },
      user_id: { '@path': '$.userId'},
      user_group_id: {
        '@if': {
          exists: {'@path': '$.traits.user_group_id'},
          then: {'@path': '$.traits.user_group_id' },
          else: {'@path': '$.properties.user_group_id'} 
        }
      }
    }

    const settings = {
      clientId: 'test-client-id',
      producerToken: 'test-producer-token'
    }

    it('should add user to Audience with an Engage track() call', async () => {

      const engageAddAudienceTrack = createTestEvent({
        properties: {
          audience_key: "test_audience",
          livelike_profile_id: "122",
          test_audience: true,
          user_group_id: "456",
          user_id: "900"
        },
        timestamp: "2025-07-02T16:26:57.511Z",
        context: {
          __segment_internal: {
            creator: "sync-worker"
          },
          personas: {
            computation_class: "audience",
            computation_id: "aud_2zJkeVoLkrirhXup2uAPEsDLq4N",
            computation_key: "test_audience",
            namespace: "spa_9vACn44CYGDZNPNWDUXtMJ",
            space_id: "spa_9vACn44CYGDZNPNWDUXtMJ"
          },
          library: {
            name: "unknown",
            version: "unknown"
          }
        },
        messageId: "personas_2zKJ24JMRhVvIFJj4ukGOBKPeNo",
        event: "Audience Entered",
        receivedAt: "2025-07-02T16:27:10.584Z",
        integrations: {
          All: false,
          LiveLike: true
        },
        userId: "900",
        type: "track"
      })

      engageAddAudienceTrack.traits = undefined

      const addJson = {
        audience_id: 'aud_2zJkeVoLkrirhXup2uAPEsDLq4N',
        audience_name: 'test_audience',
        action: true,
        timestamp: '2025-07-02T16:26:57.511Z',
        livelike_profile_id: '122',
        user_id: '900',
        user_group_id: '456'
      }

      nock(apiBaseUrl)
        .post('/applications/test-client-id/segment-audience-sync/', addJson)
        .reply(200);
  
      const responses = await testDestination.testAction('syncToUserGroup', {
        event: engageAddAudienceTrack,
        settings,
        mapping
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should remove user from Audience with an Engage identify() call', async () => {
      
      const engageRemoveAudienceIdentify = createTestEvent({
        traits: {
          audience_key: "test_audience",
          livelike_profile_id: "122",
          test_audience: false,
          user_group_id: "456",
          user_id: "900"
        },
        timestamp: "2025-07-02T16:26:57.511Z",
        context: {
          __segment_internal: {
            creator: "sync-worker"
          },
          personas: {
            computation_class: "audience",
            computation_id: "aud_2zJkeVoLkrirhXup2uAPEsDLq4N",
            computation_key: "test_audience",
            namespace: "spa_9vACn44CYGDZNPNWDUXtMJ",
            space_id: "spa_9vACn44CYGDZNPNWDUXtMJ"
          },
          library: {
            name: "unknown",
            version: "unknown"
          }
        },
        messageId: "personas_2zKJ24JMRhVvIFJj4ukGOBKPeNo",
        event: "Audience Entered",
        receivedAt: "2025-07-02T16:27:10.584Z",
        integrations: {
          All: false,
          LiveLike: true
        },
        userId: "900",
        type: "identify"
      })

      engageRemoveAudienceIdentify.properties = undefined

      const removeJson = {
        audience_id: 'aud_2zJkeVoLkrirhXup2uAPEsDLq4N',
        audience_name: 'test_audience',
        action: false,
        timestamp: '2025-07-02T16:26:57.511Z',
        livelike_profile_id: '122',
        user_id: '900',
        user_group_id: '456'
      }

      nock(apiBaseUrl)
        .post('/applications/test-client-id/segment-audience-sync/', removeJson)
        .reply(200);
  
      const responses = await testDestination.testAction('syncToUserGroup', 
      {
          event: engageRemoveAudienceIdentify,
          settings,
          mapping
        }
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })

  describe('Non Engage payloads'  , () => { 
    it('should remove user from Audience with a non Engage payload', async () => {
      
      const settings = {
        clientId: 'test-client-id',
        producerToken: 'test-producer-token'
      }

      const nonEngageAddTrack = createTestEvent({
        properties: {
          audience_id: "custom_audience_id",
          audience_name: "custom_audience_name",
          livelike_profile_id: "livelike_profile_id_1",
          action: true
        },
        timestamp: "2025-07-02T16:26:57.511Z",
        messageId: "personas_2zKJ24JMRhVvIFJj4ukGOBKPeNo",
        event: "Added To Custom User Group",
        receivedAt: "2025-07-02T16:27:10.584Z",
        userId: "900",
        type: "track"
      })

      const nonEngageJson = {
        audience_id: 'custom_audience_id',
        audience_name: 'custom_audience_name',
        action: true,
        timestamp: '2025-07-02T16:26:57.511Z',
        livelike_profile_id: 'livelike_profile_id_1',
        user_id: '900'
      }

      const nonEngageMapping = {
        audience_id: { '@path': '$.properties.audience_id'},
        audience_name: {'@path': '$.properties.audience_name'} ,
        action: { '@path': '$.properties.action' },
        timestamp: { '@path': '$.timestamp' },
        traits_or_properties: { '@path': '$.properties' },
        livelike_profile_id: {'@path': '$.properties.livelike_profile_id'},
        user_id: { '@path': '$.userId'},
        user_group_id: {'@path': '$.properties.user_group_id'}
      }

      nock(apiBaseUrl)
        .post('/applications/test-client-id/segment-audience-sync/', nonEngageJson)
        .reply(200);
  
        const responses = await testDestination.testAction('syncToUserGroup', 
        {
            event: nonEngageAddTrack,
            settings,
            mapping: nonEngageMapping
          }
        )

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
    })
  })
})