import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import CustomerIO from '../index'
import { DecoratedResponse } from '@segment/actions-core'
import { AccountRegion } from '../utils'

const testDestination = createTestIntegration(CustomerIO)

describe('Customer.io', () => {
    describe('onDelete', () => {
        it('should support user deletions, defaulting to us', async () => {
            nock('https://track.customer.io').delete('/api/v1/customers/sloth@segment.com').reply(200, {})
            expect(testDestination.onDelete).toBeDefined()

            if (testDestination.onDelete) {
                const response = await testDestination?.onDelete(
                    { type: 'track', userId: 'sloth@segment.com' },
                    { siteId: 'foo', apiKey: 'bar' }
                )
                const resp = response as DecoratedResponse
                expect(resp.status).toBe(200)
                expect(resp.data).toMatchObject({})
            }
        })

        it('should support regional user deletions', async () => {
            nock('https://track-eu.customer.io').delete('/api/v1/customers/sloth@segment.com').reply(200, {})
            expect(testDestination.onDelete).toBeDefined()

            if (testDestination.onDelete) {
                const response = await testDestination?.onDelete(
                    { type: 'track', userId: 'sloth@segment.com' },
                    { siteId: 'foo', apiKey: 'bar', accountRegion: AccountRegion.EU }
                )
                const resp = response as DecoratedResponse
                expect(resp.status).toBe(200)
                expect(resp.data).toMatchObject({})
            }
        })
    })
})