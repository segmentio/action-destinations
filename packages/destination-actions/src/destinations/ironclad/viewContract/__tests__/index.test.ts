import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const settings = {
  sid: '15f7972a-d01b-4d41-9438-118eb10d0e0b'
}

const payload = {
  sig: 'test-user-njs1haohmb',
  group_key: 'sign-up'
}

describe('Ironclad.viewContract', () => {
  it('test View contract', async () => {
    const versionURL = `https://staging.pactsafe.io`

    console.log('======> TEST - versionURL: ', versionURL)

    nock(versionURL)
      .persist()
      .get(`/published?sid=${settings.sid}&gkey=${payload.group_key}`)
      .reply(200, { '15299': '636aa4956e4e161e69d0a110' })

    const ironcladURL = `https://staging.pactsafe.io`
    const jsonData = {
      sid: settings.sid,
      sig: payload.sig,
      vid: '636aa4956e4e161e69d0a110',
      et: 'visited',
      server_side: true,
      tm: true
    }

    nock(ironcladURL).persist().post('/send', jsonData).reply(200, {})

    console.log('======> nock.activeMocks(): ', nock.activeMocks())

    const event = createTestEvent({
      type: 'track',
      event: 'Test Account Creation',
      userId: 'test-user-njs1haohmb'
    })

    const responses = await testDestination.testAction('viewContract', {
      event,
      settings: settings,
      mapping: {
        sig: {
          '@path': '$.userId'
        },
        event_name: {
          '@path': '$.event'
        },
        group_key: 'sign-up',
        event_type: 'visited'
      }
    })

    console.log('======> responses: ', responses)

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)

    // expect(responses[0].request.headers).toMatchInlineSnapshot(`
    //     Headers {
    //       Symbol(map): Object {
    //         "user-agent": Array [
    //           "Segment (Actions)",
    //         ],
    //         "accept": Array [
    //           "*/*",
    //         ],
    //         "accept-encoding": Array [
    //           "gzip,deflate",
    //         ],
    //         "connection": Array [
    //           "close",
    //         ],
    //       },
    //     }
    //   `)
  })
})
