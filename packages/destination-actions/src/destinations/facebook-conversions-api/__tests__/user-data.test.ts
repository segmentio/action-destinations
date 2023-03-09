import { normalize_user_data } from '../fb-capi-user-data'

describe('FacebookConversionsApi', () => {
  describe('UserData', () => {
    describe('Should Normalize', () => {
      it('fields with whitespaces', async () => {
        const test_payload = {
          user_data: {
            email: ' nick@test.com ',
            phone: ' 510 555 0011',
            city: 'San Francisco',
            gender: ' m',
            lastName: 'Doe ',
            firstName: ' John',
            state: 'CA ',
            zip: '12345 9876',
            country: 'U S ',
            externalId: ' ABC12345 '
          }
        }
        normalize_user_data(test_payload)

        expect(test_payload.user_data.email).toEqual('nick@test.com')
        expect(test_payload.user_data.phone).toEqual('5105550011')
        expect(test_payload.user_data.city).toEqual('sanfrancisco')
        expect(test_payload.user_data.gender).toEqual('m')
        expect(test_payload.user_data.lastName).toEqual('doe')
        expect(test_payload.user_data.firstName).toEqual('john')
        expect(test_payload.user_data.state).toEqual('ca')
        expect(test_payload.user_data.zip).toEqual('123459876')
        expect(test_payload.user_data.country).toEqual('us')
        expect(test_payload.user_data.externalId).toEqual('abc12345')
      })

      it('fields by converting state names to state codes', async () => {
        const test_payload = { user_data: { state: ' New York ' } }
        normalize_user_data(test_payload)
        expect(test_payload.user_data.state).toEqual('ny')

        test_payload.user_data.state = ' California'
        normalize_user_data(test_payload)
        expect(test_payload.user_data.state).toEqual('ca')
      })

      it('shouldnt change state names with no dictionary match', async () => {
        const test_payload = { user_data: { state: ' New South Wales' } }
        normalize_user_data(test_payload)
        expect(test_payload.user_data.state).toEqual('newsouthwales')

        test_payload.user_data.state = 'Ontario'
        normalize_user_data(test_payload)
        expect(test_payload.user_data.state).toEqual('ontario')
      })

      it('fields by converting country names to country codes', async () => {
        const test_payload = { user_data: { country: 'United States ' } }
        normalize_user_data(test_payload)
        expect(test_payload.user_data.country).toEqual('us')

        test_payload.user_data.country = 'Portugal '
        normalize_user_data(test_payload)
        expect(test_payload.user_data.country).toEqual('pt')

        test_payload.user_data.country = 'Canada'
        normalize_user_data(test_payload)
        expect(test_payload.user_data.country).toEqual('ca')
      })

      it('shouldnt change state names with no dictionary match', async () => {
        const test_payload = { user_data: { country: 'United States of America ' } }
        normalize_user_data(test_payload)
        expect(test_payload.user_data.country).toEqual('unitedstatesofamerica')

        test_payload.user_data.country = 'Great Britain'
        normalize_user_data(test_payload)
        expect(test_payload.user_data.country).toEqual('greatbritain')

        test_payload.user_data.country = 'South Korea'
        normalize_user_data(test_payload)
        expect(test_payload.user_data.country).toEqual('southkorea')
      })

      it('phone numbers by removing whitespaces and symbols', async () => {
        const test_payload = { user_data: { phone: '+1-510-555-0011 ' } }
        normalize_user_data(test_payload)
        expect(test_payload.user_data.phone).toEqual('15105550011')
      })

      it('gender by converting word to acronym', async () => {
        const test_payload = { user_data: { gender: 'male' } }
        normalize_user_data(test_payload)
        expect(test_payload.user_data.gender).toEqual('m')

        test_payload.user_data.gender = 'FEMALE   '
        normalize_user_data(test_payload)
        expect(test_payload.user_data.gender).toEqual('f')
      })
    })
  })
})
