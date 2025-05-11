// eslint-disable-next-line no-restricted-syntax
import { createHash } from 'crypto'
import type { ModifiedResponse } from '@segment/actions-core'
import { RequestClient, IntegrationError } from '@segment/actions-core'
import { Payload } from './generated-types'
import { AudienceSettings, Settings } from '../generated-types'

interface ClusterItem {
  user_id: string
  type: string
  is_hashed: boolean
}

type Cluster = { cluster: ClusterItem[] } | null

interface TaboolaPayload {
  operation: 'ADD' | 'REMOVE'
  audience_id: number
  identities: Cluster[]
}

interface RefreshTokenResponse {
  access_token: string
}

export class TaboolaClient {
  request: RequestClient
  payloads: Payload[]
  audienceSettings?: AudienceSettings

  constructor(request: RequestClient, payloads: Payload[], audienceSettings?: AudienceSettings) {
    this.request = request
    this.payloads = payloads
    this.audienceSettings = audienceSettings

    if (!this.audienceSettings) {
      throw new IntegrationError('Bad Request: no audienceSettings found.', 'INVALID_REQUEST_DATA', 400)
    }

    if (!this.audienceSettings.account_id) {
      throw new IntegrationError('Bad Request: no audienceSettings.account_id found.', 'INVALID_REQUEST_DATA', 400)
    }
  }

  static async refreshAccessToken(request: RequestClient, settings: Settings) {
    const res = await request<RefreshTokenResponse>('https://backstage.taboola.com/backstage/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: String(
        new URLSearchParams({
          client_id: settings.client_id,
          client_secret: settings.client_secret,
          grant_type: 'client_credentials'
        })
      )
    })
    return { accessToken: res.data.access_token }
  }

  async sendToTaboola() {
    this.payloads.forEach((payload) => {
      payload.action = payload.traits_or_props[payload.segment_computation_key] ? 'ADD' : 'REMOVE'
    })

    const actionMap = new Map<string, Map<string, Payload[]>>()

    this.payloads.forEach((payload) => {
      if (!actionMap.has(payload.action as string)) {
        actionMap.set(payload.action as string, new Map<string, Payload[]>())
      }

      const audienceMap = actionMap.get(payload.action as string) as Map<string, Payload[]>

      if (!audienceMap.has(payload.external_audience_id)) {
        audienceMap.set(payload.external_audience_id, [])
      }

      audienceMap.get(payload.external_audience_id)?.push(payload)
    })

    const taboolaRequests: Promise<ModifiedResponse<Response>>[] = []

    actionMap.forEach((audienceMap, action) => {
      audienceMap.forEach((payloads, external_audience_id) => {
        const identities = payloads.map((payload) => this.createCluster(payload)).filter((cluster) => cluster !== null)
        if (identities.length > 0) {
          taboolaRequests.push(
            this.request(
              `https://backstage.taboola.com/backstage/api/1.0/${
                this.audienceSettings?.account_id as string
              }/audience_onboarding`,
              {
                method: 'POST',
                json: {
                  operation: action as 'ADD' | 'REMOVE',
                  audience_id: Number(external_audience_id),
                  identities
                } as TaboolaPayload
              }
            )
          )
        }
      })
    })

    if (taboolaRequests.length === 0) {
      throw new IntegrationError('No valid payloads found to sync.', 'INVALID_REQUEST_DATA', 400)
    }

    return await Promise.all(taboolaRequests)
  }

  hashEmail(email: string): string {
    const sha256HashedRegex = /^[a-f0-9]{64}$/i
    const isSHA256Hash = sha256HashedRegex.test(email)
    if (!isSHA256Hash) {
      email = createHash('sha256').update(email).digest('hex')
    }
    return email
  }

  createCluster(payload: Payload): Cluster {
    if (!payload.user_email && !payload.device_id) {
      return null
    }

    let email = payload.user_email
    const cluster = []

    if (email) {
      email = this.hashEmail(email)
      cluster.push({
        user_id: email,
        type: 'EMAIL_ID',
        is_hashed: true
      })
    }

    if (payload.device_id) {
      cluster.push({
        user_id: payload.device_id,
        type: 'DEVICE_ID',
        is_hashed: false
      })
    }
    return { cluster }
  }
}
