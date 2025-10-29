// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The data to send to AWS Kinesis
   */
  payload: {
    [k: string]: unknown
  }
  /**
   * The partition key to use for the record
   */
  partitionKey: string
  /**
   * The name of the Kinesis stream to send records to
   */
  streamName: string
  /**
   * The AWS region where the Kinesis stream is located
   */
  awsRegion: string
}
