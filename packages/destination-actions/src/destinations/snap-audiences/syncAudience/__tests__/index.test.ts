import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import Destination from '../../index'
import { processHashing } from '../../../../lib/hashing-utils'
import { normalize, normalizePhone } from '../utils'

const testDestination = createTestIntegration(Destination)

const settings = {
  ad_account_id: 'abc1234'
}
const external_audience_id_value = '123456789'
const audienceEventEntered = createTestEvent({
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
const audienceEventExited = createTestEvent({
  type: 'track',
  event: 'Audience Exited',
  properties: {
    'ios.id': 'ios_device_id_1',
    'android.id': 'android_device_id_1',
    'android.idfa': 'android_adid_1',
    'ios.idfa': 'ios_adid_1',
    audience_key: 'snap_test_audience',
    snap_test_audience: false,
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
  it('should throw error if no profile identifier is present', async () => {
    const emailMapping = {
      schema_type: 'EMAIL_SHA256',
      external_audience_id: {
        '@path': '$.context.personas.external_audience_id'
      },
      audienceKey: {
        '@path': '$.context.personas.computation_key'
      },
      props: {
        '@path': '$.properties'
      },
      enable_batching: false
    }
    const phoneMapping = {
      schema_type: 'PHONE_SHA256',
      external_audience_id: {
        '@path': '$.context.personas.external_audience_id'
      },
      audienceKey: {
        '@path': '$.context.personas.computation_key'
      },
      props: {
        '@path': '$.properties'
      },
      enable_batching: false
    }
    const mobileMapping = {
      schema_type: 'MOBILE_AD_ID_SHA256',
      external_audience_id: {
        '@path': '$.context.personas.external_audience_id'
      },
      audienceKey: {
        '@path': '$.context.personas.computation_key'
      },
      props: {
        '@path': '$.properties'
      },
      enable_batching: false
    }
    await expect(
      testDestination.testAction('syncAudience', { event: audienceEventEntered, mapping: emailMapping, settings })
    ).rejects.toThrowError(PayloadValidationError)
    await expect(
      testDestination.testAction('syncAudience', { event: audienceEventEntered, mapping: phoneMapping, settings })
    ).rejects.toThrowError(PayloadValidationError)
    await expect(
      testDestination.testAction('syncAudience', { event: audienceEventEntered, mapping: mobileMapping, settings })
    ).rejects.toThrowError(PayloadValidationError)
  })
  it('should normalize and hash identifiers', async () => {
    const email1 = 'person@email.com'
    const email2 = 'Person@email.com'
    const email3 = 'Person@email.com '
    const hashedEmail = 'b375b7bbddb3de3298fbc7641063d9f03a38e118aa4480c8ab9f58740982e8bd'
    const email1Res = processHashing(email1, 'sha256', 'hex', normalize)
    const email2Res = processHashing(email2, 'sha256', 'hex', normalize)
    const email3Res = processHashing(email3, 'sha256', 'hex', normalize)
    const alreadyHashedResEmail = processHashing(hashedEmail, 'sha256', 'hex', normalize)
    expect(email1Res).toEqual(hashedEmail)
    expect(email2Res).toEqual(hashedEmail)
    expect(email3Res).toEqual(hashedEmail)
    expect(alreadyHashedResEmail).toEqual(hashedEmail)

    const phone1 = '+1(706)-767-5127'
    const phone2 = '001(706)-767-5127'
    const phone3 = '01(706)-767-5127'
    const hashedPhone = '2fd199db6d3fa9fe754886ff1822f2867fcb104a6639495eca25c2978efe4ed4'
    const phone1Res = processHashing(phone1, 'sha256', 'hex', normalizePhone)
    const phone2Res = processHashing(phone2, 'sha256', 'hex', normalizePhone)
    const phone3Res = processHashing(phone3, 'sha256', 'hex', normalizePhone)
    const alreadyHashedResPhone = processHashing(hashedPhone, 'sha256', 'hex', normalizePhone)
    expect(phone1Res).toEqual(hashedPhone)
    expect(phone2Res).toEqual(hashedPhone)
    expect(phone3Res).toEqual(hashedPhone)
    expect(alreadyHashedResPhone).toEqual(hashedPhone)

    const mobileAdId1 = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6'
    const mobileAdId2 = 'F81D4FAE-7DEC-11D0-A765-00A0C91E6BF6'
    const hashedMobileAdId = '30a5154b77ab8b2ddbe19f5e7af72f33cc2a4a41f22940d965102650a1c72863'
    const mobileAdId1Res = processHashing(mobileAdId1, 'sha256', 'hex', normalize)
    const mobileAdId2Res = processHashing(mobileAdId2, 'sha256', 'hex', normalize)
    const alreadyHashedResMobileAdId = processHashing(hashedMobileAdId, 'sha256', 'hex', normalize)
    expect(mobileAdId1Res).toEqual(hashedMobileAdId)
    expect(mobileAdId2Res).toEqual(hashedMobileAdId)
    expect(alreadyHashedResMobileAdId).toEqual(hashedMobileAdId)
  })
  it('should send profile with email', async () => {
    const mapping = {
      schema_type: 'EMAIL_SHA256',
      email: 'person@email.com',
      external_audience_id: {
        '@path': '$.context.personas.external_audience_id'
      },
      audienceKey: {
        '@path': '$.context.personas.computation_key'
      },
      props: {
        '@path': '$.properties'
      },
      enable_batching: false
    }

    const emailRequestBody = {
      users: [
        {
          schema: ['EMAIL_SHA256'],
          data: [['b375b7bbddb3de3298fbc7641063d9f03a38e118aa4480c8ab9f58740982e8bd']]
        }
      ]
    }

    nock('https://adsapi.snapchat.com').post(`/v1/segments/${external_audience_id_value}/users`).reply(200, {})
    nock('https://adsapi.snapchat.com').delete(`/v1/segments/${external_audience_id_value}/users`).reply(200, {})
    // audience entered
    const resEntered = await testDestination.testAction('syncAudience', {
      event: audienceEventEntered,
      mapping,
      settings
    })
    const dataEntered = JSON.parse(resEntered[0].options.body as string)
    const methodEntered = resEntered[0].options.method
    expect(dataEntered).toEqual(emailRequestBody)
    expect(methodEntered).toEqual('POST')

    // audience exited
    const resExited = await testDestination.testAction('syncAudience', {
      event: audienceEventExited,
      mapping,
      settings
    })
    const dataExited = JSON.parse(resExited[0].options.body as string)
    const methodExited = resExited[0].options.method
    expect(dataExited).toEqual(emailRequestBody)
    expect(methodExited).toEqual('DELETE')
  })
  it('should send profile with phone number', async () => {
    const mapping = {
      schema_type: 'PHONE_SHA256',
      phone: '+1(706)-767-5127',
      external_audience_id: {
        '@path': '$.context.personas.external_audience_id'
      },
      audienceKey: {
        '@path': '$.context.personas.computation_key'
      },
      props: {
        '@path': '$.properties'
      },
      enable_batching: false
    }

    const phoneRequestBody = {
      users: [
        {
          schema: ['PHONE_SHA256'],
          // hash of 17067675127
          data: [['2fd199db6d3fa9fe754886ff1822f2867fcb104a6639495eca25c2978efe4ed4']]
        }
      ]
    }

    nock('https://adsapi.snapchat.com').post(`/v1/segments/${external_audience_id_value}/users`).reply(200, {})
    nock('https://adsapi.snapchat.com').delete(`/v1/segments/${external_audience_id_value}/users`).reply(200, {})
    // audience entered
    const resEntered = await testDestination.testAction('syncAudience', {
      event: audienceEventEntered,
      mapping,
      settings
    })
    const dataEntered = JSON.parse(resEntered[0].options.body as string)
    const methodEntered = resEntered[0].options.method
    expect(dataEntered).toEqual(phoneRequestBody)
    expect(methodEntered).toEqual('POST')

    // audience exited
    const resExited = await testDestination.testAction('syncAudience', {
      event: audienceEventExited,
      mapping,
      settings
    })
    const dataExited = JSON.parse(resExited[0].options.body as string)
    const methodExited = resExited[0].options.method
    expect(dataExited).toEqual(phoneRequestBody)
    expect(methodExited).toEqual('DELETE')
  })
  it('should send profile with advertiserId', async () => {
    const mapping = {
      schema_type: 'MOBILE_AD_ID_SHA256',
      advertising_id: '38400000-8cf0-11bd-b23e-10b96e40000d',
      external_audience_id: {
        '@path': '$.context.personas.external_audience_id'
      },
      audienceKey: {
        '@path': '$.context.personas.computation_key'
      },
      props: {
        '@path': '$.properties'
      },
      enable_batching: false
    }

    const mobileAdIdRequestBody = {
      users: [
        {
          schema: ['MOBILE_AD_ID_SHA256'],
          data: [['d4181bb455a74b3bc8b37c75ac9b2c702eb6b9930bd040b861403b31ca85634d']]
        }
      ]
    }

    nock('https://adsapi.snapchat.com').post(`/v1/segments/${external_audience_id_value}/users`).reply(200, {})
    nock('https://adsapi.snapchat.com').delete(`/v1/segments/${external_audience_id_value}/users`).reply(200, {})
    // audience entered
    const resEntered = await testDestination.testAction('syncAudience', {
      event: audienceEventEntered,
      mapping,
      settings
    })
    const dataEntered = JSON.parse(resEntered[0].options.body as string)
    const methodEntered = resEntered[0].options.method
    expect(dataEntered).toEqual(mobileAdIdRequestBody)
    expect(methodEntered).toEqual('POST')

    // audience exited
    const resExited = await testDestination.testAction('syncAudience', {
      event: audienceEventExited,
      mapping,
      settings
    })
    const dataExited = JSON.parse(resExited[0].options.body as string)
    const methodExited = resExited[0].options.method
    expect(dataExited).toEqual(mobileAdIdRequestBody)
    expect(methodExited).toEqual('DELETE')
  })
  it('should send batched requests', async () => {
    const mapping = {
      schema_type: 'EMAIL_SHA256',
      email: {
        '@path': '$.context.traits.email'
      },
      external_audience_id: { '@path': '$.context.personas.external_audience_id' },
      audienceKey: {
        '@path': '$.context.personas.computation_key'
      },
      props: {
        '@path': '$.properties'
      },
      enable_batching: true
    }

    const audienceEvent1 = createTestEvent({
      type: 'track',
      event: 'Audience Entered',
      properties: {
        audience_key: 'snap_test_audience',
        snap_test_audience: true
      },
      context: {
        personas: {
          external_audience_id: external_audience_id_value,
          computation_key: 'snap_test_audience'
        },
        traits: {
          email: 'person1@email.com'
        }
      }
    })
    const audienceEvent2 = createTestEvent({
      type: 'track',
      event: 'Audience Entered',
      properties: {
        audience_key: 'snap_test_audience',
        snap_test_audience: true
      },
      context: {
        personas: {
          external_audience_id: external_audience_id_value,
          computation_key: 'snap_test_audience'
        },
        traits: {
          email: 'person2@email.com'
        }
      }
    })
    const audienceEvent3 = createTestEvent({
      type: 'track',
      event: 'Audience Entered',
      properties: {
        audience_key: 'snap_test_audience',
        snap_test_audience: true
      },
      context: {
        personas: {
          external_audience_id: external_audience_id_value,
          computation_key: 'snap_test_audience'
        },
        traits: {
          email: 'person3@email.com'
        }
      }
    })

    const events = [audienceEvent1, audienceEvent2, audienceEvent3]

    const batchRequestBody = {
      users: [
        {
          schema: ['EMAIL_SHA256'],
          data: [
            ['0cd62bbd033e887666ab6ed1359253583b2c41e1c16b588e0fd58610233cf715'],
            ['63b19a92fdc0a26b003f8adebbc85e04e4ed437fbb2d1ea02e543e3b40ec3153'],
            ['be0cd3d2367d1e0e4d690fc2ecf4049b4693d840ebf5e0aeed216e43942dee0b']
          ]
        }
      ]
    }

    nock('https://adsapi.snapchat.com').post(`/v1/segments/${external_audience_id_value}/users`).reply(200, {})
    const res = await testDestination.testBatchAction('syncAudience', { events, mapping, settings })
    const data = JSON.parse(res[0].options.body as string)
    const method = res[0].options.method
    expect(data).toEqual(batchRequestBody)
    expect(method).toEqual('POST')
  })
  it('should send sorted (entered/exited) batched requests', async () => {
    const mapping = {
      schema_type: 'EMAIL_SHA256',
      email: {
        '@path': '$.context.traits.email'
      },
      external_audience_id: {
        '@path': '$.context.personas.external_audience_id'
      },
      audienceKey: {
        '@path': '$.context.personas.computation_key'
      },
      props: {
        '@path': '$.properties'
      },
      enable_batching: true
    }

    const audienceEvent1 = createTestEvent({
      type: 'track',
      event: 'Audience Entered',
      properties: {
        audience_key: 'snap_test_audience',
        snap_test_audience: true
      },
      context: {
        personas: {
          external_audience_id: external_audience_id_value,
          computation_key: 'snap_test_audience'
        },
        traits: {
          email: 'person1@email.com'
        }
      }
    })
    const audienceEvent2 = createTestEvent({
      type: 'track',
      event: 'Audience Entered',
      properties: {
        audience_key: 'snap_test_audience',
        snap_test_audience: true
      },
      context: {
        personas: {
          external_audience_id: external_audience_id_value,
          computation_key: 'snap_test_audience'
        },
        traits: {
          email: 'person2@email.com'
        }
      }
    })
    const audienceEvent3 = createTestEvent({
      type: 'track',
      event: 'Audience Exited',
      properties: {
        audience_key: 'snap_test_audience',
        snap_test_audience: false
      },
      context: {
        personas: {
          external_audience_id: external_audience_id_value,
          computation_key: 'snap_test_audience'
        },
        traits: {
          email: 'person3@email.com'
        }
      }
    })
    const audienceEvent4 = createTestEvent({
      type: 'track',
      event: 'Audience Exited',
      properties: {
        audience_key: 'snap_test_audience',
        snap_test_audience: false
      },
      context: {
        personas: {
          external_audience_id: external_audience_id_value,
          computation_key: 'snap_test_audience'
        },
        traits: {
          email: 'person4@email.com'
        }
      }
    })

    const events = [audienceEvent1, audienceEvent2, audienceEvent3, audienceEvent4]

    const batchEnteredRequestBody = {
      users: [
        {
          schema: ['EMAIL_SHA256'],
          data: [
            ['0cd62bbd033e887666ab6ed1359253583b2c41e1c16b588e0fd58610233cf715'],
            ['63b19a92fdc0a26b003f8adebbc85e04e4ed437fbb2d1ea02e543e3b40ec3153']
          ]
        }
      ]
    }

    const batchExitedRequestBody = {
      users: [
        {
          schema: ['EMAIL_SHA256'],
          data: [
            ['be0cd3d2367d1e0e4d690fc2ecf4049b4693d840ebf5e0aeed216e43942dee0b'],
            ['297aad46b6b13a893b4d4e05486a1a825eeb3b03b6799d6072e7cfb5eef3adb6']
          ]
        }
      ]
    }
    nock('https://adsapi.snapchat.com').post(`/v1/segments/${external_audience_id_value}/users`).reply(200, {})
    nock('https://adsapi.snapchat.com').delete(`/v1/segments/${external_audience_id_value}/users`).reply(200, {})

    const res = await testDestination.testBatchAction('syncAudience', { events, mapping, settings })
    const dataEntered = JSON.parse(res[0].options.body as string)
    const dataExited = JSON.parse(res[1].options.body as string)
    const methodEntered = res[0].options.method
    const methodExited = res[1].options.method

    expect(dataEntered).toEqual(batchEnteredRequestBody)
    expect(methodEntered).toEqual('POST')
    expect(dataExited).toEqual(batchExitedRequestBody)
    expect(methodExited).toEqual('DELETE')
  })
  it('should throw error if no profile identifiers are present', async () => {
    const mapping = {
      schema_type: 'EMAIL_SHA256',
      email: {
        '@path': '$.context.traits.email'
      },
      external_audience_id: {
        '@path': '$.context.personas.external_audience_id'
      },
      audienceKey: {
        '@path': '$.context.personas.computation_key'
      },
      props: {
        '@path': '$.properties'
      },
      enable_batching: true
    }

    const audienceEvent1 = createTestEvent({
      type: 'track',
      event: 'Audience Entered',
      properties: {
        audience_key: 'snap_test_audience',
        snap_test_audience: true
      },
      context: {
        personas: {
          external_audience_id: external_audience_id_value,
          computation_key: 'snap_test_audience'
        }
      }
    })
    const audienceEvent2 = createTestEvent({
      type: 'track',
      event: 'Audience Entered',
      properties: {
        audience_key: 'snap_test_audience',
        snap_test_audience: true
      },
      context: {
        personas: {
          external_audience_id: external_audience_id_value,
          computation_key: 'snap_test_audience'
        }
      }
    })
    const audienceEvent3 = createTestEvent({
      type: 'track',
      event: 'Audience Entered',
      properties: {
        audience_key: 'snap_test_audience',
        snap_test_audience: true
      },
      context: {
        personas: {
          external_audience_id: external_audience_id_value,
          computation_key: 'snap_test_audience'
        }
      }
    })

    const events = [audienceEvent1, audienceEvent2, audienceEvent3]

    await expect(testDestination.testBatchAction('syncAudience', { events, mapping, settings })).rejects.toThrowError(
      PayloadValidationError
    )
  })
})
