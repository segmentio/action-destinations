import { createTestEvent, SegmentEvent, createTestIntegration } from '@segment/actions-core'
import { Settings } from '../../generated-types'
import Destination from '../../index'
import { Client } from '../../client'
import { generateFile } from '../../functions'

jest.mock('../../client', () => {
  const mockAssumeRole = jest.fn();
  const mockUploadS3 = jest.fn();

  return {
    Client: jest.fn().mockImplementation(() => ({
      assumeRole: mockAssumeRole,
      uploadS3: mockUploadS3,
      roleArn: 'mockRoleArn',
      roleSessionName: 'mockSessionName',
      region: 'us-east-1',
      externalId: 'mockExternalId',
    }))
  }
})

const payload = {
  timestamp: '2024-01-08T13:52:50.212Z',
  event: 'Custom Event 1',
  messageId: 'aaa-bbb-ccc',
  type: 'track',
  userId: 'user_id_1',
  anonymousId: 'anonymous_id_1',
  integrations: {},
  context: {
    traits: {
      first_name: 'John',
      last_name: 'Doe',
      email: "test@test.com"
    },
    personas: {
      computation_key: "audience_name_1",
      computation_id: "audience_id_1",
      space_id: "space_id_1"
    }
  },
  properties: {
    prop_str: 'Hello String!',
    prop_num: 123.45,
    prop_bool: true,
    prop_datetime: '2024-01-08T13:52:50.212Z',
    prop_date: '2024-01-08',
    prop_obj: {
      key1: 'value1',
      key2: 'value2'
    },
    prop_arr: ['value1', 'value2'],
    custom_field_1: 'Custom Field Value 1',
    custom_field_2: 'Custom Field Value 2'
  }
} as Partial<SegmentEvent>

const settings: Settings = {
  iam_role_arn: 'test_iam_role_arn',
  s3_aws_bucket_name: 'test_bucket_name',
  s3_aws_region: 'us-east-1',
  iam_external_id: 'test_external_id'
}

const mapping = {
  columns: {
    event_name: { '@path': '$.event' },
    event_timestamp: { '@path': '$.timestamp' },
    user_id: { '@path': '$.userId' },
    anonymous_id: 'anonymousId',
    email: { '@path': '$.context.traits.email' },
    properties: { '@path': '$.properties' },
    traits: { '@path': '$.context.traits' },
    context: { '@path': '$.context' },
    timestamp: { '@path': '$.timestamp' },
    message_id: { '@path': '$.messageId' },
    integrations: { '@path': '$.integrations' },
    audience_name: { '@path': '$.context.personas.computation_key' },
    audience_id: { '@path': '$.context.personas.computation_id' },
    audience_space_id: { '@path': '$.context.personas.space_id'},
    'Custom Field Name 1' : { '@path': '$.properties.custom_field_1' },
    'Custom Field Name 2' : { '@path': '$.properties.custom_field_2' }
  },
  audience_action_column_name: 'audience_action',
  computation_key: { '@path': '$.context.personas.computation_key' },
  s3_aws_folder_name: 'test_folder_name',
  filename_prefix: 'test_filename_prefix',
  delimiter: ',',
  file_extension: 'csv',
}

const event = createTestEvent(payload)

const testDestination = createTestIntegration(Destination)

describe('s3.syncToS3', () => {
  describe('client.uploadS3', () => {

    it('Should send correct payload to S3', async () => {
      


      const generateFileSpy = jest.spyOn(require('../../functions'), 'generateFile');

      await testDestination.testAction('syncToS3', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(Client).toHaveBeenCalledWith("us-east-1", "test_iam_role_arn", "test_external_id")

      expect(generateFileSpy).toHaveBeenCalled()

    })
  })
})