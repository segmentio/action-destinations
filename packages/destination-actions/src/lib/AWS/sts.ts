import { readFileSync } from 'fs'
import { RequestClient } from '@segment/actions-core'

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
