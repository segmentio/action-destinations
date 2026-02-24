import { enquoteIdentifier, generateFile, normalize } from '../operations'
import type { Payload } from '../audienceEnteredSftp/generated-types'
import { processHashing } from '../../../lib/hashing-utils'

describe('Test operations', () => {
  describe('hash', () => {
    it('produces consistent SHA-256 hash for a given input', () => {
      const input = 'test input'
      expect(processHashing(input, 'sha256', 'hex')).toBe(
        '9dfe6f15d1ab73af898739394fd22fd72a03db01834582f24bb2e1c66c7aaeae'
      )
    })
  })

  describe('hashPhoneNumber', () => {
    it('produces consistent SHA-1 hash for a given phone number', () => {
      const phoneNumber = '123-456-7890'
      expect(processHashing(phoneNumber, 'sha1', 'hex')).toBe('d94cf047843c27e4ebf4495804dfb264a2181d45')
    })
  })

  describe('hashEmail', () => {
    it('produces consistent SHA-256 hash for a given email address', () => {
      const email = 'user@example.com'
      expect(processHashing(email, 'sha256', 'hex')).toBe(
        'b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514'
      )
    })
  })

  describe('normalize', () => {
    it('removes country code, parentheses, and hyphens for phone_number', () => {
      expect(normalize('phone_number', '+1 (555) 123-4567')).toBe('5551234567')
      expect(normalize('phone_number', '(123) 456-7890')).toBe('1234567890')
      expect(normalize('phone_number', '5551234567')).toBe('5551234567')
      expect(normalize('phone_number', '+1 555 1234567')).toBe('5551234567')
    })

    it('trims and converts email to lowercase', () => {
      expect(normalize('email', '  JOHN.DOe@EXAMPLE.com  ')).toBe('john.doe@example.com')
      expect(normalize('email', 'Alice@Example.COM')).toBe('alice@example.com')
    })

    it('returns value unchanged for non-phone_number and non-email keys', () => {
      expect(normalize('note', 'Hello, "John"\nNew line')).toBe('Hello, "John"\nNew line')
      expect(normalize('address', '123 Main St, Apt 4B')).toBe('123 Main St, Apt 4B')
    })

    it('handles empty or invalid phone numbers gracefully', () => {
      expect(normalize('phone_number', '')).toBe('')
      expect(normalize('phone_number', '12345')).toBe('12345') // Not a full phone number format
    })
  })

  describe('enquoteIdentifier', () => {
    it('wraps the string in double quotes', () => {
      expect(enquoteIdentifier('hello')).toBe('"hello"')
      expect(enquoteIdentifier('world')).toBe('"world"')
    })

    it('escapes internal double quotes in the string', () => {
      expect(enquoteIdentifier('He said "hello"')).toBe('"He said ""hello"""')
      expect(enquoteIdentifier('"Quote" inside')).toBe('"""Quote"" inside"')
      expect(enquoteIdentifier('She replied: "Yes"')).toBe('"She replied: ""Yes"""')
    })

    it('handles empty strings correctly', () => {
      expect(enquoteIdentifier('')).toBe('""')
    })

    it('handles strings with only quotes correctly', () => {
      expect(enquoteIdentifier('"')).toBe('""""')
      expect(enquoteIdentifier('""')).toBe('""""""')
    })

    it('does not alter strings without special characters', () => {
      expect(enquoteIdentifier('simple string')).toBe('"simple string"')
      expect(enquoteIdentifier('12345')).toBe('"12345"')
    })
  })

  describe('generateFile', () => {
    it('basic Case with Required Fields', () => {
      const payloads: Payload[] = [
        {
          audience_key: '1001',
          identifier_data: { email: 'john@example.com' },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]

      const result = generateFile(payloads, true)
      const expected = `audience_key,email\n${enquoteIdentifier('1001')},${enquoteIdentifier('john@example.com')}`
      expect(result.fileContents.toString()).toBe(expected)
    })

    it('includes Hashed unhashed_identifier_data', () => {
      const payloads: Payload[] = [
        {
          audience_key: '1002',
          unhashed_identifier_data: { name: 'John Doe' },
          identifier_data: { email: 'john@example.com' },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]
      const normalizedName = normalize('name', 'John Doe')
      const hashedName = processHashing(normalizedName, 'sha256', 'hex')
      const result = generateFile(payloads, true)
      const expected = `audience_key,email,name\n${enquoteIdentifier('1002')},${enquoteIdentifier(
        'john@example.com'
      )},${enquoteIdentifier(hashedName)}`
      expect(result.fileContents.toString()).toBe(expected)
    })

    it('handles Multiple Rows Consistently', () => {
      const payloads: Payload[] = [
        {
          audience_key: '1003',
          unhashed_identifier_data: { name: 'Alice' },
          identifier_data: { email: 'alice@example.com' },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        },
        {
          audience_key: '1004',
          unhashed_identifier_data: { name: 'Bob' },
          identifier_data: { email: 'bob@example.com' },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]
      const hashedAlice = processHashing('Alice', 'sha256', 'hex', (value: string) => normalize('name', value))
      const hashedBob = processHashing('Bob', 'sha256', 'hex', (value: string) => normalize('name', value))
      const result = generateFile(payloads, true)
      const expected = `audience_key,email,name\n${enquoteIdentifier('1003')},${enquoteIdentifier(
        'alice@example.com'
      )},${enquoteIdentifier(hashedAlice)}\n${enquoteIdentifier('1004')},${enquoteIdentifier(
        'bob@example.com'
      )},${enquoteIdentifier(hashedBob)}`
      expect(result.fileContents.toString()).toBe(expected)
    })

    it('skips Empty identifier_data Fields in Headers', () => {
      const payloads: Payload[] = [
        {
          audience_key: '1005',
          unhashed_identifier_data: { name: 'Eve' },
          identifier_data: {},
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]
      const hashedEve = processHashing('Eve', 'sha256', 'hex', (value: string) => normalize('name', value))
      const result = generateFile(payloads, true)
      const expected = `audience_key,name\n${enquoteIdentifier('1005')},${enquoteIdentifier(hashedEve)}`
      expect(result.fileContents.toString()).toBe(expected)
    })

    it('handles Special Characters in Fields', () => {
      const payloads: Payload[] = [
        {
          audience_key: '1006',
          unhashed_identifier_data: { note: 'Hello, "John"\nNew line' },
          identifier_data: { email: 'test@example.com' },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]
      const hashedNote = processHashing('Hello, "John"\nNew line', 'sha256', 'hex')
      const result = generateFile(payloads, true)
      const expected = `audience_key,email,note\n${enquoteIdentifier('1006')},${enquoteIdentifier(
        'test@example.com'
      )},${enquoteIdentifier(hashedNote)}`
      expect(result.fileContents.toString()).toBe(expected)
    })

    it('should generate CSV with hashed and unhashed identifier data', () => {
      const payloads: Payload[] = [
        // Entry with hashed identifier data
        {
          audience_key: 'aud001',
          delimiter: ',',
          identifier_data: {
            email: '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
          },
          filename: 'test_file_name.csv',
          enable_batching: true
        },
        // Entry with unhashed identifier data
        {
          audience_key: 'aud002',
          delimiter: ',',
          unhashed_identifier_data: {
            email: 'test@example.com'
          },
          filename: 'test_file_name.csv',
          enable_batching: true
        },
        // Entry with both hashed and unhashed identifier data
        {
          audience_key: 'aud003',
          delimiter: ',',
          identifier_data: {
            email: '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
          },
          unhashed_identifier_data: {
            email: 'test@example.com'
          },
          filename: 'test_file_name.csv',
          enable_batching: true
        }
      ]

      const result = generateFile(payloads, true)

      const expectedFileContents = `audience_key,email\n"aud001","973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b"\n"aud002","973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b"\n"aud003","973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b"`

      expect(result).toMatchObject({
        filename: 'test_file_name.csv',
        fileContents: Buffer.from(expectedFileContents)
      })
    })

    it('should generate CSV even if rows have missing data', () => {
      const payloads: Payload[] = [
        {
          audience_key: 'aud001',
          delimiter: ',',
          filename: 'test_file_name.csv',
          enable_batching: true
        },
        {
          audience_key: 'aud002',
          delimiter: ',',
          unhashed_identifier_data: {
            email: 'test@example.com'
          },
          filename: 'test_file_name.csv',
          enable_batching: true
        },
        {
          audience_key: 'aud003',
          delimiter: ',',
          unhashed_identifier_data: {
            email: 'test@example.com',
            example_identifier: 'example-id'
          },
          filename: 'test_file_name.csv',
          enable_batching: true
        }
      ]

      const result = generateFile(payloads, true)

      const expectedFileContents = `audience_key,email,example_identifier\n"aud001",,\n"aud002","973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b",\n"aud003","973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b","66a0acf498240ea61ce3ce698c5a30eb6824242b39695f8689d7c32499c79748"`

      expect(result).toMatchObject({
        filename: 'test_file_name.csv',
        fileContents: Buffer.from(expectedFileContents)
      })
    })

    it('comma in field', () => {
      const payloads: Payload[] = [
        {
          audience_key: '1007',
          identifier_data: { note: 'Hello, world' },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]
      const result = generateFile(payloads, true)
      const expected = `audience_key,note\n${enquoteIdentifier('1007')},${enquoteIdentifier('Hello, world')}`
      expect(result.fileContents.toString()).toBe(expected)
    })

    it('line break in field', () => {
      const payloads: Payload[] = [
        {
          audience_key: '1008',
          identifier_data: { description: 'First line\nSecond line' },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]
      const result = generateFile(payloads, true)
      const expected = `audience_key,description\n${enquoteIdentifier('1008')},${enquoteIdentifier(
        'First line\nSecond line'
      )}`
      expect(result.fileContents.toString()).toBe(expected)
    })

    it('double quotes in field', () => {
      const payloads: Payload[] = [
        {
          audience_key: '1009',
          identifier_data: { note: 'He said, "Hello" to everyone' },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]
      const result = generateFile(payloads, true)
      const expected = `audience_key,note\n${enquoteIdentifier('1009')},${enquoteIdentifier(
        'He said, "Hello" to everyone'
      )}`
      expect(result.fileContents.toString()).toBe(expected)
    })

    it('mixed special characters', () => {
      const payloads: Payload[] = [
        {
          audience_key: '1010',
          identifier_data: { note: 'Welcome, "John"\nHave a nice day' },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]
      const result = generateFile(payloads, true)
      const expected = `audience_key,note\n${enquoteIdentifier('1010')},${enquoteIdentifier(
        'Welcome, "John"\nHave a nice day'
      )}`
      expect(result.fileContents.toString()).toBe(expected)
    })

    it('empty fields', () => {
      const payloads: Payload[] = [
        {
          audience_key: '1011',
          identifier_data: { name: '', email: 'test@example.com' },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]
      const result = generateFile(payloads, true)
      const expected = `audience_key,email,name\n${enquoteIdentifier('1011')},${enquoteIdentifier(
        'test@example.com'
      )},""`
      expect(result.fileContents.toString()).toBe(expected)
    })

    it('all fields missing except audience_key', () => {
      const payloads: Payload[] = [
        { audience_key: '1012', delimiter: ',', filename: 'output.csv', enable_batching: true }
      ]
      const result = generateFile(payloads, true)
      const expected = `audience_key\n${enquoteIdentifier('1012')}`
      expect(result.fileContents.toString()).toBe(expected)
    })

    it('different delimiters', () => {
      const payloads: Payload[] = [
        {
          audience_key: '1013',
          identifier_data: { email: 'example@example.com', phone: '1234567890' },
          delimiter: ';',
          filename: 'output.csv',
          enable_batching: true
        }
      ]
      const result = generateFile(payloads, true)
      const expected = `audience_key;email;phone\n${enquoteIdentifier('1013')};${enquoteIdentifier(
        'example@example.com'
      )};${enquoteIdentifier('1234567890')}`
      expect(result.fileContents.toString()).toBe(expected)
    })

    it('missing identifier_data and unhashed_identifier_data', () => {
      const payloads: Payload[] = [
        { audience_key: '1014', delimiter: ',', filename: 'output.csv', enable_batching: true }
      ]
      const result = generateFile(payloads, true)
      const expected = `audience_key\n${enquoteIdentifier('1014')}`
      expect(result.fileContents.toString()).toBe(expected)
    })

    it('excessively long field values', () => {
      const longString = 'a'.repeat(10000)
      const payloads: Payload[] = [
        {
          audience_key: '1015',
          identifier_data: { long_field: longString },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]
      const result = generateFile(payloads, true)
      const expected = `audience_key,long_field\n${enquoteIdentifier('1015')},${enquoteIdentifier(longString)}`
      expect(result.fileContents.toString()).toBe(expected)
    })

    it('prioritizes unhashed_identifier_data when keys overlap with identifier_data', () => {
      const payloads: Payload[] = [
        {
          audience_key: '1016',
          unhashed_identifier_data: { email: 'unhashed@example.com' },
          identifier_data: { email: 'hashed@example.com' },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]

      const hashedUnhashedEmail = processHashing('unhashed@example.com', 'sha256', 'hex', (value: string) =>
        normalize('email', value)
      )

      const result = generateFile(payloads, true)
      const expected = `audience_key,email\n${enquoteIdentifier('1016')},${enquoteIdentifier(hashedUnhashedEmail)}`

      expect(result.fileContents.toString()).toBe(expected)
    })

    it('adds empty values for missing fields across different payloads', () => {
      const payloads: Payload[] = [
        {
          audience_key: 'test_audience',
          filename: 'my_file',
          delimiter: ',',
          unhashed_identifier_data: {},
          identifier_data: {
            first_name: 'liveramp 01',
            email: 'liveramp-test-01@gmailx.com',
            liveramp_test: true
          },
          enable_batching: true
        },
        {
          audience_key: 'test_audience',
          filename: 'my_file',
          delimiter: ',',
          unhashed_identifier_data: {},
          identifier_data: {
            email: 'liveramp-test-02@gmailx.com',
            liveramp_test: true
          },
          enable_batching: true
        }
      ]

      const result = generateFile(payloads, true)

      const expected = [
        `audience_key,email,first_name,liveramp_test`,
        `${enquoteIdentifier('test_audience')},${enquoteIdentifier('liveramp-test-01@gmailx.com')},${enquoteIdentifier(
          'liveramp 01'
        )},${enquoteIdentifier('true')}`,
        `${enquoteIdentifier('test_audience')},${enquoteIdentifier('liveramp-test-02@gmailx.com')},,${enquoteIdentifier(
          'true'
        )}`
      ].join('\n')

      expect(result.fileContents.toString()).toBe(expected)
    })

    it('handles unique fields only present in one payload', () => {
      const payloads: Payload[] = [
        {
          audience_key: 'test_audience',
          filename: 'my_file',
          delimiter: ',',
          unhashed_identifier_data: {},
          identifier_data: {
            first_name: 'liveramp 01',
            email: 'liveramp-test-01@gmailx.com',
            liveramp_test: true
          },
          enable_batching: true
        },
        {
          audience_key: 'test_audience',
          filename: 'my_file',
          delimiter: ',',
          unhashed_identifier_data: { unique_value: '424242' }, // unique_value only in this payload
          identifier_data: {
            liveramp_test: true
          },
          enable_batching: true
        }
      ]

      const hashedUniqueValue = processHashing('424242', 'sha256', 'hex', (value: string) =>
        normalize('unique_value', value)
      )
      const result = generateFile(payloads, true)

      // Expected headers are audience_key, email, first_name, liveramp_test, unique_value (alphabetically sorted)
      const expected = [
        `audience_key,email,first_name,liveramp_test,unique_value`,
        `${enquoteIdentifier('test_audience')},${enquoteIdentifier('liveramp-test-01@gmailx.com')},${enquoteIdentifier(
          'liveramp 01'
        )},${enquoteIdentifier('true')},`,
        `${enquoteIdentifier('test_audience')},,,${enquoteIdentifier('true')},${enquoteIdentifier(hashedUniqueValue)}` // Row with unique_value
      ].join('\n')

      expect(result.fileContents.toString()).toBe(expected)
    })

    it('handles entirely empty payloads, filling in empty cells appropriately', () => {
      const payloads: Payload[] = [
        {
          audience_key: 'test_audience',
          filename: 'my_file',
          delimiter: ',',
          unhashed_identifier_data: {},
          identifier_data: {},
          enable_batching: true
        }
      ]

      const result = generateFile(payloads, true)

      const expected = [`audience_key`, `${enquoteIdentifier('test_audience')}`].join('\n')

      expect(result.fileContents.toString()).toBe(expected)
    })

    it('correctly handles payloads with missing fields, unique fields, and completely empty payloads', () => {
      const payloads: Payload[] = [
        {
          audience_key: 'test_audience',
          filename: 'my_file',
          delimiter: ',',
          unhashed_identifier_data: {},
          identifier_data: {
            first_name: 'liveramp 01',
            email: 'liveramp-test-01@gmailx.com',
            liveramp_test: true
          },
          enable_batching: true
        },
        {
          audience_key: 'test_audience',
          filename: 'my_file',
          delimiter: ',',
          unhashed_identifier_data: {
            country: 'US'
          },
          identifier_data: {
            email: 'liveramp-test-02@gmailx.com',
            liveramp_test: true
          },
          enable_batching: true
        },
        {
          audience_key: 'test_audience',
          filename: 'my_file',
          delimiter: ',',
          unhashed_identifier_data: { unique_value: 'only_in_third' },
          identifier_data: {
            liveramp_test: true
          },
          enable_batching: true
        },
        {
          audience_key: 'test_audience',
          filename: 'my_file',
          delimiter: ',',
          unhashed_identifier_data: {},
          identifier_data: {},
          enable_batching: true
        }
      ]

      const result = generateFile(payloads, true)

      const hashedCountry = processHashing('US', 'sha256', 'hex', (value: string) => normalize('country', value))
      const hashedUniqueValue = processHashing('only_in_third', 'sha256', 'hex', (value: string) =>
        normalize('unique_value', value)
      )

      const expected = [
        `audience_key,country,email,first_name,liveramp_test,unique_value`,
        `${enquoteIdentifier('test_audience')},,${enquoteIdentifier('liveramp-test-01@gmailx.com')},${enquoteIdentifier(
          'liveramp 01'
        )},${enquoteIdentifier('true')},`,
        `${enquoteIdentifier('test_audience')},${enquoteIdentifier(hashedCountry)},${enquoteIdentifier(
          'liveramp-test-02@gmailx.com'
        )},,${enquoteIdentifier('true')},`,
        `${enquoteIdentifier('test_audience')},,,,${enquoteIdentifier('true')},${enquoteIdentifier(hashedUniqueValue)}`,
        `${enquoteIdentifier('test_audience')},,,,,`
      ].join('\n')
      expect(result.fileContents.toString()).toBe(expected)
    })

    // Test generated from LiveRamp's own example file
    // https://docs.liveramp.com/connect/en/file-formatting-examples.html#:~:text=The%20%22Under25%22%20field%20value%20is%20%22NULL%22%20rather%20than%20being%20left%20empty.
    // and ./__fixtures__/liveramp-good-example.csv
    it('generates correct CSV output from payloads matching provided data', () => {
      const payloads: Payload[] = [
        {
          audience_key: '35938495',
          identifier_data: {
            FIRSTNAME: 'Jane',
            LASTNAME: 'Doe',
            ADDRESS1: '100 Main St',
            ADDRESS2: 'Apt. A',
            CITY: 'Anytown',
            STATE: 'CA',
            ZIP: '123454545',
            SHOPPERSCORE: '54',
            LOVESDOGS: '1',
            UNDER25: '1',
            FAVORITECOLOR: 'Green'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        },
        {
          audience_key: '103578302',
          identifier_data: {
            FIRSTNAME: 'John',
            LASTNAME: 'Dough',
            ADDRESS1: '123 Any St',
            CITY: 'Anytown',
            STATE: 'CA',
            ZIP: '123456565',
            SHOPPERSCORE: '87',
            LOVESDOGS: '1',
            FAVORITECOLOR: 'Blue'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        },
        {
          audience_key: '902833740',
          identifier_data: {
            FIRSTNAME: 'Sam',
            LASTNAME: 'Sample',
            ADDRESS1: '555 New Rd',
            ADDRESS2: 'Fl 17',
            CITY: 'Mysteryville',
            STATE: 'OK',
            ZIP: '957352436',
            SHOPPERSCORE: '36',
            UNDER25: '1',
            FAVORITECOLOR: 'Red'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        },
        {
          audience_key: '328697301',
          identifier_data: {
            FIRSTNAME: 'Sarah',
            LASTNAME: 'Sampel',
            ADDRESS1: '987 Imaginary Ln',
            CITY: 'Buffetown',
            STATE: 'MI',
            ZIP: '436237235',
            SHOPPERSCORE: '99',
            FAVORITECOLOR: 'Blue'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        },
        {
          audience_key: '993802274',
          identifier_data: {
            FIRSTNAME: 'Dolly',
            LASTNAME: 'Data',
            ADDRESS1: '456 Center Ave',
            CITY: 'Newtown',
            STATE: 'NE',
            ZIP: '586452778',
            SHOPPERSCORE: '12',
            LOVESDOGS: '1',
            FAVORITECOLOR: 'Yellow'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]

      const result = generateFile(payloads, true)

      const expected = [
        'audience_key,ADDRESS1,ADDRESS2,CITY,FAVORITECOLOR,FIRSTNAME,LASTNAME,LOVESDOGS,SHOPPERSCORE,STATE,UNDER25,ZIP',
        '"35938495","100 Main St","Apt. A","Anytown","Green","Jane","Doe","1","54","CA","1","123454545"',
        '"103578302","123 Any St",,"Anytown","Blue","John","Dough","1","87","CA",,"123456565"',
        '"902833740","555 New Rd","Fl 17","Mysteryville","Red","Sam","Sample",,"36","OK","1","957352436"',
        '"328697301","987 Imaginary Ln",,"Buffetown","Blue","Sarah","Sampel",,"99","MI",,"436237235"',
        '"993802274","456 Center Ave",,"Newtown","Yellow","Dolly","Data","1","12","NE",,"586452778"'
      ].join('\n')

      expect(result.fileContents.toString()).toBe(expected)
    })

    it('maintains consistent field order regardless of payload order', () => {
      // First batch: payload1 has fields A, B, C and payload2 has fields D, E, F
      const batch1: Payload[] = [
        {
          audience_key: 'user1',
          identifier_data: {
            field_a: 'value_a',
            field_b: 'value_b',
            field_c: 'value_c'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        },
        {
          audience_key: 'user2',
          identifier_data: {
            field_d: 'value_d',
            field_e: 'value_e',
            field_f: 'value_f'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]

      // Second batch: same payloads but in REVERSE order
      const batch2: Payload[] = [
        {
          audience_key: 'user2',
          identifier_data: {
            field_d: 'value_d',
            field_e: 'value_e',
            field_f: 'value_f'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        },
        {
          audience_key: 'user1',
          identifier_data: {
            field_a: 'value_a',
            field_b: 'value_b',
            field_c: 'value_c'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]

      const result1 = generateFile(batch1, true)
      const result2 = generateFile(batch2, true)

      // Fields should now be alphabetically sorted: audience_key,field_a,field_b,field_c,field_d,field_e,field_f
      const expected = [
        'audience_key,field_a,field_b,field_c,field_d,field_e,field_f',
        '"user1","value_a","value_b","value_c",,,',
        '"user2",,,,"value_d","value_e","value_f"'
      ].join('\n')

      const expected2 = [
        'audience_key,field_a,field_b,field_c,field_d,field_e,field_f',
        '"user2",,,,"value_d","value_e","value_f"',
        '"user1","value_a","value_b","value_c",,,'
      ].join('\n')

      expect(result1.fileContents.toString()).toBe(expected)
      expect(result2.fileContents.toString()).toBe(expected2)

      // Field order should now be consistent (same headers)
      const headers1 = result1.fileContents.toString().split('\n')[0]
      const headers2 = result2.fileContents.toString().split('\n')[0]
      expect(headers1).toBe(headers2)
    })

    it('maintains consistent field order with overlapping and unique fields', () => {
      // Scenario: Multiple payloads with some shared fields and some unique fields
      // Fields should be alphabetically sorted regardless of payload order

      const batch1: Payload[] = [
        {
          audience_key: 'user1',
          identifier_data: {
            email: 'user1@example.com',
            first_name: 'John',
            age: '30'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        },
        {
          audience_key: 'user2',
          identifier_data: {
            email: 'user2@example.com',
            last_name: 'Doe',
            city: 'NYC'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        },
        {
          audience_key: 'user3',
          identifier_data: {
            email: 'user3@example.com',
            phone: '555-1234',
            country: 'USA'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]

      // Same data but user3 comes first
      const batch2: Payload[] = [
        {
          audience_key: 'user3',
          identifier_data: {
            email: 'user3@example.com',
            phone: '555-1234',
            country: 'USA'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        },
        {
          audience_key: 'user1',
          identifier_data: {
            email: 'user1@example.com',
            first_name: 'John',
            age: '30'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        },
        {
          audience_key: 'user2',
          identifier_data: {
            email: 'user2@example.com',
            last_name: 'Doe',
            city: 'NYC'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]

      const result1 = generateFile(batch1, true)
      const result2 = generateFile(batch2, true)

      // Both should have alphabetically sorted fields: audience_key,age,city,country,email,first_name,last_name,phone
      const headers1 = result1.fileContents.toString().split('\n')[0]
      const headers2 = result2.fileContents.toString().split('\n')[0]

      // Field order should now be consistent
      expect(headers1).toBe(headers2)

      // Verify the specific alphabetically sorted field order
      expect(headers1).toBe('audience_key,age,city,country,email,first_name,last_name,phone')
      expect(headers2).toBe('audience_key,age,city,country,email,first_name,last_name,phone')
    })
  })

  describe('isIncomingAlphabetical detection', () => {
    it('uses insertion order by default when no alphabetical flag is provided', () => {
      const payloads: Payload[] = [
        {
          audience_key: 'user1',
          identifier_data: {
            zip: '12345',
            email: 'user@example.com'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]

      // Call without second parameter to test default value
      const result = generateFile(payloads)

      // Should use insertion order (zip, email)
      const headers = result.fileContents.toString().split('\n')[0]
      expect(headers).toBe('audience_key,zip,email')
    })

    it('detects when incoming headers are already in alphabetical order', () => {
      const payloads: Payload[] = [
        {
          audience_key: 'user1',
          identifier_data: {
            email: 'user@example.com',
            first_name: 'John',
            last_name: 'Doe'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]

      const result = generateFile(payloads, false)

      // Headers: email, first_name, last_name - which is alphabetical
      expect(result.isIncomingAlphabetical).toBe(true)
    })

    it('detects when incoming headers are not in alphabetical order', () => {
      const payloads: Payload[] = [
        {
          audience_key: 'user1',
          identifier_data: {
            zip: '12345',
            email: 'user@example.com',
            first_name: 'John'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]

      const result = generateFile(payloads, false)

      // Headers: zip, email, first_name - zip is after first_name alphabetically
      expect(result.isIncomingAlphabetical).toBe(false)
    })

    it('returns true for single field besides audience_key', () => {
      const payloads: Payload[] = [
        {
          audience_key: 'user1',
          identifier_data: {
            email: 'user@example.com'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]

      const result = generateFile(payloads, false)

      // Single field is trivially alphabetical
      expect(result.isIncomingAlphabetical).toBe(true)
    })

    it('handles mixed identifier_data and unhashed_identifier_data', () => {
      const payloads: Payload[] = [
        {
          audience_key: 'user1',
          identifier_data: {
            city: 'NYC',
            state: 'NY'
          },
          unhashed_identifier_data: {
            email: 'user@example.com',
            phone_number: '555-1234'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]

      const result = generateFile(payloads, false)

      // Combined headers: city, state, email, phone_number
      // Alphabetically: city, email, phone_number, state
      expect(result.isIncomingAlphabetical).toBe(false)
    })

    it('detects alphabetical order with multiple payloads', () => {
      const payloads: Payload[] = [
        {
          audience_key: 'user1',
          identifier_data: {
            age: '30',
            email: 'user1@example.com'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        },
        {
          audience_key: 'user2',
          identifier_data: {
            age: '25',
            email: 'user2@example.com',
            first_name: 'Jane'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]

      const result = generateFile(payloads, false)

      // Combined unique headers: age, email, first_name - alphabetical
      expect(result.isIncomingAlphabetical).toBe(true)
    })

    it('works correctly when alphabetical sorting is enabled', () => {
      const payloads: Payload[] = [
        {
          audience_key: 'user1',
          identifier_data: {
            zip: '12345',
            email: 'user@example.com'
          },
          delimiter: ',',
          filename: 'output.csv',
          enable_batching: true
        }
      ]

      const result = generateFile(payloads, true)

      // Even though we're sorting, it should still detect incoming order was not alphabetical
      expect(result.isIncomingAlphabetical).toBe(false)

      // And the output should be sorted
      const headers = result.fileContents.toString().split('\n')[0]
      expect(headers).toBe('audience_key,email,zip')
    })
  })
})
