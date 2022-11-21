import { fetch } from '@segment/actions-core'
// @ts-ignore This is to bypass for testing purpose
export function getAccessToken(mapping: {
  refresh_token: string | undefined
  grant_type: string | undefined
  scope: string | undefined
  redirect_uri: string | undefined
  client_secret: string | undefined
  client_id: string | undefined
}) {
  const endpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'

  // @ts-ignore This is to bypass for testing purpose
  const uspCoded = new URLSearchParams({
    client_id: mapping.client_id,
    refresh_token: mapping.refresh_token,
    scope: mapping.scope,
    redirect_uri: mapping.redirect_uri,
    grant_type: 'refresh_token',
    client_secret: mapping.client_secret
  })

  try {
    return fetch(endpoint, {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: uspCoded
    })
      .then((response) => response.json())
      .then((data) => {
        return data
      })

    // return 'token';
  } catch (error) {
    // Retry on connection error
    console.log(error.message)
  }
}

// const getAccessToken = async (mapping: { refresh_token: string; grant_type: string; scope: string; redirect_uri: string; client_secret: string; client_id: string }) => {
//   const endpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
//   const uspCoded = new URLSearchParams({
//     // client_id: mapping.clientId,
//     // // refresh_token: mapping.refreshToken,
//     // scope: mapping.scope,
//     // redirect_uri: mapping.redirectUri,
//     // grant_type: 'refresh_token',
//     // client_secret: mapping.clientSecret,
//     // code: mapping.code
//     'client_id': '93a71c20-5cd5-4791-a43c-a9ffb6c0b0d7',
//     'scope': 'openid offline_access https://ads.microsoft.com/msads.manage',
//     'redirect_uri': 'https://login.microsoftonline.com/common/oauth2/nativeclient',
//     'grant_type': 'refresh_token',
//     'client_secret': 'OnJ8Q~q6vhOeOz5EGUZ5wU0NGvFRKMT~aTD6Ua_w',
//     'refresh_token': 'M.R3_BAY.-CRCfB46YwPp3guoVlhYGO1YrpyGM*a5KDDpnpC9wbGOd0JbvhrhQJ24*t3BAbXbdzk8y0bpglImddFaar3uy45C5SmD54YE1bvA3BtMi60bLS4jlyvTWe1OQHZYXDLmnrMab4WgD3AgSnEhmHYoVuCPfz!Jm*2mjkhDc!0J4i53u8bHI69OFQetqVq8jUzPd9n!io3CS6!HwuS5mKq*Sg6ZX0HSyTQGpQvGo4IrPjPxn3LnUR2vr5mvtzxdJZkH0TGM5HJd15KF*exE6gReE42Cjld32AJ!PgTlVtwsF48T8OVp*bG9suwAunXDG!sCSqq7a9biVkugwR4mwsuVtA8XVQXuCnfeN0AlCK1bq15mEkRw7lWlnmA0oaNyK4hp9jy!t5vgDSAaAmRsf2NMELmohPWt1IwOvNXYlXW8um5J2'
//   });
//
//   let resp = fetch(endpoint, {
//     method: 'post',
//     headers: {
//       'Content-Type': 'application/x-www-form-urlencoded'
//     },
//     body: uspCoded
//   })
//
//   console.log('--------------', resp)
//     //use string literals
//     // let hostEmailJson = await hostEmailData.json();
//     // return hostEmailJson;
// }
//
// export default getAccessToken;
//
