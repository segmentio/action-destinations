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
   * The Authentication Mechanism for your Kafka instance. For SCRAM or PLAIN you must provide values for the 'Username' and 'Password' fields. For AWS IAM, you must provide values for the 'AWS Access Key ID' and 'AWS Secret Key' fields. For 'Client Certificate' you must provide values for the 'SSL Client Key' and 'SSL Client Certificate' fields
   */
  mechanism: string
  /**
   * The partitioner type for your Kafka instance. Defaults to 'Default Partitioner'.
   */
  partitionerType: string
  /**
   * The username for your Kafka instance. Should be populated only if using PLAIN or SCRAM Authentication Mechanisms.
   */
  username?: string
  /**
   * The password for your Kafka instance. Should only be populated if using PLAIN or SCRAM Authentication Mechanisms.
   */
  password?: string
  /**
   * The Access Key ID for your AWS IAM instance. Must be populated if using AWS IAM Authentication Mechanism.
   */
  accessKeyId?: string
  /**
   * The Secret Key for your AWS IAM instance. Must be populated if using AWS IAM Authentication Mechanism.
   */
  secretAccessKey?: string
  /**
   * AWS IAM role ARN used for authorization. This field is optional, and should only be populated if using the AWS IAM Authentication Mechanism.
   */
  authorizationIdentity?: string
  /**
   * Indicates if SSL should be enabled.
   */
  ssl_enabled: boolean
  /**
   * The Certificate Authority for your Kafka instance. Do not include the `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----` lines.
   */
  ssl_ca?: string
  /**
   * The Client Key for your Kafka instance. Do not include the `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----` lines.
   */
  ssl_key?: string
  /**
   * The Certificate Authority for your Kafka instance. Do not include the `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----` lines.
   */
  ssl_cert?: string
  /**
   * Whether to reject unauthorized CAs or not. This can be useful when testing, but is unadvised in Production.
   */
  ssl_reject_unauthorized_ca: boolean
}
