import { Logger } from '@segment/actions-core/src/destination-kit'
import { omit } from '@segment/actions-core'
import { createMessagingTestEvent } from '../../../lib/engage-test-data/create-messaging-test-event'

export function createLoggerMock() {
  return {
    level: 'error',
    name: 'test',
    error: jest.fn() as Logger['error'],
    info: jest.fn() as Logger['info']
  } as Logger
}

interface GetPhoneMessageInputGeneratorProps {
  environment: string
  timestamp: string
  spaceId: string
  logger: Logger
  getDefaultMapping: (overrides: any) => any
}

interface GetInputDataProps {
  mappingOverrides?: any | null
  omitKeys?: string[] | null
  settingsOverrides?: any
}

export const getPhoneMessageInputDataGenerator =
  ({ environment, timestamp, spaceId, logger, getDefaultMapping }: GetPhoneMessageInputGeneratorProps) =>
  ({ mappingOverrides, omitKeys, settingsOverrides }: GetInputDataProps = {}) => ({
    event: createMessagingTestEvent({
      timestamp,
      event: 'Audience Entered',
      userId: 'jane'
    }),
    settings: {
      twilioAccountSID: 'a',
      twilioApiKeySID: 'f',
      twilioApiKeySecret: 'b',
      profileApiEnvironment: environment,
      profileApiAccessToken: 'c',
      spaceId,
      sourceId: 'e',
      ...settingsOverrides
    },
    mapping: omitKeys ? omit(getDefaultMapping(mappingOverrides), omitKeys) : getDefaultMapping(mappingOverrides),
    logger
  })
