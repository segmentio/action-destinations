# Authentication

Nearly all destinations require some sort of authentication – and our Destination interface provides details about how customers need to authenticate with your destination to send data or retrieve data for dynamic input fields.

## Basic Authentication

Basic authentication is useful if your destination requires username and password to authenticate. These are values that only the customer and the destination know.

_TIP: When scaffolding your integration you can use the Basic Auth template by passing --template basic-auth (or selecting it from the auto-prompt)_

```

const authentication = {
  // the 'basic' authentication scheme tells Segment to automatically
  // include the `username` and `password` fields so you don't have to.
  // Segment will automatically do base64 header encoding of the username:password
  scheme: 'basic',

  fields: {
    username: {
      label: 'Username',
      description: 'Your username',
      type: 'string',
      required: true
    },
    password: {
      label: 'password',
      description: 'Your password.',
      type: 'string',
      required: true
    }
  },

  // a function that can test the user's credentials
  testRequest: (request) => {
    return request('https://example.com/api/accounts/me.json')
  }
}

const destination = {
  // ...other properties
  authentication,

  extendRequest({ settings }) {
    return {
      username: settings.username,
      password: settings.password
    }
  }
}
```

## Custom Authentication

Custom authentication is perhaps the most common type of authentication we see – it’s what most “API Key” based authentication should use. You’ll likely need to define an `extendRequest` function to complete the authentication by modifying request headers with some authentication input fields.

```

const authentication = {
  // the 'custom' scheme doesn't do anything automagically for you, but let's you
  // define the behavior through input fields and `extendRequest`.
  // this is what most API key-based destinations should use
  scheme: 'custom',

  // a function that can test the user's credentials
  testRequest: (request) => {
    return request(`/accounts/me.json`)
  },

  // fields that are specific to authentication
  fields: {
    subdomain: {
      type: 'string',
      label: 'Subdomain',
      description: 'The subdomain for your account, found in your user settings.',
      required: true
    },
    apiKey: {
      type: 'string',
      label: 'API Key',
      description: 'Found on your settings page.',
      required: true
    }
  }
}

const destination = {
  // ...other properties
  authentication,
  // we may explore a simple JSON representation that supports template strings
  extendRequest: ({ settings }) => {
    return {
      prefixUrl: `https://${settings.subdomain}.example.com/api`,
      headers: { Authorization: `Bearer ${settings.apiKey}` },
      responseType: 'json'
    }
  }
}
```

## OAuth 2.0 Managed Authentication Scheme

OAuth 2.0 Managed Authentication scheme is the model to be used for destination APIs which support [OAuth 2.0](https://oauth.net/2/). You’ll be able to define a `refreshAccessToken` function if you want the framework to refresh expired tokens.

You will have a new `auth` object available in `extendRequest` and `refreshAccessToken` which will surface your destination’s accessToken, refreshToken, clientId and clientSecret (these last two only available in `refreshAccessToken`). Most destination APIs expect the access token to be used as part of the authorization header in every request. You can use `extendRequest` to define that header.

Once your Actions code is deployed and you've received an invitation to manage the destination within our developer portal, you can then provide Segment with the following OAuth parameters.

- Client ID
- Client Secret
- Authorization server URL
  - Specify where to send users to authenticate with your API.
- Access token server URL
  - Enter the API endpoint URL where Segment sends the approval code on user redirect.

```

authentication: {
    scheme: 'oauth-managed',
    fields: {
      subdomain: {
        type: 'string',
        label: 'Subdomain',
        description: 'The subdomain for your account, found in your user settings.',
        required: true
      }
    },
    testAuthentication: async (request) => {
      const res = await request<UserInfoResponse>('https://www.example.com/oauth2/v3/userinfo', {
        method: 'GET'
      })
      return { name: res.data.name}
    },
    refreshAccessToken: async (request, { settings, auth }) => {
      const res = await request<RefreshTokenResponse>(`https://${settings.subdomain}.example.com/api/oauth2/token`, {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })
      return { accessToken: res.data.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  }
```

## Unsupported Authentication Schemes

We will explore adding built-in support for more authentication schemes when there is sufficient demand. These might include:

- Session Authentication
- Digest Authentication
- OAuth1
