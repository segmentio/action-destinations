// import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
// import { API_URL } from '../../config'
import { PayloadValidationError } from '@segment/actions-core'
const testDestination = createTestIntegration(Destination)

const apiKey = 'fake-api-key'
export const settings = {
  api_key: apiKey
}

describe('Subscribe Profile', () => {
  it('should throw error if no email or phone_number is provided', async () => {
    const event = createTestEvent({
      type: 'track'
    })

    await expect(
      testDestination.testAction('subscribeProfile', { event, settings, useDefaultMappings: true })
    ).rejects.toThrowError(PayloadValidationError)
  })

  it('should throw error if both subscribe_email and subscribe_sms are false', async () => {
    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          email: 'segment@test.com',
          phone_number: '+17065802344'
        }
      }
    })
    const mapping = {
      klaviyo_id: '12345',
      subscribe_email: false,
      subscribe_sms: false,
      list_id: 'WB2LME',
      consented_at: {
        '@path': '$.timestamp'
      },
      email: {
        '@path': '$.context.traits.email'
      },
      phone_number: {
        '@path': '$.context.traits.phone_number'
      }
    }

    await expect(testDestination.testAction('subscribeProfile', { event, settings, mapping })).rejects.toThrowError(
      PayloadValidationError
    )
  })

  // it('should successfully subscribe profile when email and phone_number are present and subscribe_email and subscribe_sms are true', async () => {
  //   const event = createTestEvent({
  //     type: 'track',
  //     context: {
  //       traits: {
  //         // email: 'segment@test.com',
  //         phone_number: '+17065802344'
  //       }
  //     }
  //   })
  //   const mapping = {
  //     klaviyo_id: '12345',
  //     subscribe_email: true,
  //     subscribe_sms: false,
  //     list_id: 'WB2LME',
  //     consented_at: {
  //       '@path': '$.timestamp'
  //     },
  //     email: {
  //       '@path': '$.context.traits.email'
  //     },
  //     phone_number: {
  //       '@path': '$.context.traits.phone_number'
  //     }
  //   }
  //   const responseTest = await testDestination.testAction('subscribeProfile', { event, settings, mapping })
  //   console.log(responseTest)
  // await expect(testDestination.testAction('subscribeProfile', { event, settings, mapping })).rejects.toThrowError(
  // PayloadValidationError
  // )
  // })
})
