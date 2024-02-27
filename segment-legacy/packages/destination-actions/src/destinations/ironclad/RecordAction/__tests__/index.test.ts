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
  group_id: 1335
}

describe('Ironclad.recordAction', () => {
  it('test recordAction', async () => {
    //Mock Staging and prod
    const ironcladURL = `https://pactsafe.io`
    nock(ironcladURL)
      .get(`/published?sid=${settingsStaging.sid}&gid=${payload.group_id}`)
      .reply(200, { '15299': '636aa4956e4e161e69d0a110', '15483': '6388c828932984001c888e1c' })

    const stagingIroncladURL = `https://staging.pactsafe.io`
    nock(stagingIroncladURL)
      .get(`/published?sid=${settingsStaging.sid}&gid=${payload.group_id}`)
      .reply(200, { '15299': '636aa4956e4e161e69d0a110', '15483': '6388c828932984001c888e1c' })

    const jsonDataStaging = {
      sid: settingsStaging.sid,
      sig: payload.sig,
      gid: payload.group_id,
      vid: '636aa4956e4e161e69d0a110,6388c828932984001c888e1c',
      et: 'displayed',
      server_side: true,
      tm: true
    }

    nock(ironcladURL).persist().post('/send/sync', jsonDataStaging).reply(200, {})
    nock(stagingIroncladURL).persist().post('/send/sync', jsonDataStaging).reply(200, {})

    //Mock Production
    const ironcladURLProd = `https://pactsafe.io`
    nock(ironcladURLProd)
      .get(`/published?sid=${settingsProd.sid}&gid=${payload.group_id}`)
      .reply(200, { '15299': '636aa4956e4e161e69d0a110', '15483': '6388c828932984001c888e1c' })

    const jsonDataProd = {
      sid: settingsProd.sid,
      sig: payload.sig,
      vid: '636aa4956e4e161e69d0a110,6388c828932984001c888e1c',
      et: 'displayed',
      server_side: true,
      tm: true
    }

    nock(ironcladURLProd).post('/send/sync', jsonDataProd).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      event: 'Test Account Creation',
      userId: 'test-user-njs1haohmb'
    })

    const responses = await testDestination.testAction('recordAction', {
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

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
  })
})
