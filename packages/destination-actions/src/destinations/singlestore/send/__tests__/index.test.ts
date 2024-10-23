import nock from 'nock'
import { SegmentEvent } from '@segment/actions-core'
import { Settings } from '../../generated-types'
import { getProducerRecord, getKafkaConfiguration } from '../../util'

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
  nock.cleanAll()
  done()
})

describe('SingleStore.send', () => {
  it('create the correct kakfkaConfig, kafkaTopic and producerRecord objects', async () => {
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
          'b9da30af98f4491f1657eb53063efe2a15b75c6cb480ef4e75ccea989fed6a12303491a4132d0c60723137b50891152d8cdcdcd8dc6ee6dda83a07938fa302e8dbc187e6a09ddf9385a0a11c7568b278',
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
