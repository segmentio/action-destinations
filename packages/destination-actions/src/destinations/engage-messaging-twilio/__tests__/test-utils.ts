import { Logger } from '@segment/actions-core/src/destination-kit'
import { omit } from '@segment/actions-core'
import { createMessagingTestEvent } from '../../../lib/engage-test-data/create-messaging-test-event'
import { FLAGON_NAME_LOG_ERROR, FLAGON_NAME_LOG_INFO } from '../utils/message-sender'
import { createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Twilio from '..'

const twilio = createTestIntegration(Twilio)
afterEach(() => {
  twilio.responses = []
  jest.clearAllMocks()
  nock.cleanAll()
})

function createLoggerMock() {
  return {
    level: 'error',
    name: 'test',
    error: jest.fn() as Logger['error'],
    info: jest.fn() as Logger['info']
  } as Logger
}

export const loggerMock = createLoggerMock()

interface CreateTestActionArgs {
  action: string
  environment: string
  timestamp: string
  spaceId: string
  logger?: Logger
  getMapping: (context: CreateTestActionArgs) => any

  getSettings?: (context: CreateTestActionArgs) => any
  features?: any
}

interface TestActionArgs {
  mappingOverrides?: any | null
  mappingOmitKeys?: string[] | null
  settingsOverrides?: any
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
  const ctx = arguments[0] as CreateTestActionArgs
  return ({ mappingOverrides, mappingOmitKeys: mappingOmitKeys, settingsOverrides }: TestActionArgs = {}) => {
    const mapping = {
      ...getMapping(ctx),
      ...mappingOverrides
    }
    const settings = getSettings
      ? getSettings(ctx)
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
      logger: logger || loggerMock,
      features: features || { [FLAGON_NAME_LOG_INFO]: true, [FLAGON_NAME_LOG_ERROR]: true }
    })
  }
}

export function twilioTestAction(action: string, payload: any) {
  return twilio.testAction(action, payload)
}
