import nock from 'nock'
import { SegmentEvent } from '@segment/actions-core'
import { Settings } from '../../generated-types'
import { getProducerRecord, getKafkaConfiguration } from '../../util'

const originalEnv = process.env

const timestamp = '2024-01-08T13:52:50.212Z'
const settings: Settings = {
  host: 'testhost',
  port: 3306,
  username: 'testuser',
  password: 'testpassword',
  dbName: 'testdb',
  environment: 'Prod'
}

const validPayload = {
  timestamp: timestamp,
  event: 'Test Track Event',
  messageId: 'aaa-bbb-ccc',
  type: 'track',
  userId: 'user_id_1',
  properties: {
    custom_prop_str: 'Hello String!',
    custom_prop_number: 123.45,
    custom_prop_bool: true,
    custom_prop_numberish_string: 123.45,
    custom_prop_boolish_string: true,
    custom_prop_boolish_string_2: false,
    custom_prop_datetime: '2024-01-08T13:52:50.212Z',
    custom_prop_date: '2024-01-08',
    custom_prop_obj: {
      key1: 'value1',
      key2: 'value2'
    },
    custom_prop_arr: ['value1', 'value2']
  }
} as Partial<SegmentEvent>

beforeEach((done) => {
  process.env = { ...originalEnv }
  nock.cleanAll()
  done()
})

afterEach(() => {
  process.env = originalEnv
})

describe('SingleStore.send', () => {
  it('create the correct kakfkaConfig, kafkaTopic and producerRecord objects', async () => {
    
    process.env.ACTIONS_SINGLE_STORE_ENCRYPTION_KEY = '47369146128f9c61f1349d3b277c26fbfd659cb82db8130f85f9b05c6d1f3268'
    process.env.ACTIONS_SINGLE_STORE_X_SECURITY_KEY = '47369146128f9c61f1349d3b277c26fbfd659cb82db8130f85f9b05c6d1f3268'
    process.env.ACTIONS_SINGLE_STORE_IV = 'e7e7cd503bb16df99445af9deb4d06f2'
    
    const expectedKafkaTopic = '51e8049b5eff6e0c42012b596d46fcdb27457e71e5195db3e8f241e0b380ed08'
    const expectedKafkaConfig = {
      clientId: 'singlestore_segment_destination',
      brokers: [
        'b-3-public.singlestoretestcluste.rj6efu.c20.kafka.us-east-1.amazonaws.com:9196',
        'b-2-public.singlestoretestcluste.rj6efu.c20.kafka.us-east-1.amazonaws.com:9196',
        'b-1-public.singlestoretestcluste.rj6efu.c20.kafka.us-east-1.amazonaws.com:9196'
      ],
      sasl: {
        username: '8bf14023d114c2d31ea66b5227c9bcc1e2bb81fc9f95a338732f1c32a507c75d',
        password:
          '4ee754fe349da9fa8dbff42403d312bc1d9ad78fe1e6e6195359ec4f76e7458eaa83037a596420c14f95bff32cec4f34e532b07ccdb237ca2141de8e8190caa9f399df075dc8362517ae6467b627d812',
        mechanism: 'scram-sha-512'
      },
      ssl: true
    }
    const expectedProducerRecord = {
      topic: '51e8049b5eff6e0c42012b596d46fcdb27457e71e5195db3e8f241e0b380ed08',
      messages: [
        {
          value:
            '{"timestamp":"2024-01-08T13:52:50.212Z","event":"Test Track Event","messageId":"aaa-bbb-ccc","type":"track","userId":"user_id_1","properties":{"custom_prop_str":"Hello String!","custom_prop_number":123.45,"custom_prop_bool":true,"custom_prop_numberish_string":123.45,"custom_prop_boolish_string":true,"custom_prop_boolish_string_2":false,"custom_prop_datetime":"2024-01-08T13:52:50.212Z","custom_prop_date":"2024-01-08","custom_prop_obj":{"key1":"value1","key2":"value2"},"custom_prop_arr":["value1","value2"]}}'
        }
      ]
    }

    const { kafkaConfig, kafkaTopic } = getKafkaConfiguration(settings)
    const producerRecord = getProducerRecord(kafkaTopic, validPayload)
    expect(expectedKafkaTopic).toEqual(kafkaTopic)
    expect(expectedKafkaConfig).toEqual(kafkaConfig)
    expect(expectedProducerRecord).toEqual(producerRecord)
  })
})
