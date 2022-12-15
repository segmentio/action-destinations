import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const settingsStaging = {
  sid: '15f7972a-d01b-4d41-9438-118eb10d0e0b',
  staging_endpoint: true,
  test_mode: true
}

const settingsProd = {
  sid: '15f7972a-d01b-4d41-9438-118eb10d0e0b',
  staging_endpoint: false,
  test_mode: false
}

const payload = {
  sig: 'test-user-njs1haohmb',
  group_id: '1335'
}

describe('Ironclad.viewContract', () => {
  it('test View contract', async () => {
    //Mock Staging
    const ironcladURLStaging = `https://staging.pactsafe.io`
    nock(ironcladURLStaging)
      .get(`/published?sid=${settingsStaging.sid}&gid=${payload.group_id}`)
      .reply(200, { '15299': '636aa4956e4e161e69d0a110', '15483': '6388c828932984001c888e1c' })

    // console.log('======> TEST - ironcladURLStaging: ', ironcladURLStaging)

    const jsonDataStaging = {
      sid: settingsStaging.sid,
      sig: payload.sig,
      gid: payload.group_id,
      vid: '636aa4956e4e161e69d0a110,6388c828932984001c888e1c',
      et: 'displayed',
      server_side: true,
      tm: true
    }

    // console.log('======> TEST - jsonDataStaging: ', jsonDataStaging);

    nock(ironcladURLStaging).persist().post('/send/sync', jsonDataStaging).reply(200, {})

    //Mock Production
    const ironcladURLProd = `https://pactsafe.io`
    nock(ironcladURLProd)
      .get(`/published?sid=${settingsProd.sid}&gid=${payload.group_id}`)
      .reply(200, { '15299': '636aa4956e4e161e69d0a110', '15483': '6388c828932984001c888e1c' })

    // console.log('======> TEST - ironcladURLProd: ', ironcladURLProd)

    const jsonDataProd = {
      sid: settingsProd.sid,
      sig: payload.sig,
      vid: '636aa4956e4e161e69d0a110,6388c828932984001c888e1c',
      et: 'displayed',
      server_side: true,
      tm: true
    }

    nock(ironcladURLProd).post('/send/sync', jsonDataProd).reply(200, {})

    // console.log('======> TEST - nock.activeMocks(): ', nock.activeMocks())

    const event = createTestEvent({
      type: 'track',
      event: 'Test Account Creation',
      userId: 'test-user-njs1haohmb'
    })

    // console.log('======> TEST - event: ', event)

    const responses = await testDestination.testAction('viewContract', {
      event,
      settings: settingsStaging,
      mapping: {
        sig: {
          '@path': '$.userId'
        },
        event_name: {
          '@path': '$.event'
        },
        group_id: '1335',
        event_type: 'displayed'
      }
    })

    console.log('======> responses: ', responses)

    // expect(responses.length).toBe(2)
    // expect(responses[0].status).toBe(200)
  })
})
