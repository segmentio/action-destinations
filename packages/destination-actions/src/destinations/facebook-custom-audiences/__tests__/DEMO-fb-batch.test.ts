import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

const mkEvent = (userId: string, email: string, phone: string) => ({
  type: 'identify' as const,
  userId,
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'my_audience',
      external_audience_id: '1234'
    }
  },
  traits: { my_audience: true, email, phone }
})

const events = [
  mkEvent('u1', 'good1@example.com', '+33612345678'),
  mkEvent('u2', 'faulty@example.com', '+0000000000'), // malformed -> normalizePhone() => ''
  mkEvent('u3', 'good2@example.com', '+33612345679')
]

const mapping = {
  externalId: { '@path': '$.userId' },
  email: { '@path': '$.traits.email' },
  phone: { '@path': '$.traits.phone' },
  external_audience_id: '1234',
  enable_batching: true
}

describe('DEMO — Facebook Custom Audiences whole-batch failure', () => {
  it('one malformed phone throws for the ENTIRE batch', async () => {
    nock('https://graph.facebook.com').post(/.*/).reply(200, {})

    let threw = false
    let message = ''
    try {
      await testDestination.testBatchAction('sync', {
        events,
        mapping,
        useDefaultMappings: true,
        settings: { retlAdAccountId: 'act_123' },
        auth: { accessToken: 'fake', refreshToken: 'fake' }
      })
    } catch (e) {
      threw = true
      message = (e as Error).message
    }

    const ms: any[] = (testDestination as any).results?.[0]?.multistatus ?? []
    process.stdout.write(`\nthrew=${threw}  message=${JSON.stringify(message)}  multistatusLength=${ms.length}\n`)
    ms.forEach((r, i) => {
      const v = r?.value?.() ?? r
      process.stdout.write(`  row ${i}: ${JSON.stringify(v)}\n`)
    })
  })
})
