import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Listrak', () => {
  describe('testAuthentication', () => {
    it('should pass client id and secret to auth endpoint and verify access token received', async () => {
      nock('https://api.listrak.com')
        .post('/oauth2/token', 'client_id=clientId1&client_secret=clientSecret1&grant_type=client_credentials')
        .matchHeader("Content-Type", "application/x-www-form-urlencoded")
        .reply(200, {
          "access_token": "token1",
          "token_type": "Bearer",
          "expires_in": 900
        });

      var accessToken = await testDestination.testAuthentication({
        client_id: "clientId1",
        client_secret: "clientSecret1"
      });

      expect(accessToken).toBe("token1");
    })
  })
})

/*
const profile = {
  name: 'John',
  age: 25
};

const scope = nock('https://mydomainname.local')
  .post('/api/send-profile', profile)
  .reply(200, {status:200});

request.post('https://mydomainname.local/api/send-profile', {json: {name: 'John', age: 25}}).on('response', function(request) {
  console.log(request.statusCode); // 200
});
*/
