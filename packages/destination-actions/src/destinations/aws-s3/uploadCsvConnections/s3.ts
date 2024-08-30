import { AudienceSettings, Settings } from '../generated-types'
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
import { S3Client, PutObjectCommandInput, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from '@lukeed/uuid'
import * as process from 'process'
import { ErrorCodes, IntegrationError } from '@segment/actions-core'

interface Credentials {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
}

export class S3CSVClient {
  roleArn: string
  roleSessionName: string
  region: string
  externalId: string

  constructor(region: string, roleArn: string, externalId: string) {
    this.region = region
    this.roleSessionName = uuidv4()
    this.roleArn = roleArn
    this.externalId = externalId
  }

  async assumeRole(): Promise<Credentials> {
    const intermediaryARN = process.env.AMAZON_S3_ACTIONS_ROLE_ADDRESS as string
    const intermediaryExternalId = process.env.AMAZON_S3_ACTIONS_EXTERNAL_ID as string

    const intermediaryCreds = await this.getSTSCredentials(intermediaryARN, intermediaryExternalId)
    return this.getSTSCredentials(this.roleArn, this.externalId, intermediaryCreds)
  }

  private async getSTSCredentials(roleId: string, externalId: string, credentials?: Credentials) {
    const options = { region: this.region, credentials }
    const stsClient = new STSClient(options)
    const command = new AssumeRoleCommand({
      RoleArn: roleId,
      RoleSessionName: this.roleSessionName,
      ExternalId: externalId
    })
    const result = await stsClient.send(command)
    if (
      !result.Credentials ||
      !result.Credentials.AccessKeyId ||
      !result.Credentials.SecretAccessKey ||
      !result.Credentials.SessionToken
    ) {
      // TODO: Add more specific error handling
      throw new IntegrationError('Failed to assume role', ErrorCodes.INVALID_AUTHENTICATION, 403)
    }
    return {
      accessKeyId: result.Credentials.AccessKeyId,
      secretAccessKey: result.Credentials.SecretAccessKey,
      sessionToken: result.Credentials.SessionToken
    }
  }

  async uploadS3(settings: Settings, audienceSettings: AudienceSettings, fileContent: string, audienceName: string) {
    let filename = audienceSettings.filename ?? ''
    const dateSuffix = new Date().toISOString().replace(/[:.]/g, '-')

    if (filename.endsWith('.csv')) {
      // Insert the date suffix before the .csv extension
      filename = filename.replace('.csv', `_${dateSuffix}.csv`)
    } else {
      // Append the date suffix followed by .csv
      audienceName = audienceName ? audienceName.toLowerCase() : ''
      filename = filename ? `${filename}_${audienceName}_${dateSuffix}.csv` : `${audienceName}_${dateSuffix}.csv`
    }

    const bucketName = settings.s3_aws_bucket_name
    const folderName = ['', null, undefined].includes(audienceSettings?.s3_aws_folder_name)
      ? ''
      : audienceSettings?.s3_aws_folder_name?.endsWith('/')
      ? audienceSettings?.s3_aws_folder_name
      : `${audienceSettings?.s3_aws_folder_name}/`
    const credentials = await this.assumeRole()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken
      }
    })

    const objectKey = folderName ? `${folderName}${filename}` : filename
    const uploadParams: PutObjectCommandInput = {
      Bucket: bucketName,
      Key: objectKey,
      Body: fileContent,
      ContentType: 'text/csv'
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await s3Client.send(new PutObjectCommand(uploadParams))
      return { statusCode: 200, message: 'Upload successful' }
    } catch (err) {
      throw new Error(`Non-retryable error: ${err}`)
    }
  }
}
