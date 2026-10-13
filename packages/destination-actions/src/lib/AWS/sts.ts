import { readFileSync } from 'fs'
import { RequestClient } from '@segment/actions-core'
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
import { IntegrationError, ErrorCodes } from '@segment/actions-core'
import { v4 as uuidv4 } from '@lukeed/uuid'

export type AWSCredentials = {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
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

type AssumedRoleCacheEntry = {
  credentials: AWSCredentials
  expiresAt: number
}

// In-memory cache of assumed-role credentials, keyed by role ARN + external id + region.
// Under high TPS, calling STS AssumeRole on every request causes IAM throttling. Caching the
// assumed credentials until shortly before they expire keeps STS calls to (at most) one refresh
// per role per TTL window instead of one (well, two - intermediary + target) per request.
const assumedRoleCache = new Map<string, AssumedRoleCacheEntry>()

// De-duplicates concurrent refreshes for the same key. Without this, a burst of requests that
// all miss the cache at the same time would each trigger a fresh set of STS calls (thundering
// herd). Instead they all await the single in-flight refresh.
const inflightRoleRefreshes = new Map<string, Promise<AssumedRoleCacheEntry>>()

// Refresh a little before the credentials actually expire so in-flight requests aren't handed
// credentials that expire mid-use.
const CREDENTIALS_EXPIRY_BUFFER_MS = 5 * 60 * 1000 // 5 minutes
// Fallback TTL used when STS does not return an expiration. AssumeRole sessions default to 1 hour.
const DEFAULT_CREDENTIALS_TTL_MS = 55 * 60 * 1000 // 55 minutes

const buildAssumedRoleCacheKey = (roleArn: string, externalId: string, region: string): string =>
  `${roleArn}|${externalId}|${region}`

// Exposed for tests to reset the in-memory caches between cases.
export const __clearAssumedRoleCacheForTests = (): void => {
  assumedRoleCache.clear()
  inflightRoleRefreshes.clear()
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

export const assumeRole = async (roleArn: string, externalId: string, region: string): Promise<AWSCredentials> => {
  const cacheKey = buildAssumedRoleCacheKey(roleArn, externalId, region)

  const cached = assumedRoleCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.credentials
  }

  // Collapse concurrent refreshes for the same key into a single STS round-trip.
  let inflight = inflightRoleRefreshes.get(cacheKey)
  if (!inflight) {
    inflight = refreshAssumedRoleCredentials(roleArn, externalId, region)
      .then((entry) => {
        assumedRoleCache.set(cacheKey, entry)
        return entry
      })
      .finally(() => {
        inflightRoleRefreshes.delete(cacheKey)
      })
    inflightRoleRefreshes.set(cacheKey, inflight)
  }

  const entry = await inflight
  return entry.credentials
}

const refreshAssumedRoleCredentials = async (
  roleArn: string,
  externalId: string,
  region: string
): Promise<AssumedRoleCacheEntry> => {
  const intermediaryARN = process.env.AMAZON_KINESIS_ACTIONS_ROLE_ADDRESS as string
  const intermediaryExternalId = process.env.AMAZON_KINESIS_ACTIONS_EXTERNAL_ID as string
  const intermediary = await getSTSCredentials(intermediaryARN, intermediaryExternalId, region)
  const target = await getSTSCredentials(roleArn, externalId, region, intermediary.credentials)

  // Prefer the actual STS expiration (minus a safety buffer) so the cache stays valid for the
  // full session lifetime; fall back to a conservative default if STS omits it.
  const ttl = target.expiration
    ? target.expiration.getTime() - Date.now() - CREDENTIALS_EXPIRY_BUFFER_MS
    : DEFAULT_CREDENTIALS_TTL_MS

  return {
    credentials: target.credentials,
    expiresAt: Date.now() + Math.max(ttl, 0)
  }
}

type STSCredentialsResult = {
  credentials: AWSCredentials
  expiration?: Date
}

const getSTSCredentials = async (
  roleId: string,
  externalId: string,
  region: string,
  credentials?: AWSCredentials
): Promise<STSCredentialsResult> => {
  const options = { credentials, region: region }
  const stsClient = new STSClient(options)
  const roleSessionName: string = uuidv4()
  const command = new AssumeRoleCommand({
    RoleArn: roleId,
    RoleSessionName: roleSessionName,
    ExternalId: externalId
  })
  const result = await stsClient.send(command)
  if (
    !result.Credentials ||
    !result.Credentials.AccessKeyId ||
    !result.Credentials.SecretAccessKey ||
    !result.Credentials.SessionToken
  ) {
    throw new IntegrationError('Failed to assume role', ErrorCodes.INVALID_AUTHENTICATION, 403)
  }

  return {
    credentials: {
      accessKeyId: result.Credentials.AccessKeyId,
      secretAccessKey: result.Credentials.SecretAccessKey,
      sessionToken: result.Credentials.SessionToken
    },
    expiration: result.Credentials.Expiration
  }
}
