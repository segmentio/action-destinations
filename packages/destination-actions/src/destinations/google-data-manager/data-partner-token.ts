import { GoogleAuth } from 'google-auth-library'

// Keep track of token + expiry
let cachedToken = ''
let tokenExpiry = 0 // epoch seconds

interface GoogleServiceAccountKey {
  client_email: string
  private_key: string
  // ...other fields if needed
}

export async function getDataPartnerToken() {
  const now = Math.floor(Date.now() / 1000)

  // Return cached token if still valid (with 1 min safety buffer)
  if (cachedToken && now < tokenExpiry - 60) {
    return cachedToken
  }

  const keyJson = process.env.ACTIONS_GOOGLE_DATA_MANAGER_CLIENT_CREDENTIALS
  if (!keyJson) {
    throw new Error(
      'Missing service account key in environment variable ACTIONS_GOOGLE_DATA_MANAGER_CLIENT_CREDENTIALS'
    )
  }

  let key: GoogleServiceAccountKey
  try {
    key = JSON.parse(keyJson) as GoogleServiceAccountKey
  } catch (err) {
    throw new Error('Invalid service account key JSON in environment variable.')
  }

  // Create an auth client with the required scope
  const auth = new GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/datamanager']
  })

  // Get an access token
  const client = await auth.getClient()
  const tokens = await client.getAccessToken()
  if (!tokens || typeof tokens !== 'object' || !('token' in tokens)) {
    throw new Error('Failed to obtain access token from GoogleAuth client.')
  }
  cachedToken = tokens.token as string
  // GoogleAuth does not provide expiry, so set to 1 hour from now
  tokenExpiry = now + 3600
  return cachedToken
}
