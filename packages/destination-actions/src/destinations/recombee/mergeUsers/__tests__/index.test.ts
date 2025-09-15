import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)

const DATABASE_ID = 'test-database'
const SETTINGS: Settings = {
  databaseId: DATABASE_ID,
  privateToken: 'VALID_TOKEN',
  databaseRegion: 'eu-west'
}

const TARGET_USER_ID = 'target-user'
const SOURCE_USER_ID = 'source-user'

describe('mergeUsers', () => {
  it('should validate action fields', async () => {
    nock('https://rapi-eu-west.recombee.com/')
      .put(`/${DATABASE_ID}/users/${TARGET_USER_ID}/merge/${SOURCE_USER_ID}`)
      .query({
        hmac_timestamp: /.*/,
        hmac_sign: /.*/,
        cascadeCreate: true
      })
      .reply(200, 'ok')

    const event = createTestEvent({
      type: 'alias',
      userId: TARGET_USER_ID,
      previousId: SOURCE_USER_ID
    })

    const response = await testDestination.testAction('mergeUsers', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true
    })

    expect(response[0].status).toBe(200)
    expect(response[0].data).toMatch('ok')
  })

  it('should throw an error when fields are not mapped', async () => {
    const event = createTestEvent({
      userId: TARGET_USER_ID
    })

    await expect(
      testDestination.testAction('mergeUsers', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrow()
  })
})
