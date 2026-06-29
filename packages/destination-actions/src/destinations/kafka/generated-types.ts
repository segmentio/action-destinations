// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The client ID for your Kafka instance. Defaults to 'segment-actions-kafka-producer'.
   */
  clientId: string
  /**
   * The brokers for your Kafka instance, in the format of `host:port`. E.g. localhost:9092. Accepts a comma delimited string.
   */
  brokers: string
  /**
   * Select the Authentication Mechanism to use. For SCRAM or PLAIN populate the 'Username' and 'Password' fields. For 'Client Certificate' populated the 'SSL Client Key' and 'SSL Client Certificate' fields
   */
  mechanism: string
  /**
   * The username for your Kafka instance. Should be populated only if using PLAIN or SCRAM Authentication Mechanisms.
   */
  username?: string
  /**
   * The password for your Kafka instance. Should only be populated if using PLAIN or SCRAM Authentication Mechanisms.
   */
  password?: string
  /**
   * Indicates if SSL should be enabled.
   */
  ssl_enabled?: boolean
  /**
   * The Certificate Authority for your Kafka instance. Exclude the first and last lines from the file. i.e `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`.
   */
  ssl_ca?: string
  /**
   * The Client Key for your Kafka instance. Exclude the first and last lines from the file. i.e `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`.
   */
  ssl_key?: string
  /**
   * The Certificate Authority for your Kafka instance. Exclude the first and last lines from the file. i.e `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`.
   */
  ssl_cert?: string
  /**
   * Whether to reject unauthorized CAs or not. This can be useful when testing, but is unadvised in Production.
   */
  ssl_reject_unauthorized_ca?: boolean
}
