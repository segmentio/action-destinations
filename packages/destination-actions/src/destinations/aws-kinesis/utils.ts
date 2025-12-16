import type { Settings } from './generated-types'
import type { Payload } from './send/generated-types'
import { Logger, StatsContext } from '@segment/actions-core/destination-kit'
import {
  KinesisClient,
  PutRecordsCommand,
  PutRecordsRequestEntry,
  PutRecordsCommandOutput
} from '@aws-sdk/client-kinesis'
import { assumeRole } from '../../lib/AWS/sts'
import { APP_AWS_REGION } from '../../lib/AWS/utils'
import { RequestTimeoutError, MultiStatusResponse, IntegrationError, JSONLikeObject } from '@segment/actions-core'

export const validateIamRoleArnFormat = (arn: string): boolean => {
  const iamRoleArnRegex = /^arn:aws:iam::\d{12}:role\/[A-Za-z0-9+=,.@_\-/]+$/
  return iamRoleArnRegex.test(arn)
}

const transformPayloads = (payloads: Payload[]): PutRecordsRequestEntry[] => {
  return payloads.map((record) => ({
    Data: Buffer.from(JSON.stringify(record.payload)),
    PartitionKey: record.partitionKey
  }))
}

const createKinesisClient = async (
  iamRoleArn: string,
  iamExternalId: string,
  awsRegion: string
): Promise<KinesisClient> => {
  const credentials = await assumeRole(iamRoleArn, iamExternalId, APP_AWS_REGION)
  return new KinesisClient({
    region: awsRegion,
    credentials: credentials
  })
}

export const send = async (
  settings: Settings,
  payloads: Payload[],
  statsContext: StatsContext | undefined,
  logger: Logger | undefined,
  signal?: AbortSignal
): Promise<MultiStatusResponse> => {
  const { iamRoleArn, iamExternalId } = settings
  const { streamName, awsRegion } = payloads[0]
  const entries = transformPayloads(payloads)

  statsContext?.statsClient?.histogram('actions_kinesis.batch_size', entries?.length, statsContext?.tags)
  statsContext?.statsClient?.incr('actions_kinesis.request_hit', 1, statsContext?.tags)

  try {
    const client = await createKinesisClient(iamRoleArn, iamExternalId, awsRegion)
    const command = new PutRecordsCommand({
      StreamName: streamName,
      Records: entries
    })

    const response = await client.send(command, { abortSignal: signal })
    const multiResp = handleMultiStatusResponse(response, statsContext, payloads)
    return multiResp
  } catch (error) {
    // Handle abort signal error: https://aws.amazon.com/blogs/developer/abortcontroller-in-modular-aws-sdk-for-javascript/
    if ((error as Error).name === 'AbortError') {
      // Handle abort error
      throw new RequestTimeoutError()
    }

    logger?.crit('Failed to send batch to Kinesis:', error)
    handleError(error, statsContext)
  }

  return Promise.resolve(new MultiStatusResponse()) // This line will never be reached but is needed to satisfy TypeScript
}

const handleError = (error: any, statsContext: StatsContext | undefined): void => {
  if (error?.name === 'AccessDeniedException') {
    statsContext?.statsClient?.incr('actions_kinesis.access_denied_exception', 1, statsContext?.tags)
    throw new IntegrationError(
      `Access denied. Please check that the provided IAM Role has the necessary permissions to access Kinesis.`,
      'ACCESS_DENIED',
      403
    )
  }

  statsContext?.statsClient?.incr('actions_kinesis.error', 1, statsContext?.tags)
  throw new IntegrationError(`Failed to send batch to Kinesis: ${error?.message}`, 'DEPENDENCY_ERROR', 500)
}

const convertErrorCodeToStatus = (code?: string, isBatch = true): number => {
  if (!code) {
    return 500
  }

  const normalizedCode = code.trim()

  switch (normalizedCode) {
    // General errors
    case 'ThrottlingException':
      return 429
    case 'AccessDeniedException':
    case 'AccessDenied':
      return isBatch ? 502 : 403
    case 'request.ErrCodeRequestError':
    case 'RequestError':
    case 'request.ErrCodeRead':
    case 'ReadError':
      return 503
    case 'request.CanceledErrorCode':
    case 'RequestCanceled':
    case 'request.ErrCodeResponseTimeout':
    case 'ResponseTimeout':
    case 'request.HandlerResponseTimeout':
    case 'HandlerResponseTimeout':
      return 504

    // STS errors
    case 'ExpiredTokenException':
    case 'IDPRejectedClaimException':
    case 'InvalidIdentityTokenException':
      return 511
    case 'IDPCommunicationErrorException':
      return 503
    case 'InvalidAuthorizationMessageException':
    case 'MalformedPolicyDocumentException':
    case 'PackedPolicyTooLargeException':
      return 400
    case 'RegionDisabledException':
      return 403

    // Kinesis errors
    case 'ValidationException':
      return 400
    case 'LimitExceededException':
    case 'ProvisionedThroughputExceededException':
      return 429
    case 'ResourceNotFoundException':
      return 404
    case 'InvalidArgumentException':
    case 'InvalidParameter':
      return 400
    case 'InternalFailureException':
      return 503
    case 'ResourceInUseException':
      return 409
    default:
      return 500
  }
}

const handleMultiStatusResponse = (
  response: PutRecordsCommandOutput,
  statsContext: StatsContext | undefined,
  payloads: Payload[]
): MultiStatusResponse => {
  const multiStatusResponse: MultiStatusResponse = new MultiStatusResponse()
  const { FailedRecordCount, Records } = response

  if (!FailedRecordCount || FailedRecordCount == 0) {
    statsContext?.statsClient?.incr('actions_kinesis.successful_record_count', Records?.length || 0, statsContext?.tags)
    // All records succeeded
    Records?.forEach((record: any, index: number) => {
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        body: record,
        sent: payloads[index] as unknown as JSONLikeObject
      })
    })
    return multiStatusResponse
  }

  statsContext?.statsClient?.incr('actions_kinesis.failed_record_count', FailedRecordCount, statsContext?.tags)
  // Add metrics for each error type
  Records?.forEach((record: any, index: number) => {
    if (record.ErrorCode) {
      const statusCode = convertErrorCodeToStatus(record.ErrorCode, true)
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: statusCode,
        errortype: record.ErrorCode,
        errormessage: record.ErrorMessage
      })
      const errorCode = record.ErrorCode || 'UnknownError'
      statsContext?.statsClient?.incr(`actions_kinesis.error.${errorCode}`, 1, statsContext?.tags)
    } else {
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        body: record,
        sent: payloads[index] as unknown as JSONLikeObject
      })
      statsContext?.statsClient?.incr('actions_kinesis.successful_record_count', 1, statsContext?.tags)
    }
  })

  return multiStatusResponse
}
