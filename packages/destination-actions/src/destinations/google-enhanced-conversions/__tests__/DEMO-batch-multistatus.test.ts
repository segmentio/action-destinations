import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'
import { API_VERSION, FLAGON_NAME_PHONE_VALIDATION_CHECK } from '../functions'

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const customerId = '1234'
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700').toISOString()

const mapping = {
  phone: { '@path': '$.properties.phone' },
  email: { '@path': '$.properties.email' },
  event_name: { '@path': '$.event' },
  ad_user_data_consent_state: 'GRANTED',
  ad_personalization_consent_state: 'GRANTED',
  external_audience_id: '1234',
  retlOnMappingSave: {
    outputs: { id: '1234', name: 'Test List', external_id_type: 'CONTACT_INFO' }
  }
}

// A batch of 3 Customer-Match events. Row 1 has a malformed phone (+0000000000),
// the same placeholder value reported in the Nestle ticket (STRATCONN-6848).
const rows = [
  { email: 'good1@example.com', phone: '+33612345678', note: 'valid FR mobile' },
  { email: 'faulty@example.com', phone: '+0000000000', note: 'MALFORMED — from ticket' },
  { email: 'good2@example.com', phone: '+33612345679', note: 'valid FR mobile' }
]

const events = rows.map((r) =>
  createTestEvent({ timestamp, event: 'Audience Entered', properties: { email: r.email, phone: r.phone } })
)

describe('DEMO — Google Enhanced Conversions batch is per-row multi-status', () => {
  it('delivers the good rows and fails ONLY the malformed row (batch is NOT rejected)', async () => {
    nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
      .post(/.*/)
      .reply(200, { data: 'offlineDataJob' })
    nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:addOperations`)
      .post(/.*/)
      .reply(200, { data: 'offlineDataJob' })
    nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:run`)
      .post(/.*/)
      .reply(200, { data: 'offlineDataJob' })

    await testDestination.testBatchAction('userList', {
      events,
      mapping,
      useDefaultMappings: true,
      settings: { customerId },
      features: { [FLAGON_NAME_PHONE_VALIDATION_CHECK]: true }
    })

    const multistatus: any[] = (testDestination as any).results?.[0]?.multistatus ?? []
    const at = (i: number) => multistatus[i]?.value?.() ?? multistatus[i]

    const line = '═'.repeat(78)
    const dash = '─'.repeat(78)
    const out: string[] = ['', line, ' Google Enhanced Conversions — Customer Match  ·  batch of 3 events', line]
    let ok = 0
    let failed = 0
    rows.forEach((r, i) => {
      const s = at(i)
      const status = s?.status
      const pass = status === 200
      pass ? ok++ : failed++
      const icon = pass ? '✅' : '❌'
      const verdict = pass ? '200 SUCCESS' : `${status} FAILED`
      const reason = pass ? '' : ` — ${s?.errormessage}`
      out.push(` ${icon}  row ${i}  │ ${r.email.padEnd(18)} │ ${r.phone.padEnd(13)} │ ${verdict}${reason}`)
    })
    out.push(dash)
    out.push(` RESULT: batch was NOT rejected  ·  ${ok} delivered  ·  ${failed} rejected  (per-row multi-status)`)
    out.push(line, '')
    process.stdout.write(out.join('\n') + '\n')

    expect(at(0).status).toBe(200)
    expect(at(1).status).toBe(400)
    expect(at(2).status).toBe(200)
  })
})
