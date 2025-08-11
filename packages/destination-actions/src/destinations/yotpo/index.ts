    testAuthentication: (request, data) => {
      return request(`https://developers.yotpo.com/v4/${data.settings.store_id}/info`, {
    refreshAccessToken: async (request, data) => {
      const promise = await request<AccessTokenResponse>(`https://developers.yotpo.com/v4/oauth/token`, {
  extendRequest({ auth }) {
    return {
      headers: {
        'X-Yotpo-Token': `${auth?.accessToken}`
      }
    }
  },