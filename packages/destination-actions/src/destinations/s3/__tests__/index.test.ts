import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
// import { Settings } from '../generated-types'
import nock from 'nock'
// import syncToS3 from '../syncToS3'
const destination = createTestIntegration(Definition)

describe('S3 Destination', () => {
  // const s3BaseURL = 'https://s3.amazonaws.com'

  beforeEach(() => {
    nock.cleanAll() // Clear any previous nock interceptors
  })

  it('should have the correct destination structure', () => {
    console.log(destination.definition.name, destination.definition.slug)
    expect(destination).toBeDefined()
    expect(destination.definition.name).toEqual('AWS S3')
    expect(destination.definition.slug).toEqual('actions-s3')
    expect(destination.definition.mode).toEqual('cloud')
    expect(destination.definition.description).toEqual('Sync Segment event data to AWS S3.')

    // Ensure authentication fields are defined properly
    expect(destination.authentication).toHaveProperty('scheme', 'custom')
    expect(destination.authentication?.fields).toHaveProperty('iam_role_arn')
    expect(destination.authentication?.fields.iam_role_arn).toHaveProperty('type', 'string')
    expect(destination.authentication?.fields.iam_role_arn).toHaveProperty('required', true)

    expect(destination.authentication?.fields).toHaveProperty('s3_aws_bucket_name')
    expect(destination.authentication?.fields.s3_aws_bucket_name).toHaveProperty('type', 'string')
    expect(destination.authentication?.fields.s3_aws_bucket_name).toHaveProperty('required', true)

    expect(destination.authentication?.fields).toHaveProperty('s3_aws_region')
    expect(destination.authentication?.fields.s3_aws_region).toHaveProperty('type', 'string')
    expect(destination.authentication?.fields.s3_aws_region).toHaveProperty('required', true)

    expect(destination.authentication?.fields).toHaveProperty('iam_external_id')
    expect(destination.authentication?.fields.iam_external_id).toHaveProperty('type', 'password')
    expect(destination.authentication?.fields.iam_external_id).toHaveProperty('required', true)

    // // Validate actions
    // expect(destination.actions).toHaveProperty('syncToS3')
  })
})
