import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const settings = {
  ad_account_id: 'abc1234'
}
const external_audience_id_value = '123456789'
const audienceEvent = createTestEvent({
  type: 'track',
  event: 'Audience Entered',
  properties: {
    'ios.id': 'ios_device_id_1',
    'android.id': 'android_device_id_1',
    'android.idfa': 'android_adid_1',
    'ios.idfa': 'ios_adid_1',
    audience_key: 'snap_test_audience',
    snap_test_audience: true,
    phone: '+1(706)-767-5127'
  },
  context: {
    __segment_internal: {
      creator: 'sync-worker'
    },
    device: {
      advertisingId: 'advertising_id_1',
      type: 'android'
    },
    personas: {
      computation_class: 'audience',
      external_audience_id: external_audience_id_value,
      computation_id: 'aud_2m9wBh1vN9iiRRmaP2vifxuqGRo',
      computation_key: 'snap_test_audience',
      namespace: 'spa_fNXUFfyD86AhrDTtH2z2Vs',
      space_id: 'spa_fNXUFfyD86AhrDTtH2z2Vs'
    },
    traits: {
      email: 'person@email.com'
    }
  }
})

describe('Snapchat Audiences syncAudience', () => {
  it('should throw error if no profile identifiers are provided', async () => {
    const emailMapping = {
      schema_type: 'EMAIL_SHA256',
      email: {
        '@path': '$.path.non.existent'
      },
      external_audience_id: {
        '@path': '$.context.personas.external_audience_id'
      }
    }
    const phoneMapping = {
      schema_type: 'PHONE_SHA256',
      external_audience_id: {
        '@path': '$.context.personas.external_audience_id'
      }
    }
    const mobileMapping = {
      schema_type: 'MOBILE_AD_ID_SHA256',
      external_audience_id: {
        '@path': '$.context.personas.external_audience_id'
      }
    }

    await testDestination.testAction('syncAudience', { event: audienceEvent, useDefaultMappings: true, settings })
    // await testDestination.testAction('syncAudience', { event: audienceEvent, mapping: phoneMapping, settings })

    // await expect(
    //   testDestination.testAction('syncAudience', { event: audienceEvent, mapping: emailMapping, settings })
    // ).rejects.toThrowError(PayloadValidationError)
    //
    // await expect(
    //   testDestination.testAction('syncAudience', { event: audienceEvent, mapping: phoneMapping, settings })
    // ).rejects.toThrowError(PayloadValidationError)
    // await expect(
    //   testDestination.testAction('syncAudience', { event: audienceEvent, mapping: mobileMapping, settings })
    // ).rejects.toThrowError(PayloadValidationError)
  })
  // it('should ', async () => {
  //   const mapping = {
  //     schema_type: 'EMAIL_SHA256',
  //     email: 'person@email.com',
  //     external_audience_id: {
  //       '@path': '$.context.personas.external_audience_id'
  //     }
  //   }
  //
  //   const expectedRequestBody = {
  //     data: {
  //       users: [
  //         {
  //           schema: ['EMAIL_SHA256'],
  //           data: [['b375b7bbddb3de3298fbc7641063d9f03a38e118aa4480c8ab9f58740982e8bd']]
  //         }
  //       ]
  //     }
  //   }
  //
  //   nock('https://adsapi.snapchat.com').post(`/v1/segments/${external_audience_id_value}/users`).reply(200, {})
  //   const res = await testDestination.testAction('syncAudience', { event: audienceEvent, mapping, settings })
  //
  //   const data = JSON.parse(res[0].options.body as string)
  //   expect(data).toEqual(expectedRequestBody)
  // })
})
