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
      traits_or_properties_hidden: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      },
      additional_user_traits: {
        livelike_profile_id: {
          '@if': {
            exists: { '@path': '$.traits.livelike_profile_id' },
            then: { '@path': '$.traits.livelike_profile_id' },
            else: { '@path': '$.properties.livelike_profile_id' }
          }
        },
        email: {
          '@if': {
            exists: { '@path': '$.traits.email' },
            then: { '@path': '$.traits.email' },
            else: { '@path': '$.properties.email' }
          }
        }
      },
      user_id: { '@path': '$.userId'}
    }

    const settings = {
      clientId: 'test-client-id',
      producerToken: 'test-producer-token'
    }

    it('should add user to Audience with an Engage track() call', async () => {

      const engageAddAudienceTrack = createTestEvent({
        properties: {
          livelike_profile_id: "122",
          test_audience: true,
          user_id: "900",
          email: "test@test.com"
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

      const addJson = [{
        audience_id: 'aud_2zJkeVoLkrirhXup2uAPEsDLq4N',
        audience_name: 'test_audience',
        action: true,
        timestamp: '2025-07-02T16:26:57.511Z',
        livelike_profile_id: '122',
        user_id: '900',
        email: "test@test.com"
      }]

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


    it('should remove user from Audience with an Engage track() call', async () => {

      const engageAddAudienceTrack = createTestEvent({
        properties: {
          test_audience: false,
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

      const addJson = [{
        audience_id: 'aud_2zJkeVoLkrirhXup2uAPEsDLq4N',
        audience_name: 'test_audience',
        action: false,
        timestamp: '2025-07-02T16:26:57.511Z',
        user_id: '900'
      }]
      
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
  })

  describe('Non Engage payloads'  , () => { 

    const mapping = {
      audience_id: { '@path': '$.properties.audience_id'},
      audience_name: {'@path': '$.properties.audience_name'} ,
      timestamp: { '@path': '$.timestamp' },
      action: { '@path': '$.properties.action' },
      traits_or_properties_hidden: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      },
      additional_user_traits: {
        livelike_profile_id: {
          '@if': {
            exists: { '@path': '$.traits.livelike_profile_id' },
            then: { '@path': '$.traits.livelike_profile_id' },
            else: { '@path': '$.properties.livelike_profile_id' }
          }
        },
        email: {
          '@if': {
            exists: { '@path': '$.traits.email' },
            then: { '@path': '$.traits.email' },
            else: { '@path': '$.properties.email' }
          }
        }
      },
      user_id: { '@path': '$.userId'}
    }

    const settings = {
      clientId: 'test-client-id',
      producerToken: 'test-producer-token'
    }

    it('should add user to Audience when track() call not from Engage', async () => {

      const notEngageAddAudienceTrack = createTestEvent({
        properties: {
          audience_name: "test_audience",
          audience_id: "test_audience_12345",
          livelike_profile_id: "122",
          action: true,
          user_id: "900",
          email: "test@test.com"
        },
        timestamp: "2025-07-02T16:26:57.511Z",
        context: {
          library: {
            name: "unknown",
            version: "unknown"
          }
        },
        messageId: "personas_2zKJ24JMRhVvIFJj4ukGOBKPeNo",
        event: "Non Engage Audience Entered",
        receivedAt: "2025-07-02T16:27:10.584Z",
        integrations: {
          All: false,
          LiveLike: true
        },
        userId: "900",
        type: "track"
      })

      notEngageAddAudienceTrack.traits = undefined

      const addJson = [{
        audience_id: 'test_audience_12345',
        audience_name: 'test_audience',
        action: true,
        timestamp: '2025-07-02T16:26:57.511Z',
        livelike_profile_id: '122',
        user_id: '900',
        email: "test@test.com"
      }]

      nock(apiBaseUrl)
        .post('/applications/test-client-id/segment-audience-sync/', addJson)
        .reply(200);
  
      const responses = await testDestination.testAction('syncToUserGroup', {
        event: notEngageAddAudienceTrack,
        settings,
        mapping
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should remove user to Audience when track() call not from Engage', async () => {

      const notEngageAddAudienceTrack = createTestEvent({
        properties: {
          audience_name: "test_audience",
          audience_id: "test_audience_12345",
          livelike_profile_id: "122",
          action: false,
          user_id: "900",
          email: "test@test.com"
        },
        timestamp: "2025-07-02T16:26:57.511Z",
        context: {
          library: {
            name: "unknown",
            version: "unknown"
          }
        },
        messageId: "personas_2zKJ24JMRhVvIFJj4ukGOBKPeNo",
        event: "Non Engage Audience Entered",
        receivedAt: "2025-07-02T16:27:10.584Z",
        integrations: {
          All: false,
          LiveLike: true
        },
        userId: "900",
        type: "track"
      })

      notEngageAddAudienceTrack.traits = undefined

      const addJson = [{
        audience_id: 'test_audience_12345',
        audience_name: 'test_audience',
        action: false,
        timestamp: '2025-07-02T16:26:57.511Z',
        livelike_profile_id: '122',
        user_id: '900',
        email: "test@test.com"
      }]

      nock(apiBaseUrl)
        .post('/applications/test-client-id/segment-audience-sync/', addJson)
        .reply(200);
  
      const responses = await testDestination.testAction('syncToUserGroup', {
        event: notEngageAddAudienceTrack,
        settings,
        mapping
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

  })

  describe('Engage Audience payloads', () => {
    
    const mapping = {
      audience_id: { '@path': '$.context.personas.computation_id'},
      audience_name: {'@path': '$.context.personas.computation_key'} ,
      timestamp: { '@path': '$.timestamp' },
      traits_or_properties_hidden: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      },
      additional_user_traits: {
        livelike_profile_id: {
          '@if': {
            exists: { '@path': '$.traits.livelike_profile_id' },
            then: { '@path': '$.traits.livelike_profile_id' },
            else: { '@path': '$.properties.livelike_profile_id' }
          }
        },
        email: {
          '@if': {
            exists: { '@path': '$.traits.email' },
            then: { '@path': '$.traits.email' },
            else: { '@path': '$.properties.email' }
          }
        }
      },
      user_id: { '@path': '$.userId'}
    }

    const settings = {
      clientId: 'test-client-id',
      producerToken: 'test-producer-token'
    }

    it('Batch: should add and remove users to Audience with an Engage track() call', async () => {

      const engageAddAudienceTrack1 = createTestEvent({
        properties: {
          livelike_profile_id: "122",
          test_audience: true,
          user_id: "900",
          email: "test@test.com"
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

      engageAddAudienceTrack1.traits = undefined

      const engageAddAudienceTrack2 = createTestEvent({
        properties: {
          livelike_profile_id: "2122",
          test_audience: false,
          email: "test2@test.com"
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
        event: "Audience Existed",
        receivedAt: "2025-07-02T16:27:10.584Z",
        integrations: {
          All: false,
          LiveLike: true
        },
        userId: "2900",
        type: "track"
      })

      engageAddAudienceTrack2.traits = undefined

      const batchJSON = [{
        audience_id: 'aud_2zJkeVoLkrirhXup2uAPEsDLq4N',
        audience_name: 'test_audience',
        action: true,
        timestamp: '2025-07-02T16:26:57.511Z',
        livelike_profile_id: '122',
        user_id: '900',
        email: "test@test.com"
      },
      {
          audience_id: 'aud_2zJkeVoLkrirhXup2uAPEsDLq4N',
          audience_name: 'test_audience',
          action: false,
          timestamp: '2025-07-02T16:26:57.511Z',
          livelike_profile_id: '2122',
          user_id: '2900',
          email: "test2@test.com"
      }]

      nock(apiBaseUrl)
        .post('/applications/test-client-id/segment-audience-sync/', batchJSON)
        .reply(200);
  
      const responses = await testDestination.testBatchAction('syncToUserGroup', {
        events: [engageAddAudienceTrack1, engageAddAudienceTrack2],
        settings,
        mapping
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })
})