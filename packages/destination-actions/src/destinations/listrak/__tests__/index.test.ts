import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Listrak', () => {
  describe('testAuthentication', () => {
    it('should pass client id and secret to auth endpoint and verify access token received', async () => {
      nock('https://auth.listrak.com')
        .post('/OAuth2/Token', 'client_id=clientId1&client_secret=clientSecret1&grant_type=client_credentials')
        .matchHeader("Content-Type", "application/x-www-form-urlencoded")
        .reply(200, {
          "access_token": "token",
          "token_type": "Bearer",
          "expires_in": 900
        });

        
      await expect(testDestination.testAuthentication({
        client_id: "clientId1",
        client_secret: "clientSecret1"
      })).resolves.not.toThrowError();
    })
  })

  const testCases: any[] = [ 
      {
        name: 'empty response body',
        body: undefined,
        status_code: 200
      },
      {
        name: 'no token returned',
        body: {
          access_token: ""
        },
        status_code: 200
      },
      {
        name: 'non 200 status code',
        body: { message: "Unexpected error" },
        status_code: 500
      }
    ];
  testCases.forEach((element: any) => {
    it(`Should throw exception if ${element.name}`, async () => {
      nock('https://auth.listrak.com')
        .post('/OAuth2/Token', 'client_id=clientId1&client_secret=clientSecret1&grant_type=client_credentials')
        .matchHeader("Content-Type", "application/x-www-form-urlencoded")
        .reply(element.status_code, element.body);

        
      await expect(testDestination.testAuthentication({
        client_id: "clientId1",
        client_secret: "clientSecret1"
      })).rejects.toThrowError();
    })  
  });

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
