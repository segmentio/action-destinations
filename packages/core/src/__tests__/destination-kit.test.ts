import { IntegrationError } from '../errors'
import { ActionDefinition } from '../destination-kit/action'
import {
  StateContext,
  Destination,
  DestinationDefinition,
  Logger,
  StatsClient,
  StatsContext,
  TransactionContext,
  AuthenticationScheme,
  RefreshAccessTokenResult,
  AudienceDestinationDefinition
} from '../destination-kit'
import { JSONObject } from '../json-object'
import { SegmentEvent } from '../segment-event'
const WRONG_ADVERTISER_ID = '12861247612'
const WRONG_AUDIENCE_ID = '1234567890'

const destinationCustomAuth: DestinationDefinition<JSONObject> = {
  name: 'Actions Google Analytic 4',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      apiSecret: {
        label: 'API secret',
        description: 'Api key',
        type: 'string',
        required: true
      }
    }
  },
  actions: {
    customEvent: {
      title: 'Send a Custom Event',
      description: 'Send events to a custom event in API',
      defaultSubscription: 'type = "track"',
      fields: {
        optional_field: {
          type: 'number',
          label: 'A',
          description: 'A'
        }
      },
      perform: (_request, { payload }) => {
        return ['this is a test', payload]
      }
    }
  }
}

const destinationOAuth2: DestinationDefinition<JSONObject> = {
  name: 'Actions Google Analytic 4',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
    fields: {
      apiSecret: {
        label: 'API secret',
        description: 'Api key',
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: (_request) => {
      return new Promise((resolve, _reject) => {
        setTimeout(() => {
          resolve({ accessToken: 'fresh-token' })
        }, 3)
      })
    }
  },
  actions: {
    customEvent: {
      title: 'Send a Custom Event',
      description: 'Send events to a custom event in API',
      defaultSubscription: 'type = "track"',
      fields: {},
      perform: (_request) => {
        return 'this is a test'
      }
    }
  }
}
const authentication: AuthenticationScheme<JSONObject> = {
  scheme: 'oauth2',
  fields: {
    apiSecret: {
      label: 'API secret',
      description: 'Api key',
      type: 'string',
      required: true
    }
  },
  refreshAccessToken: (_request) => {
    return new Promise((resolve, _reject) => {
      resolve({ accessToken: 'fresh-token' })
    })
  }
}

const destinationOAuth3: DestinationDefinition<JSONObject> = {
  name: 'Actions Google Analytic 5',
  mode: 'cloud',
  authentication: authentication,
  onDelete: async (_request, { auth, payload }) => {
    if (auth?.accessToken == 'invalid-access-token') {
      return new Promise((_resolve, reject) => {
        reject(new IntegrationError('Unauthorized', 'UNAUTHORIZED', 401))
      })
    }

    // it could be due to invalid input or Bad Request
    if (!payload?.userId) {
      return new Promise((_resolve, reject) => {
        reject(new IntegrationError('Wrong AdvertiserId Value', 'BAD REQUEST', 400))
      })
    }
    return new Promise((resolve, _reject) => {
      resolve({ output: 'Deleted' })
    })
  },
  actions: {
    customEvent: {
      title: 'Send a Custom Event',
      description: 'Send events to a custom event in API',
      defaultSubscription: 'type = "track"',
      fields: {
        advertiserId: {
          label: 'Advertiser ID',
          description: 'Advertiser Id',
          type: 'string',
          required: true
        }
      },
      perform: (_request: any, { auth, payload }) => {
        if (auth?.accessToken == 'invalid-access-token') {
          return new Promise((_resolve, reject) => {
            reject(new IntegrationError('Unauthorized', 'UNAUTHORIZED', 401))
          })
        }

        // it could be due to invalid input or Bad Request
        if (!payload?.advertiserId)
          throw new IntegrationError('Missing advertiserId Value', 'MISSING_REQUIRED_FIELD', 400)

        return new Promise((resolve, _reject) => {
          resolve('this is a test')
        })
      },
      performBatch: (_request, { auth, payload }) => {
        if (auth?.accessToken == 'invalid-access-token') {
          return new Promise((_resolve, reject) => {
            reject(new IntegrationError('Unauthorized', 'UNAUTHORIZED', 401))
          })
        }

        // it could be due to invalid input in Batch API Response, Entire Batch Failed !
        if (payload[0]?.advertiserId == WRONG_ADVERTISER_ID) {
          return new Promise((_resolve, reject) => {
            reject(new IntegrationError('Wrong AdvertiserId Value', 'BAD REQUEST', 400))
          })
        }

        return new Promise((resolve, _reject) => {
          resolve('this is a test')
        })
      }
    }
  }
}

const audienceDestination: AudienceDestinationDefinition<JSONObject> = {
  name: 'Amazon AMC (Actions)',
  mode: 'cloud',
  authentication: authentication,
  audienceFields: {},
  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule; update as necessary
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    },

    // Mocked createAudience Handler
    async createAudience(_request, createAudienceInput) {
      const settings: any = createAudienceInput.settings
      const audienceSettings: any = createAudienceInput.audienceSettings

      // it could be due to invalid input or Bad Request
      if (!audienceSettings?.advertiserId)
        throw new IntegrationError('Missing advertiserId Value', 'MISSING_REQUIRED_FIELD', 400)

      // invalid access token
      if (settings.oauth.access_token == 'invalid-access-token' || settings.oauth.clientId == 'invalid_client_id') {
        return new Promise((_resolve, reject) => {
          reject(new IntegrationError('Unauthorized', 'UNAUTHORIZED', 401))
        })
      }

      return new Promise((resolve, _reject) => {
        resolve({ externalId: '123456789' })
      })
    },

    // Mocked getAudience Handler
    async getAudience(_request, getAudienceInput) {
      const settings: any = getAudienceInput.settings
      const audience_id = getAudienceInput.externalId

      if (audience_id == WRONG_AUDIENCE_ID) {
        throw new IntegrationError('audienceId not found', 'AUDIENCEID_NOT_FOUND', 400)
      }

      if (settings.oauth.access_token == 'invalid-access-token' || settings.oauth.clientId == 'invalid_client_id') {
        return new Promise((_resolve, reject) => {
          reject(new IntegrationError('Unauthorized', 'UNAUTHORIZED', 401))
        })
      }

      return new Promise((resolve, _reject) => {
        resolve({ externalId: audience_id })
      })
    }
  },
  actions: {}
}

const destinationWithOptions: DestinationDefinition<JSONObject> = {
  name: 'Actions Google Analytic 4',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
    fields: {
      apiSecret: {
        label: 'API secret',
        description: 'Api key',
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: (_request) => {
      return new Promise((resolve, _reject) => {
        setTimeout(() => {
          resolve({ accessToken: 'fresh-token' })
        }, 3)
      })
    }
  },
  actions: {
    customEvent: {
      title: 'Send a Custom Event',
      description: 'Send events to a custom event in API',
      defaultSubscription: 'type = "track"',
      fields: {},
      perform: (_request, { features, statsContext, logger, transactionContext, stateContext }) => {
        return { features, statsContext, logger, transactionContext, stateContext }
      }
    }
  }
}

const destinationWithSyncMode: DestinationDefinition<JSONObject> = {
  name: 'Actions Google Analytics 4',
  mode: 'cloud',
  actions: {
    customEvent: {
      title: 'Send a Custom Event',
      description: 'Send events to a custom event in API',
      defaultSubscription: 'type = "track"',
      fields: {},
      syncMode: {
        default: 'add',
        description: 'Select the sync mode for the subscription',
        label: 'Sync Mode',
        choices: [
          {
            label: 'Insert',
            value: 'add'
          },
          {
            label: 'Delete',
            value: 'delete'
          }
        ]
      },
      perform: (_request, { syncMode }) => {
        return ['this is a test', syncMode]
      },
      performBatch: (_request, { syncMode }) => {
        return ['this is a test', syncMode]
      }
    }
  }
}

const destinationWithIdentifier: DestinationDefinition<JSONObject> = {
  name: 'Actions Google Analytics 4',
  mode: 'cloud',
  actions: {
    customEvent: {
      title: 'Send a Custom Event',
      description: 'Send events to a custom event in API',
      defaultSubscription: 'type = "track"',
      fields: {
        userId: {
          label: 'User ID',
          description: 'The user ID',
          type: 'string',
          required: true,
          category: 'identifier'
        }
      },
      perform: (_request, { matchingKey }) => {
        return ['this is a test', matchingKey]
      },
      performBatch: (_request, { matchingKey }) => {
        return ['this is a test', matchingKey]
      }
    }
  }
}

interface Payload {
  testDynamicField: string
  testUnstructuredObject: Record<string, string>
  testStructuredObject: {
    testDynamicSubfield: string
  }
  testObjectArrays: Array<{ testDynamicSubfield: string }>
}

const destinationWithDynamicFields: DestinationDefinition<JSONObject> = {
  name: 'Actions Dynamic Fields',
  mode: 'cloud',
  actions: {
    customEvent: {
      title: 'Send a Custom Event',
      description: 'Send events to a custom event in API',
      defaultSubscription: 'type = "track"',
      fields: {
        testDynamicField: {
          label: 'Dynamic Field',
          description: 'A dynamic field',
          type: 'string',
          required: true,
          dynamic: true
        },
        testUnstructuredObject: {
          label: 'Unstructured Object',
          description: 'An unstructured object',
          type: 'object',
          dynamic: true
        },
        testStructuredObject: {
          label: 'Structured Object',
          description: 'A structured object',
          type: 'object',
          properties: {
            testDynamicSubfield: {
              label: 'Test Field',
              description: 'A test field',
              type: 'string',
              required: true,
              dynamic: true
            }
          }
        },
        testObjectArrays: {
          label: 'Structured Array of Object',
          description: 'A structured array of object',
          type: 'object',
          multiple: true,
          properties: {
            testDynamicSubfield: {
              label: 'Test Field',
              description: 'A test field',
              type: 'string',
              required: true,
              dynamic: true
            }
          }
        }
      },
      dynamicFields: {
        testDynamicField: async () => {
          return {
            choices: [{ label: 'test', value: 'test' }],
            nextPage: ''
          }
        },
        testUnstructuredObject: {
          __keys__: async () => {
            return {
              choices: [{ label: 'Im a key', value: '🔑' }],
              nextPage: ''
            }
          },
          __values__: async (_, input) => {
            const { dynamicFieldContext } = input

            return {
              choices: [{ label: `Im a value for ${dynamicFieldContext?.selectedKey}`, value: '2️⃣' }],
              nextPage: ''
            }
          }
        },
        testStructuredObject: {
          testDynamicSubfield: async () => {
            return {
              choices: [{ label: 'Im a subfield', value: 'nah' }],
              nextPage: ''
            }
          }
        },
        testObjectArrays: {
          testDynamicSubfield: async (_, input) => {
            const { dynamicFieldContext } = input

            return {
              choices: [
                { label: `Im a subfield for element ${dynamicFieldContext?.selectedArrayIndex}`, value: 'nah' }
              ],
              nextPage: ''
            }
          }
        }
      },
      perform: (_request, { syncMode }) => {
        return ['this is a test', syncMode]
      }
    } as ActionDefinition<JSONObject, Payload>
  }
}

describe('destination kit', () => {
  describe('event validations', () => {
    test('should return `invalid subscription` when sending an empty subscribe', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = { type: 'track' }
      const testSettings = { apiSecret: 'test_key', subscription: { subscribe: '', partnerAction: 'customEvent' } }
      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([{ output: 'invalid subscription' }])
    })

    test('should return invalid subscription with details when sending an invalid subscribe', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = { type: 'track' }
      const testSettings = { apiSecret: 'test_key', subscription: { subscribe: 'typo', partnerAction: 'customEvent' } }
      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([{ output: expect.stringContaining('invalid subscription') }])
      expect(res[0].output).toContain('Cannot read')
    })

    test('should return `not subscribed` when providing an empty event', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testSettings = {
        apiSecret: 'test_key',
        subscription: { subscribe: 'type = "track"', partnerAction: 'customEvent' }
      }
      // @ts-ignore needed for replicating empty event at runtime
      const res = await destinationTest.onEvent({}, testSettings)
      expect(res).toEqual([{ output: 'not subscribed' }])
    })

    test('should fail if provided invalid settings', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = { type: 'track' }
      const testSettings = {
        apiSecret: undefined,
        subscription: { subscribe: 'type = "track"', partnerAction: 'customEvent' }
      }
      // @ts-expect-error we are missing valid settings on purpose!
      const promise = destinationTest.onEvent(testEvent, testSettings)
      await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
        `"The root value is missing the required field 'apiSecret'."`
      )
    })

    test('should succeed if provided with a valid event & settings', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }

      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        { output: 'Payload validated' },
        { output: 'Action Executed', data: ['this is a test', {}] }
      ])
    })

    test('should succeed when traits filtering is specified', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        traits: {
          a: 'foo'
        },
        userId: '3456fff',
        type: 'identify'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "identify" and traits.a = "foo"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }
      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        { output: 'Payload validated' },
        { output: 'Action Executed', data: ['this is a test', {}] }
      ])
    })

    test('should succeed when property filtering is specified', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testEvent: SegmentEvent = {
        properties: { a: 'foo', field_one: 'test input' },
        traits: {
          b: 'foo'
        },
        userId: '3456fff',
        type: 'identify'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "identify" and properties.a = "foo"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }

      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        { output: 'Payload validated' },
        { output: 'Action Executed', data: ['this is a test', {}] }
      ])
    })
  })

  describe('payload mapping + validation', () => {
    test('removes empty values from the payload', async () => {
      const destinationTest = new Destination(destinationCustomAuth)

      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }

      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            // Intentionally empty, to get stripped out
            optional_field: ''
          }
        }
      }

      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        { output: 'Payload validated' },
        { output: 'Action Executed', data: ['this is a test', {}] }
      ])
    })

    test('should inject the syncMode value in the perform handler', async () => {
      const destinationTest = new Destination(destinationWithSyncMode)
      const testEvent: SegmentEvent = { type: 'track' }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            __segment_internal_sync_mode: 'add'
          }
        }
      }

      const res = await destinationTest.onEvent(testEvent, testSettings)

      expect(res).toEqual([
        { output: 'Mappings resolved' },
        {
          output: 'Action Executed',
          data: ['this is a test', 'add']
        }
      ])
    })

    test('should inject the syncMode value in the performBatch handler', async () => {
      const destinationTest = new Destination(destinationWithSyncMode)
      const testEvent: SegmentEvent = { type: 'track' }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            __segment_internal_sync_mode: 'add'
          }
        }
      }

      const res = await destinationTest.onBatch([testEvent], testSettings)

      expect(res).toEqual([
        {
          output: 'successfully processed batch of events'
        }
      ])
    })
    test('should inject the matchingKey value in the perform handler', async () => {
      const destinationTest = new Destination(destinationWithIdentifier)
      const testEvent: SegmentEvent = { type: 'track' }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            __segment_internal_matching_key: 'userId',
            userId: 'this-is-a-user-id'
          }
        }
      }
      const res = await destinationTest.onEvent(testEvent, testSettings)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        { output: 'Payload validated' },
        {
          output: 'Action Executed',
          data: ['this is a test', 'userId']
        }
      ])
    })
    test('should inject the matchingKey value in the performBatch handler', async () => {
      const destinationTest = new Destination(destinationWithIdentifier)
      const testEvent: SegmentEvent = { type: 'track' }
      const testSettings = {
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            __segment_internal_matching_key: 'userId',
            userId: 'this-is-a-user-id'
          }
        }
      }

      const res = await destinationTest.onBatch([testEvent], testSettings)

      expect(res).toEqual([
        {
          output: 'successfully processed batch of events'
        }
      ])
    })
  })

  describe('refresh token', () => {
    test('should throw a `NotImplemented` error', async () => {
      const destinationTest = new Destination(destinationCustomAuth)
      const testSettings = {
        subscription: { subscribe: '', partnerAction: 'customEvent' }
      }
      const oauthData = {
        accessToken: 'test-access-token',
        refreshToken: 'refresh-token',
        clientId: 'test-clientid',
        clientSecret: 'test-clientsecret',
        refreshTokenUrl: 'abc123.xyz'
      }
      try {
        await destinationTest.refreshAccessToken(testSettings, oauthData)
        fail('test should have thrown a NotImplemented error')
      } catch (e: any) {
        expect(e.status).toEqual(501)
        expect(e.message).toEqual('refreshAccessToken is only valid with oauth2 authentication scheme')
        expect(e.code).toEqual('NotImplemented')
      }
    })

    test('should throw a `NotImplemented` error', async () => {
      const destinationTest = new Destination(destinationOAuth2)
      const testSettings = {
        subscription: { subscribe: 'type = "track"', partnerAction: 'customEvent' }
      }
      const oauthData = {
        accessToken: 'test-access-token',
        refreshToken: 'refresh-token',
        clientId: 'test-clientid',
        clientSecret: 'test-clientsecret',
        refreshTokenUrl: 'abc123.xyz'
      }
      const res = await destinationTest.refreshAccessToken(testSettings, oauthData)

      expect(res).toEqual({ accessToken: 'fresh-token' })
    })

    test('should invoke synchronizeRefreshAccessToken if defined', async () => {
      const destinationTest = new Destination(destinationOAuth2)

      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }

      const acquireLockMock = jest.fn(() => Promise.resolve())

      await expect(
        destinationTest.refreshAccessToken(
          testSettings,
          { clientId: '', clientSecret: '', accessToken: '', refreshToken: '' },
          acquireLockMock
        )
      ).resolves.not.toThrowError()
      expect(acquireLockMock).toHaveBeenCalledTimes(1)
    })

    test('should succeed if synchronizeRefreshAccessToken handler is not passed in event options', async () => {
      const destinationTest = new Destination(destinationOAuth2)

      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }

      await expect(
        destinationTest.refreshAccessToken(testSettings, {
          clientId: '',
          clientSecret: '',
          accessToken: '',
          refreshToken: ''
        })
      ).resolves.not.toThrowError()
    })
  })

  describe('features', () => {
    test('should not crash when features are passed to the perform handler', async () => {
      const destinationTest = new Destination(destinationWithOptions)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }
      const eventOptions = {
        features: {
          test_feature: true
        },
        statsContext: {} as StatsContext
      }

      const res = await destinationTest.onEvent(testEvent, testSettings, eventOptions)

      expect(res).toEqual([
        { output: 'Mappings resolved' },
        {
          output: 'Action Executed',
          data: {
            features: eventOptions.features,
            statsContext: {}
          }
        }
      ])
    })
  })

  describe('stats', () => {
    test('should not crash when stats are passed to the perform handler', async () => {
      const destinationTest = new Destination(destinationWithOptions)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }
      const eventOptions = {
        statsContext: {
          statsClient: {} as StatsClient,
          tags: []
        }
      }

      const res = await destinationTest.onEvent(testEvent, testSettings, eventOptions)

      expect(res).toEqual([
        { output: 'Mappings resolved' },
        {
          output: 'Action Executed',
          data: {
            features: {},
            statsContext: eventOptions.statsContext
          }
        }
      ])
    })
  })

  describe('logger', () => {
    test('should not crash when logger is passed to the perform handler', async () => {
      const destinationTest = new Destination(destinationWithOptions)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }
      const eventOptions = {
        features: {},
        statsContext: {} as StatsContext,
        logger: { name: 'test-integration', level: 'debug' } as Logger
      }
      const res = await destinationTest.onEvent(testEvent, testSettings, eventOptions)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        {
          output: 'Action Executed',
          data: {
            features: {},
            statsContext: {},
            logger: eventOptions.logger
          }
        }
      ])
    })
  })

  describe('transactionContext', () => {
    test('should not crash when transactionContext is passed to the perform handler', async () => {
      const destinationTest = new Destination(destinationWithOptions)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }
      const eventOptions = {
        features: {},
        statsContext: {} as StatsContext,
        logger: { name: 'test-integration', level: 'debug' } as Logger,
        transactionContext: {
          transaction: { contact_id: '801' },
          setTransaction: (key: string, value: string) => ({ [key]: value })
        } as TransactionContext
      }
      const res = await destinationTest.onEvent(testEvent, testSettings, eventOptions)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        {
          output: 'Action Executed',
          data: {
            features: {},
            statsContext: {},
            logger: eventOptions.logger,
            transactionContext: eventOptions.transactionContext
          }
        }
      ])
    })
  })

  describe('stateContext', () => {
    test('should not crash when stateContext is passed to the perform handler', async () => {
      const destinationTest = new Destination(destinationWithOptions)
      const testEvent: SegmentEvent = {
        properties: { field_one: 'test input' },
        userId: '3456fff',
        type: 'track'
      }
      const testSettings = {
        apiSecret: 'test_key',
        subscription: {
          subscribe: 'type = "track"',
          partnerAction: 'customEvent',
          mapping: {
            clientId: '23455343467',
            name: 'fancy_event',
            parameters: { field_one: 'rogue one' }
          }
        }
      }
      const eventOptions = {
        features: {},
        statsContext: {} as StatsContext,
        logger: { name: 'test-integration', level: 'debug' } as Logger,
        transactionContext: {
          transaction: { contact_id: '801' },
          setTransaction: (key: string, value: string) => ({ [key]: value })
        } as TransactionContext,
        stateContext: {
          getRequestContext: (_key: string, _cb?: (res?: string) => any): any => {},
          setResponseContext: (
            _key: string,
            _value: string,
            _ttl: { hour?: number; minute?: number; second?: number }
          ): void => {}
        } as StateContext
      }
      const res = await destinationTest.onEvent(testEvent, testSettings, eventOptions)
      expect(res).toEqual([
        { output: 'Mappings resolved' },
        {
          output: 'Action Executed',
          data: {
            features: {},
            statsContext: {},
            logger: eventOptions.logger,
            transactionContext: eventOptions.transactionContext,
            stateContext: eventOptions.stateContext
          }
        }
      ])
    })
  })

  describe('dynamicFields', () => {
    test('should return empty array if action is not part of definition', async () => {
      const destinationTest = new Destination(destinationWithDynamicFields)
      const res = await destinationTest.executeDynamicField('ghostAction', 'testDynamicField', {
        settings: {},
        payload: {}
      })
      expect(res).toEqual([])
    })

    test('should return 404 if handler for dynamic field does not exist', async () => {
      const destinationTest = new Destination(destinationWithDynamicFields)
      const res = await destinationTest.executeDynamicField('customEvent', 'randomField', {
        settings: {},
        payload: {}
      })
      expect(res).toEqual({
        choices: [],
        error: { code: '404', message: 'No dynamic field named randomField found.' },
        nextPage: ''
      })
    })

    test('should return a response with choices for string fields', async () => {
      const destinationTest = new Destination(destinationWithDynamicFields)
      const res = await destinationTest.executeDynamicField('customEvent', 'testDynamicField', {
        settings: {},
        payload: {}
      })
      expect(res).toEqual({ choices: [{ label: 'test', value: 'test' }], nextPage: '' })
    })

    test('fetches keys for unstructured objects', async () => {
      const destinationTest = new Destination(destinationWithDynamicFields)
      const res = await destinationTest.executeDynamicField('customEvent', 'testUnstructuredObject.__keys__', {
        settings: {},
        payload: {}
      })
      expect(res).toEqual({ choices: [{ label: 'Im a key', value: '🔑' }], nextPage: '' })
    })

    test('fetches values for unstructured objects', async () => {
      const destinationTest = new Destination(destinationWithDynamicFields)
      ;('testUnstructuredObject.__values__')
      let res = await destinationTest.executeDynamicField('customEvent', 'testUnstructuredObject.keyOne', {
        settings: {},
        payload: {}
      })
      expect(res).toEqual({ choices: [{ label: 'Im a value for keyOne', value: '2️⃣' }], nextPage: '' })

      res = await destinationTest.executeDynamicField('customEvent', 'testUnstructuredObject.keyTwo', {
        settings: {},
        payload: {}
      })

      expect(res).toEqual({ choices: [{ label: 'Im a value for keyTwo', value: '2️⃣' }], nextPage: '' })
    })

    test('fetches values for structured object subfields', async () => {
      const destinationTest = new Destination(destinationWithDynamicFields)
      const res = await destinationTest.executeDynamicField('customEvent', 'testStructuredObject.testDynamicSubfield', {
        settings: {},
        payload: {}
      })
      expect(res).toEqual({ choices: [{ label: 'Im a subfield', value: 'nah' }], nextPage: '' })
    })

    test('fetches values for structured array of object', async () => {
      const destinationTest = new Destination(destinationWithDynamicFields)
      let res = await destinationTest.executeDynamicField('customEvent', 'testObjectArrays.[0].testDynamicSubfield', {
        settings: {},
        payload: {}
      })
      expect(res).toEqual({ choices: [{ label: 'Im a subfield for element 0', value: 'nah' }], nextPage: '' })

      res = await destinationTest.executeDynamicField('customEvent', 'testObjectArrays.[113].testDynamicSubfield', {
        settings: {},
        payload: {}
      })
      expect(res).toEqual({ choices: [{ label: 'Im a subfield for element 113', value: 'nah' }], nextPage: '' })
    })

    test('returns 404 for invalid subfields', async () => {
      const destinationTest = new Destination(destinationWithDynamicFields)
      const res = await destinationTest.executeDynamicField('customEvent', 'testStructuredObject.ghostSubfield', {
        settings: {},
        payload: {}
      })
      expect(res).toEqual({
        choices: [],
        error: { code: '404', message: 'No dynamic field named testStructuredObject.ghostSubfield found.' },
        nextPage: ''
      })
    })
  })

  describe('Reauthentication Flow', () => {
    beforeEach(async () => {
      jest.restoreAllMocks()
      jest.resetAllMocks()
    })
    describe('onDelete', () => {
      test('should refresh the access-token in case of Unauthorized(401) and update it in Cache', async () => {
        const destinationTest = new Destination(destinationOAuth3)
        const testEvent: SegmentEvent = {
          traits: { a: 'foo' },
          userId: '3456fff',
          type: 'identify'
        }
        const testSettings = {
          apiSecret: 'test_key',
          subscription: {
            subscribe: 'type = "identify"',
            partnerAction: 'customEvent',
            mapping: {
              name: 'fancy_event123',
              advertiserId: '1231241241'
            }
          },
          oauth: {
            access_token: 'invalid-access-token',
            refresh_token: 'refresh-token'
          }
        }
        const eventOptions = {
          onTokenRefresh: async (_tokens: RefreshAccessTokenResult) => {
            jest.fn(() => Promise.resolve())
          },
          synchronizeRefreshAccessToken: async () => {
            jest.fn(() => Promise.resolve())
          }
        }
        const refreshTokenSpy = jest.spyOn(authentication, 'refreshAccessToken')
        const UpdateTokenSpy = jest.spyOn(eventOptions, 'onTokenRefresh')
        const synchronizeRefreshAccessTokenSpy = jest.spyOn(eventOptions, 'synchronizeRefreshAccessToken')
        const res = await destinationTest.onDelete?.(testEvent, testSettings, eventOptions)
        expect(res).toEqual({ output: 'Deleted' })
        expect(refreshTokenSpy).toHaveBeenCalledTimes(1)
        expect(UpdateTokenSpy).toHaveBeenCalledTimes(1)
        expect(synchronizeRefreshAccessTokenSpy).toHaveBeenCalledTimes(1)
      })

      test('should not refresh access-token in case of any non 401 error', async () => {
        const destinationTest = new Destination(destinationOAuth3)
        const testEvent: SegmentEvent = {
          properties: { a: 'foo', field_one: 'test input' },
          traits: {
            b: 'foo'
          },
          type: 'identify'
        }
        const testSettings = {
          apiSecret: 'test_key',
          subscription: {
            subscribe: 'type = "identify" and properties.a = "foo"',
            partnerAction: 'customEvent',
            mapping: {
              clientId: '23455343467',
              name: 'fancy_event'
            }
          },
          oauth: {
            access_token: 'valid-access-token',
            refresh_token: 'refresh-token'
          }
        }
        const eventOptions = {
          onTokenRefresh: async (_tokens: RefreshAccessTokenResult) => {
            jest.fn(() => Promise.resolve())
          },
          synchronizeRefreshAccessToken: async () => {
            jest.fn(() => Promise.resolve())
          }
        }
        const spy = jest.spyOn(authentication, 'refreshAccessToken')
        const UpdateTokenSpy = jest.spyOn(eventOptions, 'onTokenRefresh')
        const synchronizeRefreshAccessTokenSpy = jest.spyOn(eventOptions, 'synchronizeRefreshAccessToken')
        await expect(destinationTest.onDelete?.(testEvent, testSettings)).rejects.toThrowError()
        expect(spy).toHaveBeenCalledTimes(0)
        expect(UpdateTokenSpy).toHaveBeenCalledTimes(0)
        expect(synchronizeRefreshAccessTokenSpy).toHaveBeenCalledTimes(0)
      })
      test('should not refresh access-token if token is already valid', async () => {
        const destinationTest = new Destination(destinationOAuth3)
        const testEvent: SegmentEvent = {
          properties: { a: 'foo', field_one: 'test input' },
          traits: {
            b: 'foo'
          },
          userId: '3456fff',
          type: 'identify'
        }
        const testSettings = {
          apiSecret: 'test_key',
          subscription: {
            subscribe: 'type = "identify" and properties.a = "foo"',
            partnerAction: 'customEvent',
            mapping: {
              name: 'fancy_event',
              advertiserId: '1231241241'
            }
          },
          oauth: {
            access_token: 'valid-access-token',
            refresh_token: 'refresh-token'
          }
        }
        const spy = jest.spyOn(authentication, 'refreshAccessToken')
        const res = await destinationTest.onDelete?.(testEvent, testSettings)
        expect(res).toEqual({ output: 'Deleted' })
        expect(spy).toHaveBeenCalledTimes(0)
      })
    })
    describe('onEvent', () => {
      test('should refresh the access-token in case of Unauthorized(401) and update it in Cache', async () => {
        const destinationTest = new Destination(destinationOAuth3)
        const testEvent: SegmentEvent = {
          traits: { a: 'foo' },
          userId: '3456fff',
          type: 'identify'
        }
        const testSettings = {
          apiSecret: 'test_key',
          subscription: {
            subscribe: 'type = "identify"',
            partnerAction: 'customEvent',
            mapping: {
              name: 'fancy_event123',
              advertiserId: '1231241241'
            }
          },
          oauth: {
            access_token: 'invalid-access-token',
            refresh_token: 'refresh-token'
          }
        }

        const eventOptions = {
          onTokenRefresh: async (_tokens: RefreshAccessTokenResult) => {
            jest.fn(() => Promise.resolve())
          },
          synchronizeRefreshAccessToken: async () => {
            jest.fn(() => Promise.resolve())
          }
        }

        const refreshTokenSpy = jest.spyOn(authentication, 'refreshAccessToken')
        const UpdateTokenSpy = jest.spyOn(eventOptions, 'onTokenRefresh')
        const synchronizeRefreshAccessTokenSpy = jest.spyOn(eventOptions, 'synchronizeRefreshAccessToken')

        const res = await destinationTest.onEvent(testEvent, testSettings, eventOptions)
        expect(res).toEqual([
          { output: 'Mappings resolved' },
          { output: 'Payload validated' },
          { data: 'this is a test', output: 'Action Executed' }
        ])
        expect(refreshTokenSpy).toHaveBeenCalledTimes(1)
        expect(UpdateTokenSpy).toHaveBeenCalledTimes(1)
        expect(synchronizeRefreshAccessTokenSpy).toHaveBeenCalledTimes(1)
      })
      test('should not refresh access-token in case of any non 401 error', async () => {
        const destinationTest = new Destination(destinationOAuth3)
        const testEvent: SegmentEvent = {
          properties: { a: 'foo', field_one: 'test input' },
          traits: {
            b: 'foo'
          },
          userId: '3456fff',
          type: 'identify'
        }
        const testSettings = {
          apiSecret: 'test_key',
          subscription: {
            subscribe: 'type = "identify" and properties.a = "foo"',
            partnerAction: 'customEvent',
            mapping: {
              clientId: '23455343467',
              name: 'fancy_event'
            }
          },
          oauth: {
            access_token: 'valid-access-token',
            refresh_token: 'refresh-token'
          }
        }
        const eventOptions = {
          onTokenRefresh: async (_tokens: RefreshAccessTokenResult) => {
            jest.fn(() => Promise.resolve())
          },
          synchronizeRefreshAccessToken: async () => {
            jest.fn(() => Promise.resolve())
          }
        }

        const spy = jest.spyOn(authentication, 'refreshAccessToken')
        const UpdateTokenSpy = jest.spyOn(eventOptions, 'onTokenRefresh')
        const synchronizeRefreshAccessTokenSpy = jest.spyOn(eventOptions, 'synchronizeRefreshAccessToken')
        await expect(destinationTest.onEvent(testEvent, testSettings)).rejects.toThrowError()
        expect(spy).toHaveBeenCalledTimes(0)
        expect(UpdateTokenSpy).toHaveBeenCalledTimes(0)
        expect(synchronizeRefreshAccessTokenSpy).toHaveBeenCalledTimes(0)
      })

      test('should not refresh access-token if token is already valid', async () => {
        const destinationTest = new Destination(destinationOAuth3)
        const testEvent: SegmentEvent = {
          properties: { a: 'foo', field_one: 'test input' },
          traits: {
            b: 'foo'
          },
          userId: '3456fff',
          type: 'identify'
        }
        const testSettings = {
          apiSecret: 'test_key',
          subscription: {
            subscribe: 'type = "identify" and properties.a = "foo"',
            partnerAction: 'customEvent',
            mapping: {
              name: 'fancy_event',
              advertiserId: '1231241241'
            }
          },
          oauth: {
            access_token: 'valid-access-token',
            refresh_token: 'refresh-token'
          }
        }
        const spy = jest.spyOn(authentication, 'refreshAccessToken')
        const res = await destinationTest.onEvent(testEvent, testSettings)
        expect(res).toEqual([
          { output: 'Mappings resolved' },
          { output: 'Payload validated' },
          { data: 'this is a test', output: 'Action Executed' }
        ])
        expect(spy).toHaveBeenCalledTimes(0)
      })
    })
    describe('onBatch', () => {
      test('should refresh the access-token in case of Unauthorized(401)', async () => {
        const destinationTest = new Destination(destinationOAuth3)
        const testEvents: SegmentEvent[] = [
          {
            properties: { a: 'foo', advertiserId: 123456789 },
            userId: '3456fff',
            type: 'track'
          },
          {
            properties: { a: 'foo', advertiserId: 987654321 },
            userId: '3456fff',
            type: 'track'
          }
        ]
        const testSettings = {
          apiSecret: 'test_key',
          subscription: {
            subscribe: 'type = "track"',
            partnerAction: 'customEvent',
            mapping: {
              name: 'fancy_event123',
              advertiserId: { '@path': '$.properties.advertiserId' }
            }
          },
          oauth: {
            access_token: 'invalid-access-token',
            refresh_token: 'refresh-token'
          }
        }
        const eventOptions = {
          onTokenRefresh: async (_tokens: RefreshAccessTokenResult) => {
            jest.fn(() => Promise.resolve())
          },
          synchronizeRefreshAccessToken: async () => {
            jest.fn(() => Promise.resolve())
          }
        }

        const refreshTokenSpy = jest.spyOn(authentication, 'refreshAccessToken')
        const UpdateTokenSpy = jest.spyOn(eventOptions, 'onTokenRefresh')
        const synchronizeRefreshAccessTokenSpy = jest.spyOn(eventOptions, 'synchronizeRefreshAccessToken')
        const res = await destinationTest.onBatch(testEvents, testSettings, eventOptions)
        expect(res).toEqual([
          {
            output: 'successfully processed batch of events'
          }
        ])
        expect(refreshTokenSpy).toHaveBeenCalledTimes(1)
        expect(UpdateTokenSpy).toHaveBeenCalledTimes(1)
        expect(synchronizeRefreshAccessTokenSpy).toHaveBeenCalledTimes(1)
      })

      test('should not refresh access-token in case of any non 401 error', async () => {
        const destinationTest = new Destination(destinationOAuth3)
        const testEvents: SegmentEvent[] = [
          {
            properties: { a: 'foo', advertiserId: WRONG_ADVERTISER_ID },
            userId: '3456fff',
            type: 'track'
          }
        ]
        const testSettings = {
          apiSecret: 'test_key',
          subscription: {
            subscribe: 'type = "track"',
            partnerAction: 'customEvent',
            mapping: {
              name: 'fancy_event123',
              advertiserId: { '@path': '$.properties.advertiserId' }
            }
          },
          oauth: {
            access_token: 'valid-access-token',
            refresh_token: 'refresh-token'
          }
        }
        const eventOptions = {
          onTokenRefresh: async (_tokens: RefreshAccessTokenResult) => {
            jest.fn(() => Promise.resolve())
          },
          synchronizeRefreshAccessToken: async () => {
            jest.fn(() => Promise.resolve())
          }
        }

        const refreshTokenSpy = jest.spyOn(authentication, 'refreshAccessToken')
        const UpdateTokenSpy = jest.spyOn(eventOptions, 'onTokenRefresh')
        const synchronizeRefreshAccessTokenSpy = jest.spyOn(eventOptions, 'synchronizeRefreshAccessToken')
        await expect(destinationTest.onBatch(testEvents, testSettings)).rejects.toThrowError()
        expect(refreshTokenSpy).toHaveBeenCalledTimes(0)
        expect(UpdateTokenSpy).toHaveBeenCalledTimes(0)
        expect(synchronizeRefreshAccessTokenSpy).toHaveBeenCalledTimes(0)
      })
      test('should not refresh access-token if token is already valid', async () => {
        const destinationTest = new Destination(destinationOAuth3)
        const testEvents: SegmentEvent[] = [
          {
            properties: { a: 'foo', advertiserId: 123456789 },
            userId: '3456fff',
            type: 'track'
          },
          {
            properties: { a: 'foo', advertiserId: 987654321 },
            userId: '3456fff',
            type: 'track'
          }
        ]
        const testSettings = {
          apiSecret: 'test_key',
          subscription: {
            subscribe: 'type = "track"',
            partnerAction: 'customEvent',
            mapping: {
              name: 'fancy_event123',
              advertiserId: { '@path': '$.properties.advertiserId' }
            }
          },
          oauth: {
            access_token: 'valid-access-token',
            refresh_token: 'refresh-token'
          }
        }
        const spy = jest.spyOn(authentication, 'refreshAccessToken')
        const res = await destinationTest.onBatch(testEvents, testSettings)
        expect(res).toEqual([
          {
            output: 'successfully processed batch of events'
          }
        ])
        expect(spy).toHaveBeenCalledTimes(0)
      })
    })
    describe('createAudience', () => {
      test('Refreshes the access-token in case of Unauthorized(401)', async () => {
        const createAudienceInput = {
          audienceName: 'Test Audience',
          settings: {
            oauth: {
              clientId: 'valid-client-id',
              clientSecret: 'valid-client-secret',
              access_token: 'invalid-access-token',
              refresh_token: 'refresh-token',
              token_type: 'bearer'
            }
          },
          audienceSettings: {
            advertiserId: '12334745462532'
          }
        }
        const destinationTest = new Destination(audienceDestination)
        const spy = jest.spyOn(authentication, 'refreshAccessToken')
        const res = await destinationTest.createAudience(createAudienceInput)
        expect(res).toEqual({ externalId: '123456789' })
        expect(spy).toHaveBeenCalledTimes(1)
      })

      test('should not refresh access-token in case of any non 401 error', async () => {
        const createAudienceInput = {
          audienceName: 'Test Audience',
          settings: {
            oauth: {
              clientId: 'valid-client-id',
              clientSecret: 'valid-client-secret',
              access_token: 'access-token',
              refresh_token: 'refresh-token',
              token_type: 'bearer'
            }
          },
          audienceSettings: {}
        }
        const destinationTest = new Destination(audienceDestination)
        const spy = jest.spyOn(authentication, 'refreshAccessToken')
        await expect(destinationTest.createAudience(createAudienceInput)).rejects.toThrowError()
        expect(spy).not.toHaveBeenCalled()
      })

      test('should not refresh access-token if token is already valid', async () => {
        const createAudienceInput = {
          audienceName: 'Test Audience',
          settings: {
            oauth: {
              clientId: 'valid-client-id',
              clientSecret: 'valid-client-secret',
              access_token: 'valid-access-token',
              refresh_token: 'refresh-token',
              token_type: 'bearer'
            }
          },
          audienceSettings: {
            advertiserId: '12334745462532'
          }
        }

        const destinationTest = new Destination(audienceDestination)
        const spy = jest.spyOn(authentication, 'refreshAccessToken')
        const res = await destinationTest.createAudience(createAudienceInput)
        expect(res).toEqual({ externalId: '123456789' })
        expect(spy).not.toHaveBeenCalled()
      })

      test('should not refresh the access-token for non-Oauth authentication scheme', async () => {
        const createAudienceInput = {
          audienceName: 'Test Audience',
          settings: {
            oauth: {
              clientId: 'invalid_client_id',
              clientSecret: 'valid-client-secret'
            }
          },
          audienceSettings: {
            advertiserId: '12334745462532'
          }
        }
        // Non-Oauth authentication scheme
        audienceDestination.authentication = {
          scheme: 'custom',
          fields: {}
        }
        const destinationTest = new Destination(audienceDestination)
        const spy = jest.spyOn(authentication, 'refreshAccessToken')
        await expect(destinationTest.createAudience(createAudienceInput)).rejects.toThrowError()
        expect(spy).not.toHaveBeenCalled()
      })
    })
    describe('getAudience', () => {
      test('Refreshes the access-token in case of Unauthorized(401)', async () => {
        const getAudienceInput = {
          externalId: '366170701270726115',
          settings: {
            oauth: {
              clientId: 'valid-client-id',
              clientSecret: 'valid-client-secret',
              access_token: 'invalid-access-token',
              refresh_token: 'refresh-token',
              token_type: 'bearer'
            }
          }
        }
        audienceDestination.authentication = authentication
        const destinationTest = new Destination(audienceDestination)
        const spy = jest.spyOn(authentication, 'refreshAccessToken')
        const res = await destinationTest.getAudience(getAudienceInput)
        expect(res).toEqual({ externalId: '366170701270726115' })
        expect(spy).toHaveBeenCalledTimes(1)
      })

      test('should not refresh access-token in case of any non 401 error', async () => {
        const getAudienceInput = {
          externalId: WRONG_AUDIENCE_ID,
          settings: {
            oauth: {
              clientId: 'valid-client-id',
              clientSecret: 'valid-client-secret',
              access_token: 'valid-access-token',
              refresh_token: 'refresh-token',
              token_type: 'bearer'
            }
          }
        }
        const destinationTest = new Destination(audienceDestination)
        const spy = jest.spyOn(authentication, 'refreshAccessToken')
        await expect(destinationTest.getAudience(getAudienceInput)).rejects.toThrowError()
        expect(spy).not.toHaveBeenCalled()
      })

      test('should not refresh access-token if token is already valid', async () => {
        const getAudienceInput = {
          externalId: '366170701270726115',
          settings: {
            oauth: {
              clientId: 'valid-client-id',
              clientSecret: 'valid-client-secret',
              access_token: 'valid-access-token',
              refresh_token: 'refresh-token',
              token_type: 'bearer'
            }
          }
        }
        const destinationTest = new Destination(audienceDestination)
        const spy = jest.spyOn(authentication, 'refreshAccessToken')
        const res = await destinationTest.getAudience(getAudienceInput)
        expect(res).toEqual({ externalId: '366170701270726115' })
        expect(spy).not.toHaveBeenCalled()
      })

      test('should not refresh the access-token for non-Oauth authentication scheme', async () => {
        const getAudienceInput = {
          externalId: '366170701270726115',
          settings: {
            oauth: {
              clientId: 'invalid_client_id',
              clientSecret: 'valid-client-secret'
            }
          }
        }

        // Non-Oauth authentication scheme
        audienceDestination.authentication = {
          scheme: 'custom',
          fields: {}
        }
        const destinationTest = new Destination(audienceDestination)
        const spy = jest.spyOn(authentication, 'refreshAccessToken')
        await expect(destinationTest.getAudience(getAudienceInput)).rejects.toThrowError()
        expect(spy).not.toHaveBeenCalled()
      })
    })
  })
})
