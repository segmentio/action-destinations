import { getUserData, clean, hash, cleanAndHash, hashArray } from '../fb-capi-user-data'
import { Payload } from '../purchase2/generated-types'

describe('FacebookConversionsApi', () => {
  describe('UserData', () => {

    describe('hash_user_data', () => {
      it('if value is undefined or empty string set as undefined otherwise convert into hash value', async () => {
        const userData: Payload['user_data'] = {
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

        const hashed_data = getUserData(userData)

        expect(hashed_data.em).toEqual(undefined)
        expect(hashed_data.ph).toEqual('cf9b0227ee02d8f8f9dbb6060fa2941bb667efc71f6ee2e6ee17b40121a5f4a6')
        expect(hashed_data.ge).toEqual('62c66a7a5dd70c3146618063c344e531e6d4b59e379808443ce962b3abd63c5a')
        expect(hashed_data.db).toEqual(undefined)
      })

      it('if values are already hashed, should not hash again', async () => {
        const userData: Payload['user_data'] = {
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

        const hashed_data = getUserData(userData)
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

      it('should normalize phone numbers by removing non-digit characters', () => {
        const userData: Payload['user_data'] = {
          phone: '+1 (510) 555-0011'
        }

        const hashed_data = getUserData(userData)
        expect(hashed_data.ph).toEqual(hash('15105550011'))
      })

      it('should normalize gender values correctly', () => {
        const testCases = [
          { input: 'male', expectedNormalized: 'm' },
          { input: 'Male', expectedNormalized: 'm' },
          { input: 'm', expectedNormalized: 'm' },
          { input: 'M', expectedNormalized: 'm' },
          { input: 'female', expectedNormalized: 'f' },
          { input: 'Female', expectedNormalized: 'f' },
          { input: 'f', expectedNormalized: 'f' },
          { input: 'F', expectedNormalized: 'f' }
        ]

        testCases.forEach(({ input, expectedNormalized }) => {
          const userData: Payload['user_data'] = { gender: input }
          const hashed_data = getUserData(userData)
          expect(hashed_data.ge).toEqual(cleanAndHash(expectedNormalized))
        })
      })

      it('should return undefined for invalid gender values', () => {
        const userData: Payload['user_data'] = {
          gender: 'other'
        }

        const hashed_data = getUserData(userData)
        expect(hashed_data.ge).toEqual(undefined)
      })

      it('should include non-PII fields without hashing', () => {
        const userData: Payload['user_data'] = {
          client_ip_address: '192.168.1.1',
          client_user_agent: 'Mozilla/5.0',
          fbc: 'fb.1.1234567890.abcdef',
          fbp: 'fb.1.1234567890.123456789',
          subscriptionID: 'sub_123',
          leadID: 456,
          anonId: 'anon_123',
          madId: 'mad_123',
          fbLoginID: 789,
          partner_id: 'partner_123',
          partner_name: 'Partner Name'
        }

        const hashed_data = getUserData(userData)
        expect(hashed_data.client_ip_address).toEqual('192.168.1.1')
        expect(hashed_data.client_user_agent).toEqual('Mozilla/5.0')
        expect(hashed_data.fbc).toEqual('fb.1.1234567890.abcdef')
        expect(hashed_data.fbp).toEqual('fb.1.1234567890.123456789')
        expect(hashed_data.subscription_id).toEqual('sub_123')
        expect(hashed_data.lead_id).toEqual(456)
        expect(hashed_data.anon_id).toEqual('anon_123')
        expect(hashed_data.madid).toEqual('mad_123')
        expect(hashed_data.fb_login_id).toEqual(789)
        expect(hashed_data.partner_id).toEqual('partner_123')
        expect(hashed_data.partner_name).toEqual('Partner Name')
      })

      it('should only include leadID and fbLoginID when they are numbers', () => {
        const userDataWithNumbers: Payload['user_data'] = {
          leadID: 123,
          fbLoginID: 456
        }

        const hashed_data_numbers = getUserData(userDataWithNumbers)
        expect(hashed_data_numbers.lead_id).toEqual(123)
        expect(hashed_data_numbers.fb_login_id).toEqual(456)

        const userDataWithZero: Payload['user_data'] = {
          leadID: 0,
          fbLoginID: 0
        }

        const hashed_data_zero = getUserData(userDataWithZero)
        expect(hashed_data_zero.lead_id).toEqual(0)
        expect(hashed_data_zero.fb_login_id).toEqual(0)
      })

      it('should not include leadID and fbLoginID when they are not numbers', () => {
        const userDataWithUndefined: Payload['user_data'] = {
          leadID: undefined,
          fbLoginID: undefined
        }

        const hashed_data_undefined = getUserData(userDataWithUndefined)
        expect(hashed_data_undefined.lead_id).toBeUndefined()
        expect(hashed_data_undefined.fb_login_id).toBeUndefined()
      })

      it('should handle multiple external IDs', () => {
        const userData: Payload['user_data'] = {
          externalId: ['id1', 'id2', 'id3']
        }

        const hashed_data = getUserData(userData)
        expect(hashed_data.external_id).toHaveLength(3)
        expect(hashed_data.external_id?.[0]).toEqual(cleanAndHash('id1'))
        expect(hashed_data.external_id?.[1]).toEqual(cleanAndHash('id2'))
        expect(hashed_data.external_id?.[2]).toEqual(cleanAndHash('id3'))
      })

      it('should handle empty payload gracefully', () => {
        const userData: Payload['user_data'] = {}

        const hashed_data = getUserData(userData)
        expect(Object.keys(hashed_data).length).toEqual(0)
      })
    })

    describe('clean', () => {
      it('should remove spaces and convert to lowercase', () => {
        expect(clean('John Doe')).toEqual('johndoe')
        expect(clean('SAN FRANCISCO')).toEqual('sanfrancisco')
        expect(clean('  Test  ')).toEqual('test')
      })

      it('should return undefined for empty string', () => {
        expect(clean('')).toEqual(undefined)
      })

      it('should return undefined for undefined', () => {
        expect(clean(undefined)).toEqual(undefined)
      })

      it('should handle strings with only spaces', () => {
        expect(clean('   ')).toEqual(undefined)
      })

      it('should handle already clean strings', () => {
        expect(clean('test')).toEqual('test')
      })
    })

    describe('hash', () => {
      it('should hash a string using sha256', () => {
        const hashed = hash('test')
        expect(hashed).toEqual('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08')
      })

      it('should return undefined for empty string', () => {
        expect(hash('')).toEqual(undefined)
      })

      it('should return undefined for undefined', () => {
        expect(hash(undefined)).toEqual(undefined)
      })

      it('should produce consistent hashes', () => {
        const hash1 = hash('consistent')
        const hash2 = hash('consistent')
        expect(hash1).toEqual(hash2)
      })

      it('should produce different hashes for different inputs', () => {
        const hash1 = hash('input1')
        const hash2 = hash('input2')
        expect(hash1).not.toEqual(hash2)
      })
    })

    describe('cleanAndHash', () => {
      it('should clean and hash a value', () => {
        const result = cleanAndHash('John Doe')
        expect(result).toEqual(hash('johndoe'))
      })

      it('should handle values with spaces', () => {
        const result = cleanAndHash('  Test Value  ')
        expect(result).toEqual(hash('testvalue'))
      })

      it('should handle uppercase values', () => {
        const result = cleanAndHash('UPPERCASE')
        expect(result).toEqual(hash('uppercase'))
      })

      it('should return undefined for empty string', () => {
        expect(cleanAndHash('')).toEqual(undefined)
      })

      it('should return undefined for undefined', () => {
        expect(cleanAndHash(undefined)).toEqual(undefined)
      })

      it('should return undefined for strings with only spaces', () => {
        expect(cleanAndHash('   ')).toEqual(undefined)
      })
    })

    describe('hashArray', () => {
      it('should hash an array of values', () => {
        const result = hashArray(['value1', 'value2'])
        expect(result).toHaveLength(2)
        expect(result?.[0]).toEqual(hash('value1'))
        expect(result?.[1]).toEqual(hash('value2'))
      })

      it('should clean values before hashing', () => {
        const result = hashArray(['Value 1', 'VALUE 2'])
        expect(result).toHaveLength(2)
        expect(result?.[0]).toEqual(hash('value1'))
        expect(result?.[1]).toEqual(hash('value2'))
      })

      it('should filter out empty strings', () => {
        const result = hashArray(['value1', '', 'value2'])
        expect(result).toHaveLength(2)
        expect(result?.[0]).toEqual(hash('value1'))
        expect(result?.[1]).toEqual(hash('value2'))
      })

      it('should return undefined for empty array', () => {
        expect(hashArray([])).toEqual(undefined)
      })

      it('should return undefined for undefined', () => {
        expect(hashArray(undefined)).toEqual(undefined)
      })

      it('should return undefined for array with only empty strings', () => {
        expect(hashArray(['', '', ''])).toEqual(undefined)
      })

      it('should handle single value array', () => {
        const result = hashArray(['single'])
        expect(result).toHaveLength(1)
        expect(result?.[0]).toEqual(hash('single'))
      })
    })
  })
})
