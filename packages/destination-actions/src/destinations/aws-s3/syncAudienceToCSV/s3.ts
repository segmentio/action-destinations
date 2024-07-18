import { AudienceSettings, Settings } from '../generated-types'
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
import { S3Client, PutObjectCommandInput, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from '@lukeed/uuid'
import * as process from 'process'

interface Credentials {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
}

export class S3CSVClient {
  roleArn: string
  roleSessionName: string
  region: string

  constructor(region: string, roleArn: string) {
    this.region = region
    this.roleSessionName = uuidv4()
    this.roleArn = roleArn
  }

  async assumeRole(): Promise<Credentials> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const stsClient = new STSClient({ region: 'us-west-2' })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const command = new AssumeRoleCommand({
      RoleArn: process.env.ACTIONS_S3_INTERMEDIARY_ROLE_ARN,
      RoleSessionName: this.roleSessionName
    })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const response = await stsClient.send(command)

    if (!response.Credentials) {
      throw new Error('Failed to assume role and get temporary credentials')
    }

    if (
      response.Credentials &&
      response.Credentials.AccessKeyId &&
      response.Credentials.SecretAccessKey &&
      response.Credentials.SessionToken
    ) {
      const intermediaryCreds = {
        accessKeyId: response.Credentials.AccessKeyId,
        secretAccessKey: response.Credentials.SecretAccessKey,
        sessionToken: response.Credentials.SessionToken
      }

      const newStsClient = new STSClient({
        region: this.region,
        credentials: intermediaryCreds
      })

      const newCreds = await newStsClient.send(
        new AssumeRoleCommand({
          RoleArn: this.roleArn,
          RoleSessionName: this.roleSessionName
        })
      )
      return {
        accessKeyId: newCreds.Credentials?.AccessKeyId ?? '',
        secretAccessKey: newCreds.Credentials?.SecretAccessKey ?? '',
        sessionToken: newCreds.Credentials?.SessionToken ?? ''
      }
    } else {
      throw new Error('Credentials are not properly defined')
    }
  }

  async uploadS3(settings: Settings, audienceSettings: AudienceSettings, fileContent: string) {
    let filename = audienceSettings.filename ?? ''
    const dateSuffix = new Date().toISOString().replace(/[:.]/g, '-')

    if (filename.endsWith('.csv')) {
      // Insert the date suffix before the .csv extension
      filename = filename.replace('.csv', `_${dateSuffix}.csv`)
    } else {
      // Append the date suffix followed by .csv
      filename = filename ? `${filename}_${dateSuffix}.csv` : `${dateSuffix}.csv`
    }

    const bucketName = settings.s3_aws_bucket_name
    const folderName = audienceSettings.s3_aws_folder_name || ''
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
