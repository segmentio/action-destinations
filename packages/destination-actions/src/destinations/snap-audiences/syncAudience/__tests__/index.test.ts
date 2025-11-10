import nock from 'nock'
import { SegmentEvent, createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { processHashing } from '../../../../lib/hashing-utils'
import { normalize, normalizePhone } from '../functions'

const testDestination = createTestIntegration(Destination)

const settings = {
  ad_account_id: 'abc1234'
}

const external_audience_id_value = '123456789'

const addPayload1: Partial<SegmentEvent> = {
  type: 'track',
  event: 'Audience Entered',
  properties: {
    android_idfa: 'android_idfa_1111111111',
    snap_test_audience: true,
    phone: '+1111111111',
    email: 'test11111111@gmail.com'
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
      audience_settings: {
        customAudienceName: 'audience name 1',
        description: 'audience description blah',
        retention_in_days: 90
      },
      computation_class: 'audience',
      external_audience_id: external_audience_id_value,
      computation_id: 'aud_2m9wBh1vN9iiRRmaP2vifxuqGRo',
      computation_key: 'snap_test_audience',
      namespace: 'spa_fNXUFfyD86AhrDTtH2z2Vs',
      space_id: 'spa_fNXUFfyD86AhrDTtH2z2Vs'
    }
  }
}

const addPayload2 = {
  ...addPayload1,
  properties: {
    snap_test_audience: true,
    phone: '+2222222222'
  }
}

const addPayload3 = {
  ...addPayload1,
  properties: {
    android_idfa: 'android_idfa_3333333333',
    snap_test_audience: true,
    email: 'test33333333@gmail.com'
  }
}

const removePayload1 = {
  ...addPayload1,
  event: 'Audience Exited',
  properties: {
    snap_test_audience: false,
    phone: '+4444444444',
    email: 'test44444444@gmail.com'
  }
}

const removePayload2 = {
  ...addPayload1,
  event: 'Audience Exited',
  properties: {
    android_idfa: 'android_idfa_5555555555',
    snap_test_audience: false,
    phone: '+5555555555'
  }
}

const removePayload3 = {
  ...addPayload1,
  event: 'Audience Exited',
  properties: {
    android_idfa: 'android_idfa_6666666666',
    snap_test_audience: false,
    email: 'test6666666666@gmail.com',
    phone: '+5555555555' // Oh no a duplicate phone in the same batch!
  }
}

const mapping = {
  external_audience_id: { '@path': '$.context.personas.external_audience_id' },
  audienceKey: { '@path': '$.context.personas.computation_key' },
  props: { '@path': '$.properties' },
  phone: { '@path': '$.properties.phone' },
  email: { '@path': '$.properties.email' },
  advertising_id: { '@path': '$.properties.android_idfa' },
  enable_batching: true,
  max_batch_size: 1000,
  batch_keys: ['external_audience_id']
}

describe('Snapchat Audiences syncAudience', () => {
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

  it('should send batch with multiple emails, phone, MAIDs', async () => {
    /* 
      This test sends 6 events (3 add, 3 remove) with different identifiers (email, phone, MAID).
      It verifies that 6 requests are sent to Snapchat (add email, add phone, remove email, remove phone)
      and that identifiers are normalized and hashed correctly.
      It also dedupes where there are duplicate identifiers in the same batch (e.g. email only and email + phone in same batch)
    */
    const events = [
      createTestEvent(addPayload1),
      createTestEvent(addPayload2),
      createTestEvent(addPayload3),
      createTestEvent(removePayload1),
      createTestEvent(removePayload2),
      createTestEvent(removePayload3)
    ]

    nock('https://adsapi.snapchat.com')
      .post(`/v1/segments/${external_audience_id_value}/users`, {
        users: [
          {
            schema: ['EMAIL_SHA256'],
            data: [
              ['28a12fd153fd0b60d1d8d696d8ea07ea387988bf0c906d7aeefecf17add3af48'],
              ['4ea60569f5d7920a08c4568b03a70129c9cfab26a48f44978e4626545084c2ab']
            ]
          }
        ]
      })
      .reply(200, {})

    nock('https://adsapi.snapchat.com')
      .post(`/v1/segments/${external_audience_id_value}/users`, {
        users: [
          {
            schema: ['PHONE_SHA256'],
            data: [
              ['d2d02ea74de2c9fab1d802db969c18d409a8663a9697977bb1c98ccdd9de4372'],
              ['965f69baefb60286c60262b40dcf40717a2227eef5db00c9b717d5de24453511']
            ]
          }
        ]
      })
      .reply(200, {})

    nock('https://adsapi.snapchat.com')
      .post(`/v1/segments/${external_audience_id_value}/users`, {
        users: [
          {
            schema: ['MOBILE_AD_ID_SHA256'],
            data: [
              ['13d1ebc093bac8f450b3ae0fba5684587b467f37a9fe17aa45640235e236bdbf'],
              ['ba27e74fa326339ee2d31b9c387d7242b0913f5f1a84bbfb9f2001443a97e250']
            ]
          }
        ]
      })
      .reply(200, {})

    nock('https://adsapi.snapchat.com')
      .delete(`/v1/segments/${external_audience_id_value}/users`, {
        users: [
          {
            schema: ['EMAIL_SHA256'],
            data: [
              ['7a9285ba929efbeba9c57ccf24f782a07c94648854b28b9b508b7eb332abea6f'],
              ['f3781dfc9dc62f55fa9c328b3ac5ff0818465be19a0914ba18144fc1a85ead56']
            ]
          }
        ]
      })
      .reply(200, {})

    nock('https://adsapi.snapchat.com')
      .delete(`/v1/segments/${external_audience_id_value}/users`, {
        users: [
          {
            schema: ['PHONE_SHA256'],
            data: [
              ['f12a38838db97f7767c61d3922fa073656e407f00d8dc7337e5b5d0b009221da'],
              ['a5ad7e6d5225ad00c5f05ddb6bb3b1597a843cc92f6cf188490ffcb88a1ef4ef']
            ]
          }
        ]
      })
      .reply(200, {})

    nock('https://adsapi.snapchat.com')
      .delete(`/v1/segments/${external_audience_id_value}/users`, {
        users: [
          {
            schema: ['MOBILE_AD_ID_SHA256'],
            data: [
              ['ffb1512ae0d32e7bd9832ef56bd4350ca99222568b1ae92dcb4c26713b2e2440'],
              ['ca762f074b5d8053914f2b2dd1ccb2974cf7f65eede73508166c251d5057a782']
            ]
          }
        ]
      })
      .reply(200, {})

    const responses = await testDestination.testBatchAction('syncAudience', {
      events,
      mapping,
      settings
    })

    expect(responses.length).toBe(6)
  })

  it('Multistatus response should include successes and failures', async () => {
    const noIdsPayload = {
      ...addPayload1,
      properties: {
        snap_test_audience: true
      }
    }

    const events = [createTestEvent(noIdsPayload), createTestEvent(addPayload1)]

    nock('https://adsapi.snapchat.com')
      .post(`/v1/segments/${external_audience_id_value}/users`, {
        users: [
          {
            schema: ['EMAIL_SHA256'],
            data: [['28a12fd153fd0b60d1d8d696d8ea07ea387988bf0c906d7aeefecf17add3af48']]
          }
        ]
      })
      .reply(200, {})

    nock('https://adsapi.snapchat.com')
      .post(`/v1/segments/${external_audience_id_value}/users`, {
        users: [
          {
            schema: ['MOBILE_AD_ID_SHA256'],
            data: [['13d1ebc093bac8f450b3ae0fba5684587b467f37a9fe17aa45640235e236bdbf']]
          }
        ]
      })
      .reply(200, {})

    nock('https://adsapi.snapchat.com')
      .post(`/v1/segments/${external_audience_id_value}/users`, {
        users: [
          {
            schema: ['PHONE_SHA256'],
            data: [['d2d02ea74de2c9fab1d802db969c18d409a8663a9697977bb1c98ccdd9de4372']]
          }
        ]
      })
      .reply(200, {})

    const response = await testDestination.executeBatch('syncAudience', {
      events,
      mapping,
      settings
    })

    expect(response).toMatchObject([
      {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of "email" or "phone" or "Mobile Advertising ID" is required.'
      },
      {
        status: 200,
        body: '{"external_audience_id":"123456789","audienceKey":"snap_test_audience","props":{"android_idfa":"android_idfa_1111111111","snap_test_audience":true,"phone":"+1111111111","email":"test11111111@gmail.com"},"phone":"+1111111111","email":"test11111111@gmail.com","advertising_id":"android_idfa_1111111111","enable_batching":true,"max_batch_size":1000,"batch_keys":["external_audience_id"],"index":1}'
      }
    ])
  })
})
