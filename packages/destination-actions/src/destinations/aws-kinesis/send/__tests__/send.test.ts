import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index' // this imports your action definition file
import * as utils from '../utils'

const testDestination = createTestIntegration(Definition)

describe('AWS Kinesis Action', () => {
  const mockSendDataToKinesis = jest.spyOn(utils, 'sendDataToKinesis').mockResolvedValue(undefined)

  const settings = {
    iamRoleArn: 'arn:aws:iam::123456789012:role/testRole',
    iamExternalId: 'external-id'
  }

  const payload = {
    payload: { event: 'Test Event', properties: { foo: 'bar' } },
    partitionKey: 'abc123',
    streamName: 'test-stream',
    awsRegion: 'us-east-1'
  }

  const logger = { info: jest.fn(), crit: jest.fn(), warn: jest.fn() }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('perform', () => {
    it('calls sendDataToKinesis with a single payload', async () => {
      await testDestination.testAction('send', {
        mapping: payload,
        settings,
        logger
      })

      expect(mockSendDataToKinesis).toHaveBeenCalledTimes(1)
      expect(mockSendDataToKinesis).toHaveBeenCalledWith(
        settings,
        [expect.objectContaining(payload)], // should be wrapped in array
        expect.anything(), // statsContext
        logger
      )
    })
  })

  describe('performBatch', () => {
    it('calls sendDataToKinesis with multiple payloads', async () => {
      const payloads = [payload, payload]

      await testDestination.testBatchAction('send', {
        mappings: payloads,
        settings,
        logger
      })

      expect(mockSendDataToKinesis).toHaveBeenCalledTimes(1)
      expect(mockSendDataToKinesis).toHaveBeenCalledWith(
        settings,
        expect.arrayContaining(payloads),
        expect.anything(), // statsContext
        logger
      )
    })
  })
})
