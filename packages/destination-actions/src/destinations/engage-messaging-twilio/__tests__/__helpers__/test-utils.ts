import { EngageDestinationCache, Logger } from '@segment/actions-core/destination-kit'
import { omit } from '@segment/actions-core'
import { createMessagingTestEvent } from '../../../../lib/engage-test-data/create-messaging-test-event'
import { FLAGON_NAME_LOG_ERROR, FLAGON_NAME_LOG_INFO, getTestLoggerUtils } from '@segment/actions-shared'
import { createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Twilio from '../..'

export const { expectErrorLogged, expectInfoLogged, loggerMock } = getTestLoggerUtils()

const twilio = createTestIntegration(Twilio)
afterEach(() => {
  twilio.responses = []
  jest.clearAllMocks()
  nock.cleanAll()
})

interface CreateTestActionArgs {
  /** The action to test */
  action: string
  engageDestinationCache?: EngageDestinationCache
  /** The environment to test in */
  environment: string
  features?: any
  getMapping: (context: CreateTestActionArgs) => any
  getSettings?: (context: CreateTestActionArgs) => any
  /** The logger to use */
  logger?: Logger
  /** The space ID to use */
  spaceId: string
  /** The timestamp to use */
  timestamp?: string
}

interface TestActionArgs {
  /** The mapping overrides */
  mappingOverrides?: any | null
  /** The mapping keys to omit */
  mappingOmitKeys?: string[] | null
  /** The settings overrides */
  settingsOverrides?: any
  features?: any
  /** The logger override */
  logger?: Logger
}

const defautlSettings = Object.freeze({
  sourceId: 'e',
  twilioAccountSID: 'a',
  twilioApiKeySID: 'f',
  twilioApiKeySecret: 'b',
  profileApiAccessToken: 'c'
})

/**
 * Testing abstraction for setting up a test action. Returns a function that can be used to execute the test action.
 *
 * _This function is a higher order function._
 */
export function createTestAction(args: CreateTestActionArgs) {
  // Extracting the raw values to be used in the inner function.
  const { action, engageDestinationCache, environment, spaceId, logger, features, getMapping, getSettings } = args
  const timestamp = args.timestamp ?? new Date().toISOString()

  /**
   * The function that will execute the test action with overrides.
   */
  return ({ mappingOverrides, mappingOmitKeys, settingsOverrides, ...restOverrides }: TestActionArgs = {}) => {
    // Combine the mapping and settings with the overrides.
    const mapping = {
      ...getMapping(args),
      ...mappingOverrides
    }
    let settings = {
      profileApiEnvironment: environment,
      spaceId,
      ...defautlSettings
    }
    if (getSettings) {
      settings = getSettings(args)
    }

    return twilio.testAction(action, {
      engageDestinationCache,
      event: createMessagingTestEvent({
        timestamp,
        event: 'Audience Entered',
        userId: 'jane'
      }),
      settings: {
        ...settings,
        ...settingsOverrides
      },
      mapping: mappingOmitKeys ? omit(mapping, mappingOmitKeys) : mapping,
      logger: 'logger' in restOverrides ? restOverrides.logger : logger || loggerMock,
      features:
        'features' in restOverrides
          ? restOverrides.features
          : features || { [FLAGON_NAME_LOG_INFO]: true, [FLAGON_NAME_LOG_ERROR]: true }
    })
  }
}
