import { normalize_user_data, hash_user_data } from '../fb-capi-user-data'

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
            externalId: [' ABC12345 ', ' Xyz123 ']
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
        expect(test_payload.user_data.externalId).toEqual(['abc12345', 'xyz123'])
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

    describe('hash_user_data', () => {
      it('if value is undefined or empty string set as undefined otherwise convert into hash value', async () => {
        const test_payload = {
          user_data: {
            email: '',
            phone: '510 555 0011',
            city: 'San Francisco',
            gender: 'm',
            lastName: 'Doe ',
            firstName: 'John',
            state: 'CA',
            zip: '123459876',
            country: 'US',
            externalId: ['ABC12345']
          }
        }
        const hashed_data = <Record<string, string>>hash_user_data(test_payload)

        expect(hashed_data.em).toEqual(undefined)
        expect(hashed_data.ph).toEqual('cf9b0227ee02d8f8f9dbb6060fa2941bb667efc71f6ee2e6ee17b40121a5f4a6')
        expect(hashed_data.ge).toEqual('62c66a7a5dd70c3146618063c344e531e6d4b59e379808443ce962b3abd63c5a')
        expect(hashed_data.db).toEqual(undefined)
      })

      it('if values are already hashed, should not hash again', async () => {
        const test_payload = {
          user_data: {
            email: '2d2fb2388f17f86affee71d632978425a3037fa8eed5b3f2baaa458c80d495ed',
            phone: '92b5be0b4bcd88dbe1c5f7de1cc3f479fa8a702bd02b9905a5bc14bf66243c05',
            dateOfBirth: '4f8a154810062809cdb724b8254c2b9886e6ad3bc8b3fdfad4eb97f5b1916efd',
            gender: '62c66a7a5dd70c3146618063c344e531e6d4b59e379808443ce962b3abd63c5a',
            lastName: '3b67f1c91f4f245f6e219b364782ac53e912420f2284bf6a700e9cf71fbeafac',
            firstName: 'a628aa64f14c8196c8c82c7ffb6482b2db7431e4cb5b28cd313004ce7ba4eb66',
            city: 'b37d49779ef2040ccbb357b127d615c75a77ff74645071dbd6ec27ae54cbd912',
            state: '4b650e5c4785025dee7bd65e3c5c527356717d7a1c0bfef5b4ada8ca1e9cbe17',
            zip: '860d1f692a318f7ba200f47ab16bcae57e651d51bea0f56d7cef36569c198006',
            country: '9b202ecbc6d45c6d8901d989a918878397a3eb9d00e8f48022fc051b19d21a1d',
            externalId: ['2221aa193aea3b3fdee120c146c302fdb6ea606dbf4dfc5e1d587ec4b1aedf74']
          }
        }

        const hashed_data = hash_user_data(test_payload) as Record<string, string>

        expect(hashed_data.em).toEqual('2d2fb2388f17f86affee71d632978425a3037fa8eed5b3f2baaa458c80d495ed')
        expect(hashed_data.ph).toEqual('92b5be0b4bcd88dbe1c5f7de1cc3f479fa8a702bd02b9905a5bc14bf66243c05')
        expect(hashed_data.ge).toEqual('62c66a7a5dd70c3146618063c344e531e6d4b59e379808443ce962b3abd63c5a')
        expect(hashed_data.db).toEqual('4f8a154810062809cdb724b8254c2b9886e6ad3bc8b3fdfad4eb97f5b1916efd')
        expect(hashed_data.ln).toEqual('3b67f1c91f4f245f6e219b364782ac53e912420f2284bf6a700e9cf71fbeafac')
        expect(hashed_data.fn).toEqual('a628aa64f14c8196c8c82c7ffb6482b2db7431e4cb5b28cd313004ce7ba4eb66')
        expect(hashed_data.ct).toEqual('b37d49779ef2040ccbb357b127d615c75a77ff74645071dbd6ec27ae54cbd912')
        expect(hashed_data.st).toEqual('4b650e5c4785025dee7bd65e3c5c527356717d7a1c0bfef5b4ada8ca1e9cbe17')
        expect(hashed_data.zp).toEqual('860d1f692a318f7ba200f47ab16bcae57e651d51bea0f56d7cef36569c198006')
        expect(hashed_data.country).toEqual('9b202ecbc6d45c6d8901d989a918878397a3eb9d00e8f48022fc051b19d21a1d')
        expect(hashed_data.external_id).toEqual(['2221aa193aea3b3fdee120c146c302fdb6ea606dbf4dfc5e1d587ec4b1aedf74'])
      })
    })
  })
})
