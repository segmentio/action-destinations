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

export function createLoggerMock() {
  return {
    level: 'error',
    name: 'test',
    error: jest.fn() as Logger['error'],
    info: jest.fn() as Logger['info']
  } as Logger
}

interface GetPhoneMessageInputGeneratorProps {
  action: string
  environment: string
  timestamp: string
  spaceId: string
  logger: Logger
  getDefaultMapping: () => any

  getDefaultSettings?: () => any
}

interface GetInputDataProps {
  mappingOverrides?: any | null
  omitKeys?: string[] | null
  settingsOverrides?: any
}

export function getPhoneMessageInputDataGenerator({
  action,
  environment,
  timestamp,
  spaceId,
  logger,
  getDefaultMapping,
  getDefaultSettings
}: GetPhoneMessageInputGeneratorProps) {
  return ({ mappingOverrides, omitKeys, settingsOverrides }: GetInputDataProps = {}) => {
    const mapping = {
      ...getDefaultMapping(),
      ...mappingOverrides
    }

    return twilio.testAction(action, {
      event: createMessagingTestEvent({
        timestamp,
        event: 'Audience Entered',
        userId: 'jane'
      }),
      settings: {
        ...(getDefaultSettings
          ? getDefaultSettings()
          : {
              spaceId,
              sourceId: 'e',
              twilioAccountSID: 'a',
              twilioApiKeySID: 'f',
              twilioApiKeySecret: 'b',
              profileApiEnvironment: environment,
              profileApiAccessToken: 'c'
            }),
        ...settingsOverrides
      },
      mapping: omitKeys ? omit(mapping, omitKeys) : mapping,
      logger,
      features: { [FLAGON_NAME_LOG_INFO]: true, [FLAGON_NAME_LOG_ERROR]: true }
    })
  }
}

export function twilioTestAction(action: string, payload: any) {
  return twilio.testAction(action, payload)
}
