export const PRODUCER_TTL_MS = Number(process.env.KAFKA_PRODUCER_TTL_MS) || 0.5 * 60 * 1000 // defaults to 30 seconds

export const PRODUCER_REQUEST_TIMEOUT_MS = Number(process.env.KAFKA_PRODUCER_REQUEST_TIMEOUT_MS) || 10 * 1000 // defaults to 10 seconds

export const FLAGON_NAME = 'actions-kafka-optimize-connection'

export const CONNECTIONS_CACHE_SIZE = 500

export const KAFKAJS_ERRORS_TO_HTTP_STATUS: Record<string, number> = {
  KafkaJSNonRetriableError: 400,
  KafkaJSPartialMessageError: 400,
  KafkaJSBrokerNotFound: 404,
  KafkaJSProtocolError: 400,
  KafkaJSConnectionError: 500,
  KafkaJSConnectionClosedError: 500,
  KafkaJSRequestTimeoutError: 408,
  KafkaJSSASLAuthenticationError: 401,
  KafkaJSNumberOfRetriesExceeded: 429,
  KafkaJSOffsetOutOfRange: 400,
  KafkaJSMemberIdRequired: 400,
  KafkaJSGroupCoordinatorNotFound: 404,
  KafkaJSNotImplemented: 501,
  KafkaJSMetadataNotLoaded: 503,
  KafkaJSTopicMetadataNotLoaded: 503,
  KafkaJSStaleTopicMetadataAssignment: 409,
  KafkaJSDeleteGroupsError: 500,
  KafkaJSTimeout: 408,
  KafkaJSLockTimeout: 408,
  KafkaJSServerDoesNotSupportApiKey: 501,
  KafkaJSUnsupportedMagicByteInMessageSet: 400,
  KafkaJSDeleteTopicRecordsError: 500,
  KafkaJSInvariantViolation: 500,
  KafkaJSInvalidVarIntError: 400,
  KafkaJSInvalidLongError: 400,
  KafkaJSCreateTopicError: 400,
  KafkaJSAggregateError: 500,
  KafkaJSFetcherRebalanceError: 409,
  KafkaJSNoBrokerAvailableError: 503,
  KafkaJSAlterPartitionReassignmentsError: 500
}
