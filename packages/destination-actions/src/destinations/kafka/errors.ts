import { KafkaJSError } from 'kafkajs'
import { IntegrationError, RetryableError, RequestClient, Response } from '@segment/actions-core'
import { TopicMessages } from './types'

export type KafkaResponse = {
  kafkaStatus: string
  kafkaStatusCode: number
  isRetryableError: boolean
  httpResponseCode: number
  httpResponseMessage: string
}

// https://kafka.apache.org/11/protocol.html#protocol_error_codes
export const KafkaErrorMap = new Map<number, KafkaResponse>([
  [
    -1,
    {
      kafkaStatus: 'UNKNOWN_SERVER_ERROR',
      kafkaStatusCode: -1,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'The server experienced an unexpected error when processing the request.'
    }
  ],
  [
    0,
    {
      kafkaStatus: 'NONE',
      kafkaStatusCode: 0,
      isRetryableError: false,
      httpResponseCode: 200,
      httpResponseMessage: 'Message sent successfully.'
    }
  ],
  [
    1,
    {
      kafkaStatus: 'OFFSET_OUT_OF_RANGE',
      kafkaStatusCode: 1,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'The requested offset is not within the range of offsets maintained by the server.'
    }
  ],
  [
    2,
    {
      kafkaStatus: 'CORRUPT_MESSAGE',
      kafkaStatusCode: 2,
      isRetryableError: true,
      httpResponseCode: 400,
      httpResponseMessage: 'This message has failed its CRC checksum, exceeds the valid size, or is otherwise corrupt.'
    }
  ],
  [
    3,
    {
      kafkaStatus: 'UNKNOWN_TOPIC_OR_PARTITION',
      kafkaStatusCode: 3,
      isRetryableError: true,
      httpResponseCode: 404,
      httpResponseMessage: 'This server does not host this topic-partition.'
    }
  ],
  [
    4,
    {
      kafkaStatus: 'INVALID_FETCH_SIZE',
      kafkaStatusCode: 4,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'The requested fetch size is invalid.'
    }
  ],
  [
    5,
    {
      kafkaStatus: 'LEADER_NOT_AVAILABLE',
      kafkaStatusCode: 5,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage:
        'There is no leader for this topic-partition as we are in the middle of a leadership election.'
    }
  ],
  [
    6,
    {
      kafkaStatus: 'NOT_LEADER_FOR_PARTITION',
      kafkaStatusCode: 6,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'This server is not the leader for that topic-partition.'
    }
  ],
  [
    7,
    {
      kafkaStatus: 'REQUEST_TIMED_OUT',
      kafkaStatusCode: 7,
      isRetryableError: true,
      httpResponseCode: 408,
      httpResponseMessage: 'The request timed out.'
    }
  ],
  [
    8,
    {
      kafkaStatus: 'BROKER_NOT_AVAILABLE',
      kafkaStatusCode: 8,
      isRetryableError: false,
      httpResponseCode: 503,
      httpResponseMessage: 'The broker is not available.'
    }
  ],
  [
    9,
    {
      kafkaStatus: 'REPLICA_NOT_AVAILABLE',
      kafkaStatusCode: 9,
      isRetryableError: false,
      httpResponseCode: 503,
      httpResponseMessage: 'The replica is not available for the requested topic-partition.'
    }
  ],
  [
    10,
    {
      kafkaStatus: 'MESSAGE_TOO_LARGE',
      kafkaStatusCode: 10,
      isRetryableError: false,
      httpResponseCode: 413,
      httpResponseMessage: 'The request included a message larger than the max message size the server will accept.'
    }
  ],
  [
    11,
    {
      kafkaStatus: 'STALE_CONTROLLER_EPOCH',
      kafkaStatusCode: 11,
      isRetryableError: false,
      httpResponseCode: 503,
      httpResponseMessage: 'The controller moved to another broker.'
    }
  ],
  [
    12,
    {
      kafkaStatus: 'OFFSET_METADATA_TOO_LARGE',
      kafkaStatusCode: 12,
      isRetryableError: false,
      httpResponseCode: 413,
      httpResponseMessage: 'The metadata field of the offset request was too large.'
    }
  ],
  [
    13,
    {
      kafkaStatus: 'NETWORK_EXCEPTION',
      kafkaStatusCode: 13,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'The server disconnected before a response was received.'
    }
  ],
  [
    14,
    {
      kafkaStatus: 'COORDINATOR_LOAD_IN_PROGRESS',
      kafkaStatusCode: 14,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: "The coordinator is loading and hence can't process requests."
    }
  ],
  [
    15,
    {
      kafkaStatus: 'COORDINATOR_NOT_AVAILABLE',
      kafkaStatusCode: 15,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'The coordinator is not available.'
    }
  ],
  [
    16,
    {
      kafkaStatus: 'NOT_COORDINATOR',
      kafkaStatusCode: 16,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'Not coordinator for group'
    }
  ],
  [
    17,
    {
      kafkaStatus: 'INVALID_TOPIC_EXCEPTION',
      kafkaStatusCode: 17,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'The request attempted to perform an operation on an invalid topic.'
    }
  ],
  [
    18,
    {
      kafkaStatus: 'RECORD_LIST_TOO_LARGE',
      kafkaStatusCode: 18,
      isRetryableError: false,
      httpResponseCode: 413,
      httpResponseMessage: 'The request included message batch larger than the configured segment size on the server.'
    }
  ],
  [
    19,
    {
      kafkaStatus: 'NOT_ENOUGH_REPLICAS',
      kafkaStatusCode: 19,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'Messages are rejected since there are fewer in-sync replicas than required.'
    }
  ],
  [
    20,
    {
      kafkaStatus: 'NOT_ENOUGH_REPLICAS_AFTER_APPEND',
      kafkaStatusCode: 20,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'Messages are written to the log, but to fewer in-sync replicas than required.'
    }
  ],
  [
    21,
    {
      kafkaStatus: 'INVALID_REQUIRED_ACKS',
      kafkaStatusCode: 21,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Produce request specified an invalid value for required acks.'
    }
  ],
  [
    22,
    {
      kafkaStatus: 'ILLEGAL_GENERATION',
      kafkaStatusCode: 22,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Specified group generation id is not valid.'
    }
  ],
  [
    23,
    {
      kafkaStatus: 'INCONSISTENT_GROUP_PROTOCOL',
      kafkaStatusCode: 23,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage:
        "The group member's supported protocols are incompatible with those of existing members or first group member tried to join with empty protocol type or empty protocol list."
    }
  ],
  [
    24,
    {
      kafkaStatus: 'INVALID_GROUP_ID',
      kafkaStatusCode: 24,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'The configured groupId is invalid'
    }
  ],
  [
    25,
    {
      kafkaStatus: 'UNKNOWN_MEMBER_ID',
      kafkaStatusCode: 25,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'The coordinator is not aware of this member.'
    }
  ],
  [
    26,
    {
      kafkaStatus: 'INVALID_SESSION_TIMEOUT',
      kafkaStatusCode: 26,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage:
        'The session timeout is not within the range allowed by the broker (as configured by group.min.session.timeout.ms and group.max.session.timeout.ms).'
    }
  ],
  [
    27,
    {
      kafkaStatus: 'REBALANCE_IN_PROGRESS',
      kafkaStatusCode: 27,
      isRetryableError: false,
      httpResponseCode: 503,
      httpResponseMessage: 'The group is rebalancing, so a rejoin is needed.'
    }
  ],
  [
    28,
    {
      kafkaStatus: 'INVALID_COMMIT_OFFSET_SIZE',
      kafkaStatusCode: 28,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'The committing offset data size is not valid'
    }
  ],
  [
    29,
    {
      kafkaStatus: 'TOPIC_AUTHORIZATION_FAILED',
      kafkaStatusCode: 29,
      isRetryableError: false,
      httpResponseCode: 403,
      httpResponseMessage: 'Not authorized to access topics: [Topic authorization failed.]'
    }
  ],
  [
    30,
    {
      kafkaStatus: 'GROUP_AUTHORIZATION_FAILED',
      kafkaStatusCode: 30,
      isRetryableError: false,
      httpResponseCode: 403,
      httpResponseMessage: 'Not authorized to access group: Group authorization failed.'
    }
  ],
  [
    31,
    {
      kafkaStatus: 'CLUSTER_AUTHORIZATION_FAILED',
      kafkaStatusCode: 31,
      isRetryableError: false,
      httpResponseCode: 403,
      httpResponseMessage: 'Cluster authorization failed.'
    }
  ],
  [
    32,
    {
      kafkaStatus: 'INVALID_TIMESTAMP',
      kafkaStatusCode: 32,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'The timestamp of the message is out of acceptable range.'
    }
  ],
  [
    33,
    {
      kafkaStatus: 'UNSUPPORTED_SASL_MECHANISM',
      kafkaStatusCode: 33,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'The broker does not support the requested SASL mechanism.'
    }
  ],
  [
    34,
    {
      kafkaStatus: 'ILLEGAL_SASL_STATE',
      kafkaStatusCode: 34,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Request is not valid given the current SASL state.'
    }
  ],
  [
    35,
    {
      kafkaStatus: 'UNSUPPORTED_VERSION',
      kafkaStatusCode: 35,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'The version of API is not supported.'
    }
  ],
  [
    36,
    {
      kafkaStatus: 'TOPIC_ALREADY_EXISTS',
      kafkaStatusCode: 36,
      isRetryableError: false,
      httpResponseCode: 409,
      httpResponseMessage: 'Topic with this name already exists.'
    }
  ],
  [
    37,
    {
      kafkaStatus: 'INVALID_PARTITIONS',
      kafkaStatusCode: 37,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Number of partitions is invalid.'
    }
  ],
  [
    38,
    {
      kafkaStatus: 'INVALID_REPLICATION_FACTOR',
      kafkaStatusCode: 38,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Replication-factor is invalid.'
    }
  ],
  [
    39,
    {
      kafkaStatus: 'INVALID_REPLICA_ASSIGNMENT',
      kafkaStatusCode: 39,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Replica assignment is invalid.'
    }
  ],
  [
    40,
    {
      kafkaStatus: 'INVALID_CONFIG',
      kafkaStatusCode: 40,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Configuration is invalid.'
    }
  ],
  [
    41,
    {
      kafkaStatus: 'NOT_CONTROLLER',
      kafkaStatusCode: 41,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'This is not the correct controller for this cluster.'
    }
  ],
  [
    42,
    {
      kafkaStatus: 'INVALID_REQUEST',
      kafkaStatusCode: 42,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage:
        'This most likely occurs because of a request being malformed by the client library or the message was sent to an incompatible broker. See the broker logs for more details.'
    }
  ],
  [
    43,
    {
      kafkaStatus: 'UNSUPPORTED_FOR_MESSAGE_FORMAT',
      kafkaStatusCode: 43,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'The message format version on the broker does not support the request.'
    }
  ],
  [
    44,
    {
      kafkaStatus: 'POLICY_VIOLATION',
      kafkaStatusCode: 44,
      isRetryableError: false,
      httpResponseCode: 403,
      httpResponseMessage: 'Request parameters do not satisfy the configured policy.'
    }
  ],
  [
    45,
    {
      kafkaStatus: 'OUT_OF_ORDER_SEQUENCE_NUMBER',
      kafkaStatusCode: 45,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'The broker received an out of order sequence number'
    }
  ],
  [
    46,
    {
      kafkaStatus: 'DUPLICATE_SEQUENCE_NUMBER',
      kafkaStatusCode: 46,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'The broker received a duplicate sequence number'
    }
  ],
  [
    47,
    {
      kafkaStatus: 'INVALID_PRODUCER_EPOCH',
      kafkaStatusCode: 47,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage:
        "Producer attempted an operation with an old epoch. Either there is a newer producer with the same transactionalId, or the producer's transaction has been expired by the broker."
    }
  ],
  [
    48,
    {
      kafkaStatus: 'INVALID_TXN_STATE',
      kafkaStatusCode: 48,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'The producer attempted a transactional operation in an invalid state'
    }
  ],
  [
    49,
    {
      kafkaStatus: 'INVALID_PRODUCER_ID_MAPPING',
      kafkaStatusCode: 49,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage:
        'The producer attempted to use a producer id which is not currently assigned to its transactional id'
    }
  ],
  [
    50,
    {
      kafkaStatus: 'INVALID_TRANSACTION_TIMEOUT',
      kafkaStatusCode: 50,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage:
        'The transaction timeout is larger than the maximum value allowed by the broker (as configured by transaction.max.timeout.ms).'
    }
  ],
  [
    51,
    {
      kafkaStatus: 'CONCURRENT_TRANSACTIONS',
      kafkaStatusCode: 51,
      isRetryableError: false,
      httpResponseCode: 503,
      httpResponseMessage:
        'The producer attempted to update a transaction while another concurrent operation on the same transaction was ongoing'
    }
  ],
  [
    52,
    {
      kafkaStatus: 'TRANSACTION_COORDINATOR_FENCED',
      kafkaStatusCode: 52,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage:
        'Indicates that the transaction coordinator sending a WriteTxnMarker is no longer the current coordinator for a given producer'
    }
  ],
  [
    53,
    {
      kafkaStatus: 'TRANSACTIONAL_ID_AUTHORIZATION_FAILED',
      kafkaStatusCode: 53,
      isRetryableError: false,
      httpResponseCode: 403,
      httpResponseMessage: 'Transactional Id authorization failed'
    }
  ],
  [
    54,
    {
      kafkaStatus: 'SECURITY_DISABLED',
      kafkaStatusCode: 54,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Security features are disabled.'
    }
  ],
  [
    55,
    {
      kafkaStatus: 'OPERATION_NOT_ATTEMPTED',
      kafkaStatusCode: 55,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage:
        'The broker did not attempt to execute this operation. This may happen for batched RPCs where some operations in the batch failed, causing the broker to respond without trying the rest.'
    }
  ],
  [
    56,
    {
      kafkaStatus: 'KAFKA_STORAGE_ERROR',
      kafkaStatusCode: 56,
      isRetryableError: true,
      httpResponseCode: 500,
      httpResponseMessage: 'Disk error when trying to access log file on the disk.'
    }
  ],
  [
    57,
    {
      kafkaStatus: 'LOG_DIR_NOT_FOUND',
      kafkaStatusCode: 57,
      isRetryableError: false,
      httpResponseCode: 500,
      httpResponseMessage: 'The user-specified log directory is not found in the broker config.'
    }
  ],
  [
    58,
    {
      kafkaStatus: 'SASL_AUTHENTICATION_FAILED',
      kafkaStatusCode: 58,
      isRetryableError: false,
      httpResponseCode: 401,
      httpResponseMessage: 'SASL Authentication failed.'
    }
  ],
  [
    59,
    {
      kafkaStatus: 'UNKNOWN_PRODUCER_ID',
      kafkaStatusCode: 59,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage:
        "This exception is raised by the broker if it could not locate the producer metadata associated with the producerId in question. This could happen if, for instance, the producer's records were deleted because their retention time had elapsed. Once the last records of the producerId are removed, the producer's metadata is removed from the broker, and future appends by the producer will return this exception."
    }
  ],
  [
    60,
    {
      kafkaStatus: 'REASSIGNMENT_IN_PROGRESS',
      kafkaStatusCode: 60,
      isRetryableError: false,
      httpResponseCode: 503,
      httpResponseMessage: 'A partition reassignment is in progress'
    }
  ],
  [
    61,
    {
      kafkaStatus: 'DELEGATION_TOKEN_AUTH_DISABLED',
      kafkaStatusCode: 61,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Delegation Token feature is not enabled.'
    }
  ],
  [
    62,
    {
      kafkaStatus: 'DELEGATION_TOKEN_NOT_FOUND',
      kafkaStatusCode: 62,
      isRetryableError: false,
      httpResponseCode: 404,
      httpResponseMessage: 'Delegation Token is not found on server.'
    }
  ],
  [
    63,
    {
      kafkaStatus: 'DELEGATION_TOKEN_OWNER_MISMATCH',
      kafkaStatusCode: 63,
      isRetryableError: false,
      httpResponseCode: 403,
      httpResponseMessage: 'Specified Principal is not valid Owner/Renewer.'
    }
  ],
  [
    64,
    {
      kafkaStatus: 'DELEGATION_TOKEN_REQUEST_NOT_ALLOWED',
      kafkaStatusCode: 64,
      isRetryableError: false,
      httpResponseCode: 403,
      httpResponseMessage:
        'Delegation Token requests are not allowed on PLAINTEXT/1-way SSL channels and on delegation token authenticated channels.'
    }
  ],
  [
    65,
    {
      kafkaStatus: 'DELEGATION_TOKEN_AUTHORIZATION_FAILED',
      kafkaStatusCode: 65,
      isRetryableError: false,
      httpResponseCode: 403,
      httpResponseMessage: 'Delegation Token authorization failed.'
    }
  ],
  [
    66,
    {
      kafkaStatus: 'DELEGATION_TOKEN_EXPIRED',
      kafkaStatusCode: 66,
      isRetryableError: false,
      httpResponseCode: 401,
      httpResponseMessage: 'Delegation Token is expired.'
    }
  ],
  [
    67,
    {
      kafkaStatus: 'INVALID_PRINCIPAL_TYPE',
      kafkaStatusCode: 67,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Supplied principalType is not supported'
    }
  ],
  [
    68,
    {
      kafkaStatus: 'NON_EMPTY_GROUP',
      kafkaStatusCode: 68,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'The group The group is not empty is not empty'
    }
  ],
  [
    69,
    {
      kafkaStatus: 'GROUP_ID_NOT_FOUND',
      kafkaStatusCode: 69,
      isRetryableError: false,
      httpResponseCode: 404,
      httpResponseMessage: 'The group id The group id does not exist was not found'
    }
  ],
  [
    70,
    {
      kafkaStatus: 'FETCH_SESSION_ID_NOT_FOUND',
      kafkaStatusCode: 70,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'The fetch session ID was not found'
    }
  ],
  [
    71,
    {
      kafkaStatus: 'INVALID_FETCH_SESSION_EPOCH',
      kafkaStatusCode: 71,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'The fetch session epoch is invalid'
    }
  ],
  [
    72,
    {
      kafkaStatus: 'LISTENER_NOT_FOUND',
      kafkaStatusCode: 72,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Listener not found'
    }
  ],
  [
    73,
    {
      kafkaStatus: 'TOPIC_DELETION_DISABLED',
      kafkaStatusCode: 73,
      isRetryableError: false,
      httpResponseCode: 403,
      httpResponseMessage: 'Topic deletion disabled'
    }
  ],
  [
    74,
    {
      kafkaStatus: 'FENCED_LEADER_EPOCH',
      kafkaStatusCode: 74,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'Fenced leader epoch'
    }
  ],
  [
    75,
    {
      kafkaStatus: 'UNKNOWN_LEADER_EPOCH',
      kafkaStatusCode: 75,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'Unknown leader epoch'
    }
  ],
  [
    76,
    {
      kafkaStatus: 'UNSUPPORTED_COMPRESSION_TYPE',
      kafkaStatusCode: 76,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Unsupported compression type'
    }
  ],
  [
    77,
    {
      kafkaStatus: 'STALE_BROKER_EPOCH',
      kafkaStatusCode: 77,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Stale broker epoch'
    }
  ],
  [
    78,
    {
      kafkaStatus: 'OFFSET_NOT_AVAILABLE',
      kafkaStatusCode: 78,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'Offset not available'
    }
  ],
  [
    79,
    {
      kafkaStatus: 'MEMBER_ID_REQUIRED',
      kafkaStatusCode: 79,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Member id required'
    }
  ],
  [
    80,
    {
      kafkaStatus: 'PREFERRED_LEADER_NOT_AVAILABLE',
      kafkaStatusCode: 80,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'Preferred leader not available'
    }
  ],
  [
    81,
    {
      kafkaStatus: 'GROUP_MAX_SIZE_REACHED',
      kafkaStatusCode: 81,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Group maximum size reached'
    }
  ],
  [
    82,
    {
      kafkaStatus: 'FENCED_INSTANCE_ID',
      kafkaStatusCode: 82,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Fenced instance id'
    }
  ],
  [
    83,
    {
      kafkaStatus: 'ELIGIBLE_LEADERS_NOT_AVAILABLE',
      kafkaStatusCode: 83,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'Eligible leaders not available'
    }
  ],
  [
    84,
    {
      kafkaStatus: 'ELECTION_NOT_NEEDED',
      kafkaStatusCode: 84,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Election not needed'
    }
  ],
  [
    85,
    {
      kafkaStatus: 'NO_REASSIGNMENT_IN_PROGRESS',
      kafkaStatusCode: 85,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'No reassignment in progress'
    }
  ],
  [
    86,
    {
      kafkaStatus: 'GROUP_SUBSCRIBED_TO_TOPIC',
      kafkaStatusCode: 86,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Group subscribed to topic'
    }
  ],
  [
    87,
    {
      kafkaStatus: 'INVALID_RECORD',
      kafkaStatusCode: 87,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Invalid record'
    }
  ],
  [
    88,
    {
      kafkaStatus: 'UNSTABLE_OFFSET_COMMIT',
      kafkaStatusCode: 88,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'Unstable offset commit'
    }
  ],
  [
    89,
    {
      kafkaStatus: 'THROTTLING_QUOTA_EXCEEDED',
      kafkaStatusCode: 89,
      isRetryableError: true,
      httpResponseCode: 429,
      httpResponseMessage: 'Throttling quota exceeded'
    }
  ],
  [
    90,
    {
      kafkaStatus: 'PRODUCER_FENCED',
      kafkaStatusCode: 90,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Producer fenced'
    }
  ],
  [
    91,
    {
      kafkaStatus: 'RESOURCE_NOT_FOUND',
      kafkaStatusCode: 91,
      isRetryableError: false,
      httpResponseCode: 404,
      httpResponseMessage: 'Resource not found'
    }
  ],
  [
    92,
    {
      kafkaStatus: 'DUPLICATE_RESOURCE',
      kafkaStatusCode: 92,
      isRetryableError: false,
      httpResponseCode: 409,
      httpResponseMessage: 'Duplicate resource'
    }
  ],
  [
    93,
    {
      kafkaStatus: 'UNACCEPTABLE_CREDENTIAL',
      kafkaStatusCode: 93,
      isRetryableError: false,
      httpResponseCode: 401,
      httpResponseMessage: 'Unacceptable credential'
    }
  ],
  [
    94,
    {
      kafkaStatus: 'INCONSISTENT_VOTER_SET',
      kafkaStatusCode: 94,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Inconsistent voter set'
    }
  ],
  [
    95,
    {
      kafkaStatus: 'INVALID_UPDATE_VERSION',
      kafkaStatusCode: 95,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Invalid update version'
    }
  ],
  [
    96,
    {
      kafkaStatus: 'FEATURE_UPDATE_FAILED',
      kafkaStatusCode: 96,
      isRetryableError: false,
      httpResponseCode: 500,
      httpResponseMessage: 'Feature update failed'
    }
  ],
  [
    97,
    {
      kafkaStatus: 'PRINCIPAL_DESERIALIZATION_FAILURE',
      kafkaStatusCode: 97,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Principal deserialization failure'
    }
  ],
  [
    98,
    {
      kafkaStatus: 'SNAPSHOT_NOT_FOUND',
      kafkaStatusCode: 98,
      isRetryableError: false,
      httpResponseCode: 404,
      httpResponseMessage: 'Snapshot not found'
    }
  ],
  [
    99,
    {
      kafkaStatus: 'POSITION_OUT_OF_RANGE',
      kafkaStatusCode: 99,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Position out of range'
    }
  ],
  [
    100,
    {
      kafkaStatus: 'UNKNOWN_TOPIC_ID',
      kafkaStatusCode: 100,
      isRetryableError: false,
      httpResponseCode: 404,
      httpResponseMessage: 'Unknown topic id'
    }
  ],
  [
    101,
    {
      kafkaStatus: 'DUPLICATE_BROKER_REGISTRATION',
      kafkaStatusCode: 101,
      isRetryableError: false,
      httpResponseCode: 409,
      httpResponseMessage: 'Duplicate broker registration'
    }
  ],
  [
    102,
    {
      kafkaStatus: 'BROKER_ID_NOT_REGISTERED',
      kafkaStatusCode: 102,
      isRetryableError: false,
      httpResponseCode: 404,
      httpResponseMessage: 'Broker id not registered'
    }
  ],
  [
    103,
    {
      kafkaStatus: 'INCONSISTENT_TOPIC_ID',
      kafkaStatusCode: 103,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Inconsistent topic id'
    }
  ],
  [
    104,
    {
      kafkaStatus: 'INCONSISTENT_CLUSTER_ID',
      kafkaStatusCode: 104,
      isRetryableError: false,
      httpResponseCode: 400,
      httpResponseMessage: 'Inconsistent cluster id'
    }
  ],
  [
    105,
    {
      kafkaStatus: 'TRANSACTIONAL_ID_NOT_FOUND',
      kafkaStatusCode: 105,
      isRetryableError: false,
      httpResponseCode: 404,
      httpResponseMessage: 'Transactional id not found'
    }
  ],
  [
    106,
    {
      kafkaStatus: 'FETCH_SESSION_TOPIC_ID_ERROR',
      kafkaStatusCode: 106,
      isRetryableError: true,
      httpResponseCode: 503,
      httpResponseMessage: 'Fetch session topic id error'
    }
  ]
])

/**
 * Handles KafkaJS errors and maps them to appropriate Segment errors
 * @param error - The KafkaJS error
 * @param defaultMessage - Default error message if no specific mapping found
 * @returns IntegrationError or RetryableError based on error type
 */
export async function handleKafkaError(
  request: RequestClient,
  url: string,
  error: KafkaJSError,
  defaultMessage: string,
  data?: TopicMessages
) {
  const httpErrorBody: HttpErrorBody = {
    name: error.name,
    message: error.message,
    retryable: error.retriable
  }

  if (error instanceof KafkaJSError) {
    if (error.retriable) {
      await emulateFailedHttpRequest(request, url, httpErrorBody, data)
      return new RetryableError(error.message)
    } else {
      await emulateFailedHttpRequest(request, url, httpErrorBody, data)
      return new IntegrationError(error.message, 'KAFKA_ERROR', 400)
    }
  }

  // Fallback to default error handling
  await emulateFailedHttpRequest(request, url, httpErrorBody, data)
  return new IntegrationError(defaultMessage, 'KAFKA_ERROR', 400)
}

type HttpErrorBody = {
  name: string
  message: string
  retryable: boolean
}

function emulateFailedHttpRequest(
  request: RequestClient,
  url: string,
  httpErrorBody: HttpErrorBody,
  data?: TopicMessages
) {
  const emulateHttpResponse = new Response(JSON.stringify(httpErrorBody), {
    headers: { 'Content-Type': 'application/json' },
    status: httpErrorBody.retryable ? 503 : 400,
    statusText: 'Kafka Error'
  })

  return request(url, {
    method: 'POST',
    json: {
      data
    },
    headers: {
      'Content-Type': 'application/json'
    },
    emulateHttpResponse,
    throwHttpErrors: false
  })
}
