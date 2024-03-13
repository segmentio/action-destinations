// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The brokers for your Kafka instance, in the format of `host:port`. E.g. localhost:9092. Accepts a comma delimited string.
   */
  brokers: string
  /**
   * The Authentication Mechanism for your Kafka instance.
   */
  mechanism: string
  /**
   * The client ID for your Kafka instance. Defaults to 'segment-actions-kafka-producer'.
   */
  clientId: string
  /**
   * The username for your Kafka instance. If using AWS IAM Authentication this should be your AWS Access Key ID.
   */
  username: string
  /**
   * The password for your Kafka instance. If using AWS IAM Authentication this should be your AWS Secret Key.
   */
  password: string
  /**
   * The partitioner type for your Kafka instance. Defaults to 'Default Partitioner'.
   */
  partitionerType: string
  /**
   * The aws:userid of the AWS IAM identity. Required if 'SASL Authentication Mechanism' field is set to 'AWS IAM'.
   */
  authorizationIdentity?: string
  /**
   * Indicates the type of SSL to be used.
   */
  ssl: string
}
