// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The brokers for your Kafka instance, in the format of `host:port`, separated by commas.
   */
  brokers: string
  /**
   * The SASL Authentication Mechanism for your Kafka instance.
   */
  saslAuthenticationMechanism: string
  /**
   * The topic where Segment should send messages to.
   */
  topic: string
  /**
   * The username for your Kafka instance.
   */
  username: string
  /**
   * The password for your Kafka instance.
   */
  password: string
}
