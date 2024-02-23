// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The brokers for your Kafka instance, in the format of `host:port`. Accepts an array or strings or a single string.
   */
  brokers: string[]
  /**
   * The SASL Authentication Mechanism for your Kafka instance.
   */
  saslAuthenticationMechanism: string
  /**
   * The client ID for your Kafka instance. Defaults to "segment-actions-kafka-producer".
   */
  clientId: string
  /**
   * The username for your Kafka instance.
   */
  username: string
  /**
   * The password for your Kafka instance.
   */
  password: string
}
