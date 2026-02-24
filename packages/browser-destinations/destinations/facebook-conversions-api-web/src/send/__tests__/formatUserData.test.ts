import { formatUserData } from '../functions'
import { Payload } from '../generated-types'

describe('formatUserData', () => {
  describe('without clientParamBuilder', () => {
    it('should format and hash email', async () => {
      const userData: Payload['userData'] = {
        em: 'TEST@EXAMPLE.COM'
      }

      const result = await formatUserData(userData, undefined)

      // Email should be normalized (lowercase, trimmed) and hashed
      // 'test@example.com' -> '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
      expect(result).toEqual({
        em: '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
      })
    })

    it('should format and hash phone number', async () => {
      const userData: Payload['userData'] = {
        ph: '(555) 123-4567'
      }

      const result = await formatUserData(userData, undefined)

      // Phone should have non-numeric characters removed, then hashed
      // '5551234567' -> '3c95277da5fd0da6a1a44ee3fdf56d20af6c6d242695a40e18e6e90dc3c5872c'
      expect(result).toEqual({
        ph: '3c95277da5fd0da6a1a44ee3fdf56d20af6c6d242695a40e18e6e90dc3c5872c'
      })
    })

    it('should format and hash first and last name', async () => {
      const userData: Payload['userData'] = {
        fn: ' JOHN ',
        ln: ' DOE '
      }

      const result = await formatUserData(userData, undefined)

      // Names should be lowercased and trimmed, then hashed
      // 'john' -> '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a'
      // 'doe' -> '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f'
      expect(result).toEqual({
        fn: '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a',
        ln: '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f'
      })
    })

    it('should format and hash gender', async () => {
      const userData: Payload['userData'] = {
        ge: 'm'
      }

      const result = await formatUserData(userData, undefined)

      // 'm' -> '62c66a7a5dd70c3146618063c344e531e6d4b59e379808443ce962b3abd63c5a'
      expect(result).toEqual({
        ge: '62c66a7a5dd70c3146618063c344e531e6d4b59e379808443ce962b3abd63c5a'
      })
    })

    it('should format date of birth as YYYYMMDD and hash', async () => {
      const userData: Payload['userData'] = {
        db: '1990-05-15T00:00:00.000Z'
      }

      const result = await formatUserData(userData, undefined)

      // Date formatted as '19900515' then hashed
      // '19900515' -> '53058fbd6731774c37a6d838c09d25b337fa7b9b5007f82cc934d857d2596e0c'
      expect(result).toEqual({
        db: '53058fbd6731774c37a6d838c09d25b337fa7b9b5007f82cc934d857d2596e0c'
      })
    })

    it('should format and hash city', async () => {
      const userData: Payload['userData'] = {
        ct: ' New York '
      }

      const result = await formatUserData(userData, undefined)

      // City should be lowercased with spaces removed, then hashed
      // 'newyork' -> '350c754ba4d38897693aa077ef43072a859d23f613443133fecbbd90a3512ca5'
      expect(result).toEqual({
        ct: '350c754ba4d38897693aa077ef43072a859d23f613443133fecbbd90a3512ca5'
      })
    })

    it('should convert state name to code and hash', async () => {
      const userData: Payload['userData'] = {
        st: 'California'
      }

      const result = await formatUserData(userData, undefined)

      // 'California' -> 'ca' -> hashed
      // 'ca' -> '6959097001d10501ac7d54c0bdb8db61420f658f2922cc26e46d536119a31126'
      expect(result).toEqual({
        st: '6959097001d10501ac7d54c0bdb8db61420f658f2922cc26e46d536119a31126'
      })
    })

    it('should lowercase state code and hash', async () => {
      const userData: Payload['userData'] = {
        st: 'NY'
      }

      const result = await formatUserData(userData, undefined)

      // 'NY' -> 'ny' -> hashed
      // 'ny' -> '1b06e2003f8420d6fa42badd8f77ec0f706b976b7a48b13c567dc5a559681683'
      expect(result).toEqual({
        st: '1b06e2003f8420d6fa42badd8f77ec0f706b976b7a48b13c567dc5a559681683'
      })
    })

    it('should convert country name to code and hash', async () => {
      const userData: Payload['userData'] = {
        country: 'United States'
      }

      const result = await formatUserData(userData, undefined)

      // 'United States' -> 'us' -> hashed
      // 'us' -> '79adb2a2fce5c6ba215fe5f27f532d4e7edbac4b6a5e09e1ef3a08084a904621'
      expect(result).toEqual({
        country: '79adb2a2fce5c6ba215fe5f27f532d4e7edbac4b6a5e09e1ef3a08084a904621'
      })
    })

    it('should format and hash zip code', async () => {
      const userData: Payload['userData'] = {
        zp: ' 94102 '
      }

      const result = await formatUserData(userData, undefined)

      // Zip should be trimmed then hashed
      // '94102' -> '8137c19c8f35f6b6a1cce99753226e1c7211eaaebd68528b789f973b0be95e31'
      expect(result).toEqual({
        zp: '8137c19c8f35f6b6a1cce99753226e1c7211eaaebd68528b789f973b0be95e31'
      })
    })

    it('should format and hash external_id', async () => {
      const userData: Payload['userData'] = {
        external_id: ' user-123 '
      }

      const result = await formatUserData(userData, undefined)

      // External ID should be trimmed then hashed
      // 'user-123' -> 'fcdec6df4d44dbc637c7c5b58efface52a7f8a88535423430255be0bb89bedd8'
      expect(result).toEqual({
        external_id: 'fcdec6df4d44dbc637c7c5b58efface52a7f8a88535423430255be0bb89bedd8'
      })
    })

    it('should NOT hash fbp and fbc cookies', async () => {
      const userData: Payload['userData'] = {
        fbp: ' fb.1.1234567890.1234567890 ',
        fbc: ' fb.1.1234567890.AbCdEf123 '
      }

      const result = await formatUserData(userData, undefined)

      // FBP and FBC should only be trimmed, NOT hashed
      expect(result).toEqual({
        fbp: 'fb.1.1234567890.1234567890',
        fbc: 'fb.1.1234567890.AbCdEf123'
      })
    })

    it('should format all fields combined', async () => {
      const userData: Payload['userData'] = {
        external_id: 'user-123',
        em: 'test@example.com',
        ph: '5551234567',
        fn: 'John',
        ln: 'Doe',
        ge: 'm',
        db: '1990-05-15T00:00:00.000Z',
        ct: 'San Francisco',
        st: 'California',
        zp: '94102',
        country: 'United States',
        fbp: 'fb.1.1234567890.1234567890',
        fbc: 'fb.1.1234567890.AbCdEf123'
      }

      const result = await formatUserData(userData, undefined)

      expect(result).toEqual({
        external_id: 'fcdec6df4d44dbc637c7c5b58efface52a7f8a88535423430255be0bb89bedd8',
        em: '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b',
        ph: '3c95277da5fd0da6a1a44ee3fdf56d20af6c6d242695a40e18e6e90dc3c5872c',
        fn: '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a',
        ln: '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f',
        ge: '62c66a7a5dd70c3146618063c344e531e6d4b59e379808443ce962b3abd63c5a',
        db: '53058fbd6731774c37a6d838c09d25b337fa7b9b5007f82cc934d857d2596e0c',
        ct: '1a6bd4d9d79dc0a79b53795c70d3349fa9e38968a3fbefbfe8783efb1d2b6aac',
        st: '6959097001d10501ac7d54c0bdb8db61420f658f2922cc26e46d536119a31126',
        zp: '8137c19c8f35f6b6a1cce99753226e1c7211eaaebd68528b789f973b0be95e31',
        country: '79adb2a2fce5c6ba215fe5f27f532d4e7edbac4b6a5e09e1ef3a08084a904621',
        fbp: 'fb.1.1234567890.1234567890',
        fbc: 'fb.1.1234567890.AbCdEf123'
      })
    })

    it('should return undefined when userData is undefined', async () => {
      const result = await formatUserData(undefined, undefined)

      expect(result).toBeUndefined()
    })

    it('should return undefined when all fields are invalid', async () => {
      const userData: Payload['userData'] = {
        ge: 'invalid'
      }

      const result = await formatUserData(userData, undefined)

      expect(result).toBeUndefined()
    })

    it('should skip invalid gender values', async () => {
      const userData: Payload['userData'] = {
        em: 'test@example.com',
        ge: 'invalid'
      }

      const result = await formatUserData(userData, undefined)

      // Should only include email, skip invalid gender
      expect(result).toEqual({
        em: '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
      })
    })

    it('should skip invalid date of birth', async () => {
      const userData: Payload['userData'] = {
        em: 'test@example.com',
        db: 'invalid-date'
      }

      const result = await formatUserData(userData, undefined)

      // Should only include email, skip invalid date
      expect(result).toEqual({
        em: '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
      })
    })
  })

  describe('with clientParamBuilder', () => {
    let mockClientParamBuilder: any

    beforeEach(() => {
      mockClientParamBuilder = {
        getNormalizedAndHashedPII: jest.fn(),
        processAndCollectAllParams: jest.fn(),
        getFbc: jest.fn(),
        getFbp: jest.fn()
      }
    })

    it('should use clientParamBuilder for email', async () => {
      mockClientParamBuilder.getNormalizedAndHashedPII.mockReturnValue('hashed_email_value')

      const userData: Payload['userData'] = {
        em: 'TEST@EXAMPLE.COM'
      }

      const result = await formatUserData(userData, mockClientParamBuilder)

      expect(mockClientParamBuilder.getNormalizedAndHashedPII).toHaveBeenCalledWith('TEST@EXAMPLE.COM', 'email')
      expect(result).toEqual({
        em: 'hashed_email_value'
      })
    })

    it('should use clientParamBuilder for all PII fields', async () => {
      mockClientParamBuilder.getNormalizedAndHashedPII.mockImplementation((_, type) => {
        return `hashed_${type}_value`
      })

      const userData: Payload['userData'] = {
        em: 'test@example.com',
        ph: '5551234567',
        fn: 'John',
        ln: 'Doe',
        ge: 'm',
        db: '1990-05-15',
        ct: 'San Francisco',
        st: 'CA',
        zp: '94102',
        country: 'US',
        external_id: 'user-123'
      }

      const result = await formatUserData(userData, mockClientParamBuilder)

      expect(mockClientParamBuilder.getNormalizedAndHashedPII).toHaveBeenCalledWith('test@example.com', 'email')
      expect(mockClientParamBuilder.getNormalizedAndHashedPII).toHaveBeenCalledWith('5551234567', 'phone')
      expect(mockClientParamBuilder.getNormalizedAndHashedPII).toHaveBeenCalledWith('John', 'first_name')
      expect(mockClientParamBuilder.getNormalizedAndHashedPII).toHaveBeenCalledWith('Doe', 'last_name')
      expect(mockClientParamBuilder.getNormalizedAndHashedPII).toHaveBeenCalledWith('m', 'gender')
      expect(mockClientParamBuilder.getNormalizedAndHashedPII).toHaveBeenCalledWith('1990-05-15', 'date_of_birth')
      expect(mockClientParamBuilder.getNormalizedAndHashedPII).toHaveBeenCalledWith('San Francisco', 'city')
      expect(mockClientParamBuilder.getNormalizedAndHashedPII).toHaveBeenCalledWith('CA', 'state')
      expect(mockClientParamBuilder.getNormalizedAndHashedPII).toHaveBeenCalledWith('94102', 'zip_code')
      expect(mockClientParamBuilder.getNormalizedAndHashedPII).toHaveBeenCalledWith('US', 'country')
      expect(mockClientParamBuilder.getNormalizedAndHashedPII).toHaveBeenCalledWith('user-123', 'external_id')

      expect(result).toEqual({
        em: 'hashed_email_value',
        ph: 'hashed_phone_value',
        fn: 'hashed_first_name_value',
        ln: 'hashed_last_name_value',
        ge: 'hashed_gender_value',
        db: 'hashed_date_of_birth_value',
        ct: 'hashed_city_value',
        st: 'hashed_state_value',
        zp: 'hashed_zip_code_value',
        country: 'hashed_country_value',
        external_id: 'hashed_external_id_value'
      })
    })

    it('should use clientParamBuilder getFbc and getFbp methods', async () => {
      mockClientParamBuilder.getNormalizedAndHashedPII.mockReturnValue('hashed_email')
      mockClientParamBuilder.getFbc.mockReturnValue('fb.1.1234567890.ClientParamBuilderFbc')
      mockClientParamBuilder.getFbp.mockReturnValue('fb.1.1234567890.ClientParamBuilderFbp')

      const userData: Payload['userData'] = {
        em: 'test@example.com',
        fbc: 'fb.1.1234567890.PayloadFbc',
        fbp: 'fb.1.1234567890.PayloadFbp'
      }

      const result = await formatUserData(userData, mockClientParamBuilder)

      expect(mockClientParamBuilder.processAndCollectAllParams).toHaveBeenCalled()
      expect(mockClientParamBuilder.getFbc).toHaveBeenCalled()
      expect(mockClientParamBuilder.getFbp).toHaveBeenCalled()

      // ClientParamBuilder values should override payload values
      expect(result).toEqual({
        em: 'hashed_email',
        fbc: 'fb.1.1234567890.ClientParamBuilderFbc',
        fbp: 'fb.1.1234567890.ClientParamBuilderFbp'
      })
    })

    it('should fallback to payload fbc/fbp when clientParamBuilder returns null', async () => {
      mockClientParamBuilder.getNormalizedAndHashedPII.mockReturnValue('hashed_email')
      mockClientParamBuilder.getFbc.mockReturnValue(null)
      mockClientParamBuilder.getFbp.mockReturnValue(null)

      const userData: Payload['userData'] = {
        em: 'test@example.com',
        fbc: 'fb.1.1234567890.PayloadFbc',
        fbp: 'fb.1.1234567890.PayloadFbp'
      }

      const result = await formatUserData(userData, mockClientParamBuilder)

      expect(result).toEqual({
        em: 'hashed_email',
        fbc: 'fb.1.1234567890.PayloadFbc',
        fbp: 'fb.1.1234567890.PayloadFbp'
      })
    })

    it('should return undefined when clientParamBuilder returns undefined for all fields', async () => {
      mockClientParamBuilder.getNormalizedAndHashedPII.mockReturnValue(undefined)

      const userData: Payload['userData'] = {
        em: 'test@example.com',
        ph: '5551234567'
      }

      const result = await formatUserData(userData, mockClientParamBuilder)

      expect(result).toBeUndefined()
    })
  })
})
