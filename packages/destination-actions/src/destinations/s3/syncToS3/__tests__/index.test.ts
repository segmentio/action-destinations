import { generateFile } from '../../functions' // Adjust the import path
import { Payload } from '../generated-types'
import { clean, encodeString, getAudienceAction } from '../../functions'
import { ColumnHeader } from '../../types'

describe('clean', () => {
  it('should remove delimiter from string', () => {
    expect(clean(',', 'abcd,Efg')).toEqual('abcdEfg')
  })

  it('should handle undefined input', () => {
    expect(clean(',', '')).toBe('')
  })

  it('should handle empty string', () => {
    expect(clean('')).toBe('')
  })
})

describe('encodeString', () => {
  it('should return a string enclosed in double quotes and escaped', () => {
    expect(encodeString('value')).toBe('"value"')
    expect(encodeString('value "with quotes"')).toBe('"value ""with quotes"""')
  })
})

describe('getAudienceAction', () => {
  it('should return undefined if traits_or_props or computation_key are not defined', () => {
    const payload: Payload = {
      traits_or_props: undefined,
      computation_key: '',
      columns: {},
      delimiter: ',',
      enable_batching: false,
      file_extension: 'csv'
    }
    expect(getAudienceAction(payload)).toBeUndefined()
  })

  it('should return the correct boolean value based on traits_or_props and computation_key', () => {
    const payload: Payload = {
      traits_or_props: { key: true },
      computation_key: 'key',
      columns: {},
      delimiter: ',',
      enable_batching: false,
      file_extension: 'csv'
    }
    expect(getAudienceAction(payload)).toBe(true)
  })
})

describe('generateFile', () => {
  const payloads: Payload[] = [
    {
      columns: {
        event_name: 'Custom Event 1',
        event_type: 'track',
        user_id: 'user_id_1',
        anonymous_id: 'anonymous_id_1',
        email: 'test@test.com',
        properties: {
          prop_str: 'Hello String!',
          prop_num: 123.45,
          prop_bool: true,
          prop_datetime: '2024-01-08T13:52:50.212Z',
          prop_date: '2024-01-08',
          prop_obj: { key1: 'value1', key2: 'value2' },
          prop_arr: ['value1', 'value2'],
          custom_field_1: 'Custom Field Value 1',
          custom_field_2: 'Custom Field Value 2'
        },
        traits: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'test@test.com'
        },
        context: {
          traits: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'test@test.com'
          },
          personas: {
            computation_key: 'audience_name_1',
            computation_id: 'audience_id_1',
            space_id: 'space_id_1'
          }
        },
        timestamp: '2024-01-08T13:52:50.212Z',
        message_id: 'aaa-bbb-ccc',
        integrations: {},
        audience_name: 'audience_name_1',
        audience_id: 'audience_id_1',
        audience_space_id: 'space_id_1',
        'Custom Field 1': 'Custom Field Value 1',
        'Custom Field 2': 'Custom Field Value 2'
      },
      audience_action_column_name: 'audience_action',
      batch_size_column_name: 'batch_size',
      traits_or_props: {
        audience_name_1: true,
        prop_str: 'Hello String!',
        prop_num: 123.45,
        prop_bool: true,
        prop_datetime: '2024-01-08T13:52:50.212Z',
        prop_date: '2024-01-08',
        prop_obj: { key1: 'value1', key2: 'value2' },
        prop_arr: ['value1', 'value2'],
        custom_field_1: 'Custom Field Value 1',
        custom_field_2: 'Custom Field Value 2'
      },
      computation_key: 'audience_name_1',
      enable_batching: true,
      batch_size: 5000,
      delimiter: ',',
      file_extension: 'csv',
      s3_aws_folder_name: 'foldername1'
    }
  ]

  const headers: ColumnHeader[] = [
    { cleanName: 'event_name', originalName: 'event_name' },
    { cleanName: 'event_type', originalName: 'event_type' },
    { cleanName: 'user_id', originalName: 'user_id' },
    { cleanName: 'anonymous_id', originalName: 'anonymous_id' },
    { cleanName: 'email', originalName: 'email' },
    { cleanName: 'properties', originalName: 'properties' },
    { cleanName: 'traits', originalName: 'traits' },
    { cleanName: 'context', originalName: 'context' },
    { cleanName: 'timestamp', originalName: 'timestamp' },
    { cleanName: 'message_id', originalName: 'message_id' },
    { cleanName: 'integrations', originalName: 'integrations' },
    { cleanName: 'audience_name', originalName: 'audience_name' },
    { cleanName: 'audience_id', originalName: 'audience_id' },
    { cleanName: 'audience_space_id', originalName: 'audience_space_id' },
    { cleanName: 'Custom Field 1', originalName: 'Custom Field 1' },
    { cleanName: 'Custom Field 2', originalName: 'Custom Field 2' },
    { cleanName: 'audience_action', originalName: 'audience_action' },
    { cleanName: 'batch_size', originalName: 'batch_size' }
  ]

  const output = `event_name,event_type,user_id,anonymous_id,email,properties,traits,context,timestamp,message_id,integrations,audience_name,audience_id,audience_space_id,Custom Field 1,Custom Field 2,audience_action,batch_size\n"Custom Event 1","track","user_id_1","anonymous_id_1","test@test.com","{""prop_str"":""Hello String!"",""prop_num"":123.45,""prop_bool"":true,""prop_datetime"":""2024-01-08T13:52:50.212Z"",""prop_date"":""2024-01-08"",""prop_obj"":{""key1"":""value1"",""key2"":""value2""},""prop_arr"":[""value1"",""value2""],""custom_field_1"":""Custom Field Value 1"",""custom_field_2"":""Custom Field Value 2""}","{""first_name"":""John"",""last_name"":""Doe"",""email"":""test@test.com""}","{""traits"":{""first_name"":""John"",""last_name"":""Doe"",""email"":""test@test.com""},""personas"":{""computation_key"":""audience_name_1"",""computation_id"":""audience_id_1"",""space_id"":""space_id_1""}}","2024-01-08T13:52:50.212Z","aaa-bbb-ccc","{}","audience_name_1","audience_id_1","space_id_1","Custom Field Value 1","Custom Field Value 2","true","1"`

  it('should generate a CSV file with correct content', () => {
    const result = generateFile(payloads, headers, ',', 'audience_action', 'batch_size')
    expect(result).toEqual(output)
  })
})
