import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { CONSTANTS } from '../../constants'
import { SegmentEvent } from '@segment/actions-core/*'

const testDestination = createTestIntegration(Destination)

const settings = {
  apiKey: 'test-api-key',
  iterableProjectType: 'hybrid' as const
}

const userIdSettings = {
  apiKey: 'test-api-key',
  iterableProjectType: 'userId' as const
}

describe('IterableLists.syncAudience', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('snapshots', () => {
    it('should match snapshot for subscribe request with email and userId', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user123',
        traits: {
          email: 'test@example.com',
          ld_segment_test: true
        },
        context: {
          personas: {
            computation_key: 'ld_segment_test',
            external_audience_id: '12345'
          }
        }
      })

      let requestBody: any
      nock(CONSTANTS.API_BASE_URL)
        .post('/lists/subscribe', (body) => {
          requestBody = body
          return true
        })
        .reply(200, {})

      await testDestination.testAction('syncAudience', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(requestBody).toMatchInlineSnapshot(`
        Object {
          "listId": 12345,
          "subscribers": Array [
            Object {
              "email": "test@example.com",
              "userId": "user123",
            },
          ],
        }
      `)
    })

    it('should match snapshot for subscribe request with userId only (userId project)', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user456',
        traits: {
          ld_segment_test: true
        },
        context: {
          personas: {
            computation_key: 'ld_segment_test',
            external_audience_id: '12345'
          }
        }
      })

      let requestBody: any
      nock(CONSTANTS.API_BASE_URL)
        .post('/lists/subscribe', (body) => {
          requestBody = body
          return true
        })
        .reply(200, {})

      await testDestination.testAction('syncAudience', {
        event,
        settings: userIdSettings,
        useDefaultMappings: true
      })

      expect(requestBody).toMatchInlineSnapshot(`
        Object {
          "listId": 12345,
          "subscribers": Array [
            Object {
              "preferUserId": true,
              "userId": "user456",
            },
          ],
        }
      `)
    })

    it('should match snapshot for subscribe request with dataFields', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user789',
        traits: {
          email: 'test@example.com',
          ld_segment_test: true
        },
        context: {
          personas: {
            computation_key: 'ld_segment_test',
            external_audience_id: '12345'
          }
        }
      })

      let requestBody: any
      nock(CONSTANTS.API_BASE_URL)
        .post('/lists/subscribe', (body) => {
          requestBody = body
          return true
        })
        .reply(200, {})

      await testDestination.testAction('syncAudience', {
        event,
        settings,
        mapping: {
          email: { '@path': '$.traits.email' },
          userId: { '@path': '$.userId' },
          segmentAudienceKey: { '@path': '$.context.personas.computation_key' },
          segmentAudienceId: { '@path': '$.context.personas.external_audience_id' },
          traitsOrProperties: { '@path': '$.traits' },
          dataFields: {
            firstName: 'John',
            lastName: 'Doe',
            source: 'segment'
          }
        }
      })

      expect(requestBody).toMatchInlineSnapshot(`
        Object {
          "listId": 12345,
          "subscribers": Array [
            Object {
              "dataFields": Object {
                "firstName": "John",
                "lastName": "Doe",
                "source": "segment",
              },
              "email": "test@example.com",
              "userId": "user789",
            },
          ],
        }
      `)
    })

    it('should match snapshot for unsubscribe request', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user123',
        traits: {
          email: 'test@example.com',
          ld_segment_test: false
        },
        context: {
          personas: {
            computation_key: 'ld_segment_test',
            external_audience_id: '12345'
          }
        }
      })

      let requestBody: any
      nock(CONSTANTS.API_BASE_URL)
        .post('/lists/unsubscribe', (body) => {
          requestBody = body
          return true
        })
        .reply(200, {})

      await testDestination.testAction('syncAudience', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(requestBody).toMatchInlineSnapshot(`
        Object {
          "listId": 12345,
          "subscribers": Array [
            Object {
              "email": "test@example.com",
              "userId": "user123",
            },
          ],
        }
      `)
    })

    it('should match snapshot for batch subscribe request', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          type: 'identify',
          userId: 'user1',
          traits: {
            email: 'user1@example.com',
            ld_segment_test: true
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user2',
          traits: {
            email: 'user2@example.com',
            ld_segment_test: true
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user3',
          traits: {
            email: 'user3@example.com',
            ld_segment_test: true
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        })
      ]

      let requestBody: any
      nock(CONSTANTS.API_BASE_URL)
        .post('/lists/subscribe', (body) => {
          requestBody = body
          return true
        })
        .reply(200, {})

      await testDestination.testBatchAction('syncAudience', {
        events,
        settings,
        useDefaultMappings: true
      })

      expect(requestBody).toMatchInlineSnapshot(`
        Object {
          "listId": 12345,
          "subscribers": Array [
            Object {
              "email": "user1@example.com",
              "userId": "user1",
            },
            Object {
              "email": "user2@example.com",
              "userId": "user2",
            },
            Object {
              "email": "user3@example.com",
              "userId": "user3",
            },
          ],
        }
      `)
    })

    it('should match snapshot for batch unsubscribe request', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          type: 'identify',
          userId: 'user1',
          traits: {
            email: 'user1@example.com',
            ld_segment_test: false
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user2',
          traits: {
            email: 'user2@example.com',
            ld_segment_test: false
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        })
      ]

      let requestBody: any
      nock(CONSTANTS.API_BASE_URL)
        .post('/lists/unsubscribe', (body) => {
          requestBody = body
          return true
        })
        .reply(200, {})

      await testDestination.testBatchAction('syncAudience', {
        events,
        settings,
        useDefaultMappings: true
      })

      expect(requestBody).toMatchInlineSnapshot(`
        Object {
          "listId": 12345,
          "subscribers": Array [
            Object {
              "email": "user1@example.com",
              "userId": "user1",
            },
            Object {
              "email": "user2@example.com",
              "userId": "user2",
            },
          ],
        }
      `)
    })

    it('should match snapshot for mixed batch operations', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          type: 'identify',
          userId: 'user1',
          traits: {
            email: 'user1@example.com',
            ld_segment_test: true
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user2',
          traits: {
            email: 'user2@example.com',
            ld_segment_test: false
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user3',
          traits: {
            email: 'user3@example.com',
            ld_segment_test: true
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        })
      ]

      let subscribeRequestBody: any
      let unsubscribeRequestBody: any

      nock(CONSTANTS.API_BASE_URL)
        .post('/lists/subscribe', (body) => {
          subscribeRequestBody = body
          return true
        })
        .reply(200, {})

      nock(CONSTANTS.API_BASE_URL)
        .post('/lists/unsubscribe', (body) => {
          unsubscribeRequestBody = body
          return true
        })
        .reply(200, {})

      await testDestination.testBatchAction('syncAudience', {
        events,
        settings,
        useDefaultMappings: true
      })

      expect({ subscribeRequestBody, unsubscribeRequestBody }).toMatchInlineSnapshot(`
        Object {
          "subscribeRequestBody": Object {
            "listId": 12345,
            "subscribers": Array [
              Object {
                "email": "user1@example.com",
                "userId": "user1",
              },
              Object {
                "email": "user3@example.com",
                "userId": "user3",
              },
            ],
          },
          "unsubscribeRequestBody": Object {
            "listId": 12345,
            "subscribers": Array [
              Object {
                "email": "user2@example.com",
                "userId": "user2",
              },
            ],
          },
        }
      `)
    })
  })

  describe('perform - single events', () => {
    describe('subscribe actions', () => {
      it('should subscribe a user with email and userId to a list (hybrid project)', async () => {
        const event = createTestEvent({
          type: 'identify',
          userId: 'user123',
          traits: {
            email: 'test@example.com',
            ld_segment_test: true
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        })

        nock(CONSTANTS.API_BASE_URL)
          .post('/lists/subscribe', {
            listId: 12345,
            subscribers: [
              {
                email: 'test@example.com',
                userId: 'user123'
              }
            ]
          })
          .reply(200, {})

        await expect(
          testDestination.testAction('syncAudience', {
            event,
            settings,
            useDefaultMappings: true
          })
        ).resolves.not.toThrowError()
      })

      it('should subscribe a user with only userId (userId project)', async () => {
        const event = createTestEvent({
          type: 'identify',
          userId: 'user456',
          traits: {
            ld_segment_test: true
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        })

        nock(CONSTANTS.API_BASE_URL)
          .post('/lists/subscribe', {
            listId: 12345,
            subscribers: [
              {
                userId: 'user456',
                preferUserId: true
              }
            ]
          })
          .reply(200, {})

        await expect(
          testDestination.testAction('syncAudience', {
            event,
            settings: userIdSettings,
            useDefaultMappings: true
          })
        ).resolves.not.toThrowError()
      })

      it('should subscribe a user with dataFields', async () => {
        const event = createTestEvent({
          type: 'identify',
          userId: 'user789',
          traits: {
            email: 'test@example.com',
            ld_segment_test: true
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        })

        nock(CONSTANTS.API_BASE_URL)
          .post('/lists/subscribe', {
            listId: 12345,
            subscribers: [
              {
                email: 'test@example.com',
                userId: 'user789',
                dataFields: {
                  firstName: 'John',
                  lastName: 'Doe'
                }
              }
            ]
          })
          .reply(200, {})

        await expect(
          testDestination.testAction('syncAudience', {
            event,
            settings,
            mapping: {
              email: { '@path': '$.traits.email' },
              userId: { '@path': '$.userId' },
              segmentAudienceKey: { '@path': '$.context.personas.computation_key' },
              segmentAudienceId: { '@path': '$.context.personas.external_audience_id' },
              traitsOrProperties: { '@path': '$.traits' },
              dataFields: {
                firstName: 'John',
                lastName: 'Doe'
              }
            }
          })
        ).resolves.not.toThrowError()
      })
    })

    describe('unsubscribe actions', () => {
      it('should unsubscribe a user from a list', async () => {
        const event = createTestEvent({
          type: 'identify',
          userId: 'user123',
          traits: {
            email: 'test@example.com',
            ld_segment_test: false
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        })

        nock(CONSTANTS.API_BASE_URL)
          .post('/lists/unsubscribe', {
            listId: 12345,
            subscribers: [
              {
                email: 'test@example.com',
                userId: 'user123'
              }
            ]
          })
          .reply(200, {})

        await expect(
          testDestination.testAction('syncAudience', {
            event,
            settings,
            useDefaultMappings: true
          })
        ).resolves.not.toThrowError()
      })
    })

    describe('validation errors', () => {
      it('should throw error when userId is missing for userId project type', async () => {
        const event = createTestEvent({
          type: 'identify',
          traits: {
            email: 'test@example.com',
            ld_segment_test: true
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        })

        await expect(
          testDestination.testAction('syncAudience', {
            event,
            settings: userIdSettings,
            mapping: {
              email: { '@path': '$.traits.email' },
              userId: undefined,
              segmentAudienceKey: { '@path': '$.context.personas.computation_key' },
              segmentAudienceId: { '@path': '$.context.personas.external_audience_id' },
              traitsOrProperties: { '@path': '$.traits' }
            }
          })
        ).rejects.toThrowError('User ID is required when Iterable Project Type = User ID')
      })

      it('should throw error when both email and userId are missing for hybrid project', async () => {
        const event = createTestEvent({
          type: 'identify',
          traits: {
            ld_segment_test: true
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        })

        await expect(
          testDestination.testAction('syncAudience', {
            event,
            settings,
            mapping: {
              email: undefined,
              userId: undefined,
              segmentAudienceKey: { '@path': '$.context.personas.computation_key' },
              segmentAudienceId: { '@path': '$.context.personas.external_audience_id' },
              traitsOrProperties: { '@path': '$.traits' }
            }
          })
        ).rejects.toThrowError('Either User ID or Email is required when Iterable Project Type = Hybrid')
      })

      it('should throw error when segment audience ID is invalid', async () => {
        const event = createTestEvent({
          type: 'identify',
          userId: 'user123',
          traits: {
            email: 'test@example.com',
            ld_segment_test: true
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: 'invalid-id'
            }
          }
        })

        await expect(
          testDestination.testAction('syncAudience', {
            event,
            settings,
            useDefaultMappings: true
          })
        ).rejects.toThrowError('Invalid or missing Segment Audience ID')
      })
    })

    describe('API error handling', () => {
      it('should throw error when subscribe API call fails', async () => {
        const event = createTestEvent({
          type: 'identify',
          userId: 'user123',
          traits: {
            email: 'test@example.com',
            ld_segment_test: true
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        })

        nock(CONSTANTS.API_BASE_URL).post('/lists/subscribe').reply(500, { message: 'Internal Server Error' })

        await expect(
          testDestination.testAction('syncAudience', {
            event,
            settings,
            useDefaultMappings: true
          })
        ).rejects.toThrowError()
      })

      it('should throw error when unsubscribe API call fails', async () => {
        const event = createTestEvent({
          type: 'identify',
          userId: 'user123',
          traits: {
            email: 'test@example.com',
            ld_segment_test: false
          },
          context: {
            personas: {
              computation_key: 'ld_segment_test',
              external_audience_id: '12345'
            }
          }
        })

        nock(CONSTANTS.API_BASE_URL).post('/lists/unsubscribe').reply(401, { message: 'Unauthorized' })

        await expect(
          testDestination.testAction('syncAudience', {
            event,
            settings,
            useDefaultMappings: true
          })
        ).rejects.toThrowError()
      })
    })
  })

  describe('performBatch - batch events', () => {
    describe('all subscribe actions', () => {
      it('should handle batch of subscribe actions', async () => {
        const events: SegmentEvent[] = [
          createTestEvent({
            type: 'identify',
            userId: 'user1',
            traits: {
              email: 'user1@example.com',
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          }),
          createTestEvent({
            type: 'identify',
            userId: 'user2',
            traits: {
              email: 'user2@example.com',
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          }),
          createTestEvent({
            type: 'identify',
            userId: 'user3',
            traits: {
              email: 'user3@example.com',
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          })
        ]

        nock(CONSTANTS.API_BASE_URL)
          .post('/lists/subscribe', {
            listId: 12345,
            subscribers: [
              { email: 'user1@example.com', userId: 'user1' },
              { email: 'user2@example.com', userId: 'user2' },
              { email: 'user3@example.com', userId: 'user3' }
            ]
          })
          .reply(200, {})

        await expect(
          testDestination.testBatchAction('syncAudience', {
            events,
            settings,
            useDefaultMappings: true
          })
        ).resolves.not.toThrowError()
      })

      it('should handle batch subscribe with userId project type', async () => {
        const events: SegmentEvent[] = [
          createTestEvent({
            type: 'identify',
            userId: 'user1',
            traits: {
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          }),
          createTestEvent({
            type: 'identify',
            userId: 'user2',
            traits: {
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          })
        ]

        nock(CONSTANTS.API_BASE_URL)
          .post('/lists/subscribe', {
            listId: 12345,
            subscribers: [
              { userId: 'user1', preferUserId: true },
              { userId: 'user2', preferUserId: true }
            ]
          })
          .reply(200, {})

        await expect(
          testDestination.testBatchAction('syncAudience', {
            events,
            settings: userIdSettings,
            useDefaultMappings: true
          })
        ).resolves.not.toThrowError()
      })

      it('should batch subscribe with dataFields', async () => {
        const events: SegmentEvent[] = [
          createTestEvent({
            type: 'identify',
            userId: 'user1',
            traits: {
              email: 'user1@example.com',
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          }),
          createTestEvent({
            type: 'identify',
            userId: 'user2',
            traits: {
              email: 'user2@example.com',
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          })
        ]

        nock(CONSTANTS.API_BASE_URL)
          .post('/lists/subscribe', (body: any) => {
            return (
              body.listId === 12345 &&
              body.subscribers.length === 2 &&
              body.subscribers[0].dataFields?.source === 'segment' &&
              body.subscribers[1].dataFields?.source === 'segment'
            )
          })
          .reply(200, {})

        await expect(
          testDestination.testBatchAction('syncAudience', {
            events,
            settings,
            mapping: {
              email: { '@path': '$.traits.email' },
              userId: { '@path': '$.userId' },
              segmentAudienceKey: { '@path': '$.context.personas.computation_key' },
              segmentAudienceId: { '@path': '$.context.personas.external_audience_id' },
              traitsOrProperties: { '@path': '$.traits' },
              dataFields: { source: 'segment' }
            }
          })
        ).resolves.not.toThrowError()
      })
    })

    describe('all unsubscribe actions', () => {
      it('should handle batch of unsubscribe actions', async () => {
        const events: SegmentEvent[] = [
          createTestEvent({
            type: 'identify',
            userId: 'user1',
            traits: {
              email: 'user1@example.com',
              ld_segment_test: false
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          }),
          createTestEvent({
            type: 'identify',
            userId: 'user2',
            traits: {
              email: 'user2@example.com',
              ld_segment_test: false
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          })
        ]

        nock(CONSTANTS.API_BASE_URL)
          .post('/lists/unsubscribe', {
            listId: 12345,
            subscribers: [
              { email: 'user1@example.com', userId: 'user1' },
              { email: 'user2@example.com', userId: 'user2' }
            ]
          })
          .reply(200, {})

        await expect(
          testDestination.testBatchAction('syncAudience', {
            events,
            settings,
            useDefaultMappings: true
          })
        ).resolves.not.toThrowError()
      })
    })

    describe('mixed subscribe and unsubscribe actions', () => {
      it('should handle batch with both subscribe and unsubscribe actions', async () => {
        const events: SegmentEvent[] = [
          createTestEvent({
            type: 'identify',
            userId: 'user1',
            traits: {
              email: 'user1@example.com',
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          }),
          createTestEvent({
            type: 'identify',
            userId: 'user2',
            traits: {
              email: 'user2@example.com',
              ld_segment_test: false
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          }),
          createTestEvent({
            type: 'identify',
            userId: 'user3',
            traits: {
              email: 'user3@example.com',
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          }),
          createTestEvent({
            type: 'identify',
            userId: 'user4',
            traits: {
              email: 'user4@example.com',
              ld_segment_test: false
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          })
        ]

        nock(CONSTANTS.API_BASE_URL)
          .post('/lists/subscribe', {
            listId: 12345,
            subscribers: [
              { email: 'user1@example.com', userId: 'user1' },
              { email: 'user3@example.com', userId: 'user3' }
            ]
          })
          .reply(200, {})

        nock(CONSTANTS.API_BASE_URL)
          .post('/lists/unsubscribe', {
            listId: 12345,
            subscribers: [
              { email: 'user2@example.com', userId: 'user2' },
              { email: 'user4@example.com', userId: 'user4' }
            ]
          })
          .reply(200, {})

        await expect(
          testDestination.testBatchAction('syncAudience', {
            events,
            settings,
            useDefaultMappings: true
          })
        ).resolves.not.toThrowError()
      })

      it('should make only subscribe call when all events are subscribes', async () => {
        const events: SegmentEvent[] = [
          createTestEvent({
            type: 'identify',
            userId: 'user1',
            traits: {
              email: 'user1@example.com',
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          }),
          createTestEvent({
            type: 'identify',
            userId: 'user2',
            traits: {
              email: 'user2@example.com',
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          })
        ]

        nock(CONSTANTS.API_BASE_URL).post('/lists/subscribe').reply(200, {})

        await expect(
          testDestination.testBatchAction('syncAudience', {
            events,
            settings,
            useDefaultMappings: true
          })
        ).resolves.not.toThrowError()
      })
    })

    describe('batch validation and error handling', () => {
      it('should skip events with missing userId for userId project', async () => {
        const events: SegmentEvent[] = [
          createTestEvent({
            type: 'identify',
            userId: 'user1',
            traits: {
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          }),
          createTestEvent({
            type: 'identify',
            traits: {
              email: 'user2@example.com',
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          }),
          createTestEvent({
            type: 'identify',
            userId: 'user3',
            traits: {
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          })
        ]

        // Delete userId from the second event
        delete events[1].userId

        nock(CONSTANTS.API_BASE_URL)
          .post('/lists/subscribe', (body: any) => {
            // Only 2 valid events should be in the API call (events with userId)
            return body.listId === 12345 && body.subscribers.length === 2
          })
          .reply(200, {})

        await expect(
          testDestination.testBatchAction('syncAudience', {
            events,
            settings: userIdSettings,
            useDefaultMappings: true
          })
        ).resolves.not.toThrowError()
      })

      it('should handle API errors gracefully in batch mode', async () => {
        const events: SegmentEvent[] = [
          createTestEvent({
            type: 'identify',
            userId: 'user1',
            traits: {
              email: 'user1@example.com',
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          }),
          createTestEvent({
            type: 'identify',
            userId: 'user2',
            traits: {
              email: 'user2@example.com',
              ld_segment_test: true
            },
            context: {
              personas: {
                computation_key: 'ld_segment_test',
                external_audience_id: '12345'
              }
            }
          })
        ]

        nock(CONSTANTS.API_BASE_URL).post('/lists/subscribe').reply(500, { message: 'Internal Server Error' })

        // In batch mode, errors should not throw but be returned in response
        await expect(
          testDestination.testBatchAction('syncAudience', {
            events,
            settings,
            useDefaultMappings: true
          })
        ).resolves.not.toThrowError()
      })
    })
  })
})
