import { hash_user_data, test_schema } from "../fb-capi-user-data";

describe('FacebookConversionsApi', () => {
    describe('UserData', () => {
        it('should correctly convert the user_data_field to an interface', async () => {
            console.log('test', test_schema)
            fail()
        })

        it('should correctly hash user data fields', async () => {
            expect(hash_user_data({
                email: 'test@test.com',
                phone: '1234567',
                fbLoginID: 1234254
            })).toMatchInlineSnapshot('')
        })
    })
})