import { readFileSync } from 'fs'
import { RequestClient } from '@segment/actions-core'
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
import { IntegrationError, ErrorCodes } from '@segment/actions-core'
import { Logger, StatsContext } from '@segment/actions-core/destination-kit'
import { v4 as uuidv4 } from '@lukeed/uuid'

export type AWSCredentials = {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
}

// Optional diagnostic instrumentation for the Kinesis assume-role path.
// Gated by the `actions-aws-kinesis-advanced-logging` Flagon flag (see aws-kinesis/send/index.ts).
export type StsLogging = {
  advancedLogging: boolean
  logger?: Logger
  statsContext?: StatsContext
}

type K8sApiServiceAccountResponse = {
  metadata: {
    annotations: Record<string, string>
  }
}

type AwsStsApiResponse = {
  AssumeRoleWithWebIdentityResponse: {
    AssumeRoleWithWebIdentityResult: {
      AssumedRoleUser: {
        Arn: string
        AssumedRoleId: string
      }
      Audience: string
      Credentials: {
        AccessKeyId: string
        Expiration: number
        SecretAccessKey: string
        SessionToken: string
      }
      PackedPolicySize: unknown
      Provider: unknown
      SourceIdentity: unknown
      SubjectFromWebIdentityToken: unknown
    }
    ResponseMetadata: {
      RequestId: string
    }
  }
}

type AWSCredentialsCache = {
  expires: number
  credentials: AWSCredentials
}

const awsCredentialsCache: AWSCredentialsCache = {
  expires: 0,
  credentials: { accessKeyId: '', secretAccessKey: '', sessionToken: '' }
}

function getToken(): string {
  const tokenFilepath =
    process.env['AWS_WEB_IDENTITY_TOKEN_FILE'] || '/var/run/secrets/kubernetes.io/serviceaccount/token'
  return readFileSync(tokenFilepath, 'utf-8')
}

// Try to get AWS Role ARN from Service Account using Kubernetes API
async function getAWSRoleARNFromK8sAPI(request: RequestClient, K8sToken: string): Promise<string> {
  const K8sApiResponse = await request<K8sApiServiceAccountResponse>(
    'https://kubernetes.default.svc/api/v1/namespaces/default/serviceaccounts/pod-service-account',
    {
      headers: {
        Authorization: `Bearer ${K8sToken}`
      }
    }
  )

  const roleArn = K8sApiResponse.data?.metadata?.annotations?.['eks.amazonaws.com/role-arn']

  if (!roleArn) {
    throw new Error('Unable to retrieve AWS Role ARN from Kubernetes API.')
  }

  return roleArn
}

async function getCredentialsFromSTS(
  request: RequestClient,
  awsRoleARN: string,
  token: string
): Promise<AWSCredentials> {
  const stsResponse = await request<AwsStsApiResponse>(
    `https://sts.us-west-2.amazonaws.com/?` +
      `Action=AssumeRoleWithWebIdentity` +
      `&DurationSeconds=3600` +
      `&RoleSessionName=integrations-monoservice` +
      `&RoleArn=${awsRoleARN}` +
      `&WebIdentityToken=${token}` +
      `&Version=2011-06-15`,
    {
      method: 'GET',
      headers: {
        'User-Agent': 'segment/integrations-monoservice',
        Accept: 'application/json'
      }
    }
  )

  return {
    accessKeyId:
      stsResponse.data.AssumeRoleWithWebIdentityResponse.AssumeRoleWithWebIdentityResult.Credentials.AccessKeyId,
    secretAccessKey:
      stsResponse.data.AssumeRoleWithWebIdentityResponse.AssumeRoleWithWebIdentityResult.Credentials.SecretAccessKey,
    sessionToken:
      stsResponse.data.AssumeRoleWithWebIdentityResponse.AssumeRoleWithWebIdentityResult.Credentials.SessionToken
  }
}

export async function getAWSCredentialsFromEKS(request: RequestClient): Promise<AWSCredentials> {
  // Check if credentials in cache is still valid
  // Note: STS can issue multiple tokens without invalidating the previously issued ones
  if (awsCredentialsCache.expires > Date.now()) {
    return awsCredentialsCache.credentials
  }

  // Read Kubernetes token
  const token = getToken()

  // Get IAM Role ARN from ENV or from Kubernetes API
  const awsRoleARN = process.env['AWS_ROLE_ARN'] || (await getAWSRoleARNFromK8sAPI(request, token))

  const credentials = await getCredentialsFromSTS(request, awsRoleARN, token)

  // Cache credentials for 55 minutes to be on the safe side
  // Calling STS returns a new token every time
  awsCredentialsCache.expires = Date.now() + 3300000 // 55 * 60 * 1000
  awsCredentialsCache.credentials = credentials

  return credentials
}

export const assumeRole = async (
  roleArn: string,
  externalId: string,
  region: string,
  logging?: StsLogging
): Promise<AWSCredentials> => {
  const intermediaryARN = process.env.AMAZON_KINESIS_ACTIONS_ROLE_ADDRESS as string
  const intermediaryExternalId = process.env.AMAZON_KINESIS_ACTIONS_EXTERNAL_ID as string
  const intermediaryCreds = await getSTSCredentials(
    intermediaryARN,
    intermediaryExternalId,
    region,
    undefined,
    logging,
    'sts_intermediary_ms'
  )
  return getSTSCredentials(roleArn, externalId, region, intermediaryCreds, logging, 'sts_customer_ms')
}

const getSTSCredentials = async (
  roleId: string,
  externalId: string,
  region: string,
  credentials?: AWSCredentials,
  logging?: StsLogging,
  metric?: string
) => {
  const options = { credentials, region: region }
  const stsClient = new STSClient(options)
  const roleSessionName: string = uuidv4()
  const command = new AssumeRoleCommand({
    RoleArn: roleId,
    RoleSessionName: roleSessionName,
    ExternalId: externalId
  })
  const start = Date.now()
  const result = await stsClient.send(command)
  if (logging?.advancedLogging && metric) {
    const durationMs = Date.now() - start
    logging.statsContext?.statsClient?.histogram(`actions_kinesis.${metric}`, durationMs, logging.statsContext?.tags)
    logging.logger?.info(`[aws-kinesis] assume_role phase=${metric} durationMs=${durationMs} region=${region}`)
  }
  if (
    !result.Credentials ||
    !result.Credentials.AccessKeyId ||
    !result.Credentials.SecretAccessKey ||
    !result.Credentials.SessionToken
  ) {
    throw new IntegrationError('Failed to assume role', ErrorCodes.INVALID_AUTHENTICATION, 403)
  }

  return {
    accessKeyId: result.Credentials.AccessKeyId,
    secretAccessKey: result.Credentials.SecretAccessKey,
    sessionToken: result.Credentials.SessionToken
  }
}
