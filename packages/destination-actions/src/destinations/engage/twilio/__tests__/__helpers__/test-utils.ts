import { Logger } from '@segment/actions-core/destination-kit'
import { omit } from '@segment/actions-core/omit'
import { createMessagingTestEvent } from '../../../../../lib/engage-test-data/create-messaging-test-event'
import { FLAGON_NAME_LOG_ERROR, FLAGON_NAME_LOG_INFO } from '../../../utils'
import { createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Twilio from '../..'
import { loggerMock } from './test-utils'

export * from '../../../utils/testUtils'

const twilio = createTestIntegration(Twilio)
afterEach(() => {
  twilio.responses = []
  jest.clearAllMocks()
  nock.cleanAll()
})

interface CreateTestActionArgs {
  action: string
  environment: string
  timestamp?: string
  spaceId: string
  getMapping: (context: CreateTestActionArgs) => any
  getSettings?: (context: CreateTestActionArgs) => any
  features?: any
  logger?: Logger
}

interface TestActionArgs {
  mappingOverrides?: any | null
  mappingOmitKeys?: string[] | null
  settingsOverrides?: any
  features?: any
  logger?: Logger
}

export function createTestAction({
  action,
  environment,
  timestamp,
  spaceId,
  logger,
  features,
  getMapping,
  getSettings
}: CreateTestActionArgs) {
  // eslint-disable-next-line prefer-rest-params
  const args = arguments[0] as CreateTestActionArgs
  timestamp = timestamp ?? new Date().toISOString()

  return ({ mappingOverrides, mappingOmitKeys, settingsOverrides, ...restOverrides }: TestActionArgs = {}) => {
    const mapping = {
      ...getMapping(args),
      ...mappingOverrides
    }
    const settings = getSettings
      ? getSettings(args)
      : {
          spaceId,
          sourceId: 'e',
          twilioAccountSID: 'a',
          twilioApiKeySID: 'f',
          twilioApiKeySecret: 'b',
          profileApiEnvironment: environment,
          profileApiAccessToken: 'c'
        }

    return twilio.testAction(action, {
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
