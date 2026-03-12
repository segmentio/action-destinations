/**
 * API endpoint definitions for payload generation
 */

/**
 * Type definitions for API endpoints
 */
export interface ApiEndpoint {
  name: string
  description: string
  method: 'GET' | 'POST'
  path: string
  pathParams?: Array<{
    key: string
    description: string
    placeholder: string
  }>
  requestTemplate: Record<string, any>
}

/**
 * Static list of API endpoints
 */
export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    name: 'Invoke Delete Handler',
    description: 'Invokes the delete handler of the destination',
    method: 'POST',
    path: '/delete',
    requestTemplate: {
      payload: {},
      settings: {}
    }
  },
  {
    name: 'Authenticate',
    description: 'Test authentication for the destination',
    method: 'POST',
    path: '/authenticate',
    requestTemplate: {
      settings: {}
    }
  },
  {
    name: 'Create Audience',
    description: 'Create an audience in the destination',
    method: 'POST',
    path: '/createAudience',
    requestTemplate: {
      settings: {},
      audienceSettings: {},
      audienceName: 'Example Audience'
    }
  },
  {
    name: 'Get Audience',
    description: 'Get an audience from the destination',
    method: 'POST',
    path: '/getAudience',
    requestTemplate: {
      settings: {},
      audienceSettings: {},
      externalId: 'AUDIENCE_ID'
    }
  },
  {
    name: 'Refresh Access Token',
    description: 'Refresh access token for the destination',
    method: 'POST',
    path: '/refreshAccessToken',
    requestTemplate: {
      settings: {}
    }
  },
  {
    name: 'Execute Action',
    description: 'Execute a specific action',
    method: 'POST',
    path: '/:actionSlug',
    pathParams: [
      {
        key: 'actionSlug',
        description: 'The slug of the action to execute',
        placeholder: 'yourActionSlug'
      }
    ],
    requestTemplate: {
      payload: {},
      settings: {},
      mapping: {},
      auth: {},
      features: {},
      subscriptionMetadata: {}
    }
  },
  {
    name: 'Execute Dynamic Field',
    description: 'Execute a dynamic field for a specific action',
    method: 'POST',
    path: '/:actionSlug/:field',
    pathParams: [
      {
        key: 'actionSlug',
        description: 'The slug of the action',
        placeholder: 'yourActionSlug'
      },
      {
        key: 'field',
        description: 'The dynamic field to execute',
        placeholder: 'yourDynamicField'
      }
    ],
    requestTemplate: {
      settings: {},
      payload: {},
      page: 1,
      auth: {},
      audienceSettings: {},
      dynamicFieldContext: {}
    }
  },
  {
    name: 'Execute Hook',
    description: 'Execute a hook for a specific action',
    method: 'POST',
    path: '/:actionSlug/hooks/:hookName',
    pathParams: [
      {
        key: 'actionSlug',
        description: 'The slug of the action',
        placeholder: 'yourActionSlug'
      },
      {
        key: 'hookName',
        description: 'The name of the hook to execute',
        placeholder: 'yourHookName'
      }
    ],
    requestTemplate: {
      settings: {},
      payload: {},
      page: 1,
      auth: {},
      audienceSettings: {},
      hookInputs: {},
      hookOutputs: {}
    }
  },
  {
    name: 'Execute Dynamic Hook Input Field',
    description: 'Execute a dynamic hook input field for a specific action',
    method: 'POST',
    path: '/:actionSlug/hooks/:hookName/dynamic/:fieldKey',
    pathParams: [
      {
        key: 'actionSlug',
        description: 'The slug of the action',
        placeholder: 'yourActionSlug'
      },
      {
        key: 'hookName',
        description: 'The name of the hook',
        placeholder: 'yourHookName'
      },
      {
        key: 'fieldKey',
        description: 'The key of the dynamic field',
        placeholder: 'yourFieldKey'
      }
    ],
    requestTemplate: {
      settings: {},
      payload: {},
      page: 1,
      auth: {},
      audienceSettings: {},
      hookInputs: {},
      dynamicFieldContext: {}
    }
  }
]

/**
 * Get an API endpoint by name
 */
export function getApiEndpointByName(name: string): ApiEndpoint | undefined {
  return API_ENDPOINTS.find((api) => api.name === name)
}

/**
 * Get path with path parameters applied
 */
export function getFormattedPath(endpoint: ApiEndpoint, pathParams?: Record<string, string>): string {
  if (!endpoint.pathParams || !pathParams) {
    return endpoint.path
  }

  let formattedPath = endpoint.path
  for (const param of endpoint.pathParams) {
    const value = pathParams[param.key] || param.placeholder
    formattedPath = formattedPath.replace(`:${param.key}`, value)
  }

  return formattedPath
}
