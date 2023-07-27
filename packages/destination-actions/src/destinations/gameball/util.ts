import { RequestClient } from "@segment/actions-core/create-request-client";
import { InputField } from "@segment/actions-core/index";
import { RequestOptions } from "@segment/actions-core/request-client";
import type { Settings } from './generated-types';

export const endpoints = {
  baseApiUrl: 'https://api.gameball.co',
  baseAuthUrl: 'https://auth.gameball.co',
  testAuthentication: '/api/v1.0/protected/TestAuthentication',
  trackEvent: '/api/v3.0/integrations/event',
  trackOrder: '/api/v3.0/integrations/order',
  identifyPlayer: '/api/v3.0/integrations/player',
}

export const playerProperties: Record<string, InputField> = {
  playerUniqueId: {
    label: 'Player ID',
    description: 'Unique identifier for the player in your database.',
    type: 'string',
    required: true,
    default: {
      '@if': {
        exists: { '@path': '$.userId' },
        then: { '@path': '$.userId' },
        else: { '@path': '$.anonymousId' }
      }
    }
  },
  mobile: {
    label: 'Mobile number',
    description: `Player's unique mobile number.`,
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.properties.mobile' },
        then: { '@path': '$.properties.mobile' },
        else: { '@path': '$.traits.mobile' }
      }
    }
  },
  email: {
    label: 'Email',
    description: `Player's unique email.`,
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.email' },
        then: { '@path': '$.email' },
        else: { '@path': '$.traits.email' }
      }
    }
  }
}

export const sendRequest = async (request: RequestClient, path: string, settings: Settings, body: any, requestOptions: RequestOptions | null = null) => {
  requestOptions = requestOptions || {} as RequestOptions;
  requestOptions.json = requestOptions.json || body;
  requestOptions.headers = requestOptions.headers || {};
  requestOptions.headers['APIKey'] = settings.apiKey;
  requestOptions.headers['Content-Type'] = 'application/json';
  requestOptions.headers['x-gb-agent'] = 'GB/Zapier';
  requestOptions.throwHttpErrors = false;
  requestOptions.method = requestOptions.method || 'POST';
  return await request(path, requestOptions)
}
