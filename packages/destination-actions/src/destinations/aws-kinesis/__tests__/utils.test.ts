import { buildRecords } from '../utils'

jest.mock('@aws-sdk/client-kinesis', () => ({
  KinesisClient: jest.fn(),
  PutRecordsCommand: jest.fn()
}))

jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn(),
  AssumeRoleCommand: jest.fn()
}))

describe('AWS Kinesis Utils', () => {
  describe('buildRecords', () => {
    it('should build records from payloads', () => {
      const payloads = [
        {
          payload: { key: 'value', nested: { a: 1 } },
          partitionKey: 'test-key',
          streamName: 'test-stream',
          region: 'us-west-2',
          enable_batching: true
        }
      ]

      const records = buildRecords(payloads)

      expect(records).toHaveLength(1)
      expect(records[0].PartitionKey).toBe('test-key')

      const decoded = JSON.parse(new TextDecoder().decode(records[0].Data))
      expect(decoded).toEqual({ key: 'value', nested: { a: 1 } })
    })

    it('should throw when partitionKey is missing', () => {
      const payloads = [
        {
          payload: { key: 'value' },
          partitionKey: undefined,
          streamName: 'test-stream',
          region: 'us-west-2',
          enable_batching: true
        }
      ]

      expect(() => buildRecords(payloads as any)).toThrow('partitionKey is required')
    })

    it('should handle multiple payloads', () => {
      const payloads = [
        {
          payload: { event: 'first' },
          partitionKey: 'key-1',
          streamName: 'test-stream',
          region: 'us-west-2',
          enable_batching: true
        },
        {
          payload: { event: 'second' },
          partitionKey: 'key-2',
          streamName: 'test-stream',
          region: 'us-west-2',
          enable_batching: true
        }
      ]

      const records = buildRecords(payloads)

      expect(records).toHaveLength(2)
      expect(records[0].PartitionKey).toBe('key-1')
      expect(records[1].PartitionKey).toBe('key-2')
    })
  })
})
