jest.mock('../lib/destinations', () => ({
  getManifest: jest.fn(),
  loadDestination: jest.fn(),
  hasOauthAuthentication: jest.requireActual('../lib/destinations').hasOauthAuthentication
}))

jest.mock('fs-extra', () => ({
  __esModule: true,
  default: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    pathExists: jest.fn().mockResolvedValue(false),
    readdir: jest.fn().mockResolvedValue([])
  }
}))

import fs from 'fs-extra'
import { generatePublicMetadata } from '../commands/generate/metadata-payload'
import { resolveSourceDir } from '../commands/generate/metadata-payload'
import GenerateMetadataPayload from '../commands/generate/metadata-payload'
import { getManifest, loadDestination } from '../lib/destinations'
import type { DestinationDefinition } from '../lib/destinations'

// ---- Fixtures ----

const cloudDef: DestinationDefinition = {
  name: 'Cloud Dest',
  mode: 'cloud',
  description: 'A cloud destination.',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: { label: 'API Key', description: 'Your key.', type: 'password', required: true },
      region: { label: 'Region', description: 'Your region.', type: 'string', required: false },
      modeField: {
        label: 'Mode',
        description: 'Select mode.',
        type: 'string',
        required: { conditions: [{ fieldKey: 'x', operator: 'is', value: 'y' }] }
      }
    },
    testAuthentication: () => Promise.resolve()
  },
  actions: {
    trackEvent: {
      title: 'Track Event',
      description: 'Send track.',
      defaultSubscription: 'type = "track"',
      fields: {
        userId: {
          label: 'User ID',
          description: 'ID.',
          type: 'string',
          required: true,
          default: { '@path': '$.userId' }
        },
        props: {
          label: 'Props',
          description: 'Properties.',
          type: 'object',
          required: false,
          properties: {
            color: { label: 'Color', description: 'A color.', type: 'string' }
          }
        }
      },
      perform: () => undefined
    }
  }
} as unknown as DestinationDefinition

const browserDef: DestinationDefinition = {
  name: 'Browser Dest',
  mode: 'device',
  settings: {
    sdkKey: { label: 'SDK Key', description: 'Key.', type: 'string', required: true }
  },
  actions: {
    webAction: {
      title: 'Web Action',
      description: 'Does web stuff.',
      platform: 'web',
      fields: {},
      perform: () => undefined
    }
  }
} as unknown as DestinationDefinition

// ---- Top-level shape ----

describe('generatePublicMetadata() — top-level shape', () => {
  it('includes slug, name, mode, description', () => {
    const result = generatePublicMetadata('actions-cloud', cloudDef)
    expect(result).toMatchObject({
      slug: 'actions-cloud',
      name: 'Cloud Dest',
      mode: 'cloud',
      description: 'A cloud destination.'
    })
  })

  it('has authentication, audienceConfig, actions, presets keys', () => {
    const result = generatePublicMetadata('actions-cloud', cloudDef)
    expect(result).toHaveProperty('authentication')
    expect(result).toHaveProperty('audienceConfig')
    expect(result).toHaveProperty('actions')
    expect(result).toHaveProperty('presets')
  })

  it('throws when slug is empty', () => {
    expect(() => generatePublicMetadata('', cloudDef)).toThrow('metadata.json generation requires a slug')
  })
})

// ---- Auth fields ----

describe('generatePublicMetadata() — authentication fields', () => {
  it('serializes cloud auth fields under authentication.fields', () => {
    const { authentication } = generatePublicMetadata('actions-cloud', cloudDef)
    expect(authentication?.scheme).toBe('custom')
    expect(authentication?.fields).toHaveProperty('apiKey')
    expect(authentication?.fields.apiKey).toMatchObject({
      label: 'API Key',
      type: 'password',
      required: true
    })
  })

  it('flattens conditional required to false', () => {
    const { authentication } = generatePublicMetadata('actions-cloud', cloudDef)
    expect(authentication?.fields.modeField.required).toBe(false)
  })

  it('uses browser settings as auth fields for device-mode destinations', () => {
    const { authentication } = generatePublicMetadata('actions-browser', browserDef)
    expect(authentication?.fields).toHaveProperty('sdkKey')
    expect(authentication?.fields.sdkKey.required).toBe(true)
  })

  it('is null when destination has no auth fields or settings', () => {
    const noAuthDef = {
      name: 'No Auth',
      mode: 'cloud',
      actions: { act: { title: 'Act', description: '', fields: {}, perform: () => undefined } }
    } as unknown as DestinationDefinition
    expect(generatePublicMetadata('no-auth', noAuthDef).authentication).toBeNull()
  })

  it('emits authentication with empty fields for OAuth destinations', () => {
    const oauthDef = {
      name: 'OAuth Dest',
      mode: 'cloud',
      authentication: { scheme: 'oauth2', fields: {} },
      actions: { act: { title: 'Act', description: '', fields: {}, perform: () => undefined } }
    } as unknown as DestinationDefinition
    const { authentication } = generatePublicMetadata('oauth-dest', oauthDef)
    expect(authentication).not.toBeNull()
    expect(authentication?.scheme).toBe('oauth2')
    expect(authentication?.fields).toEqual({})
  })

  it('normalizes string choices to {label, value} objects', () => {
    const defWithChoices = {
      ...cloudDef,
      authentication: {
        scheme: 'custom',
        fields: {
          env: { label: 'Env', description: 'Env.', type: 'string', choices: ['prod', 'staging'] }
        }
      }
    } as unknown as DestinationDefinition
    const { authentication } = generatePublicMetadata('slug', defWithChoices)
    expect(authentication?.fields.env.choices).toEqual([
      { label: 'prod', value: 'prod' },
      { label: 'staging', value: 'staging' }
    ])
  })

  it('serializes multiple and depends_on on auth fields', () => {
    const def = {
      ...cloudDef,
      authentication: {
        scheme: 'custom',
        fields: {
          tags: { label: 'Tags', description: 'Tags.', type: 'string', multiple: true },
          region: {
            label: 'Region',
            description: 'Region.',
            type: 'string',
            depends_on: { conditions: [{ fieldKey: 'env', operator: 'is', value: 'prod' }] }
          }
        }
      }
    } as unknown as DestinationDefinition
    const { authentication } = generatePublicMetadata('slug', def)
    expect(authentication?.fields.tags.multiple).toBe(true)
    expect(authentication?.fields.region.depends_on).toEqual({
      conditions: [{ fieldKey: 'env', operator: 'is', value: 'prod' }]
    })
  })
})

// ---- Action fields ----

describe('generatePublicMetadata() — action fields', () => {
  it('actions is a keyed object (not an array)', () => {
    const { actions } = generatePublicMetadata('actions-cloud', cloudDef)
    expect(Array.isArray(actions)).toBe(false)
    expect(actions).toHaveProperty('trackEvent')
  })

  it('fields within an action is a keyed object', () => {
    const { actions } = generatePublicMetadata('actions-cloud', cloudDef)
    expect(Array.isArray(actions.trackEvent.fields)).toBe(false)
    expect(actions.trackEvent.fields).toHaveProperty('userId')
  })

  it('serializes action field properties correctly', () => {
    const { actions } = generatePublicMetadata('actions-cloud', cloudDef)
    expect(actions.trackEvent.fields.userId).toMatchObject({
      label: 'User ID',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    })
  })

  it('serializes nested properties for object fields', () => {
    const { actions } = generatePublicMetadata('actions-cloud', cloudDef)
    expect(actions.trackEvent.fields.props.properties).toHaveProperty('color')
    expect(actions.trackEvent.fields.props.properties?.color.type).toBe('string')
  })

  it('sets platform=web for web actions', () => {
    const { actions } = generatePublicMetadata('actions-browser', browserDef)
    expect(actions.webAction.platform).toBe('web')
  })

  it('sets platform=cloud for cloud actions', () => {
    const { actions } = generatePublicMetadata('actions-cloud', cloudDef)
    expect(actions.trackEvent.platform).toBe('cloud')
  })

  it('normalizes dynamic function to true', () => {
    const def = {
      ...cloudDef,
      actions: {
        dynAction: {
          title: 'Dyn',
          description: '',
          fields: {
            dynField: { label: 'X', description: 'X', type: 'string', dynamic: () => ['a', 'b'] }
          },
          perform: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    expect(generatePublicMetadata('slug', def).actions.dynAction.fields.dynField.dynamic).toBe(true)
  })

  it('passes through boolean dynamic values as-is', () => {
    const def = {
      ...cloudDef,
      actions: {
        dynAction: {
          title: 'Dyn',
          description: '',
          fields: {
            staticField: { label: 'X', description: 'X', type: 'string', dynamic: false }
          },
          perform: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    expect(generatePublicMetadata('slug', def).actions.dynAction.fields.staticField.dynamic).toBe(false)
  })

  it('serializes displayMode and additionalProperties on action fields', () => {
    const def = {
      ...cloudDef,
      actions: {
        testAction: {
          title: 'Test',
          description: '',
          fields: {
            traits: {
              label: 'Traits',
              description: 'User traits.',
              type: 'object',
              displayMode: 'key-value',
              additionalProperties: true
            }
          },
          perform: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    const field = generatePublicMetadata('slug', def).actions.testAction.fields.traits
    expect(field.displayMode).toBe('key-value')
    expect(field.additionalProperties).toBe(true)
  })
})

// ---- hasPerformBatch ----

describe('generatePublicMetadata() — hasPerformBatch', () => {
  it('is true when performBatch is defined', () => {
    const def = {
      ...cloudDef,
      actions: {
        batchAction: {
          title: 'Batch',
          description: 'Batches.',
          fields: {},
          perform: () => undefined,
          performBatch: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    expect(generatePublicMetadata('slug', def).actions.batchAction.hasPerformBatch).toBe(true)
  })

  it('is false when performBatch is not defined', () => {
    expect(generatePublicMetadata('actions-cloud', cloudDef).actions.trackEvent.hasPerformBatch).toBe(false)
  })
})

// ---- syncMode ----

describe('generatePublicMetadata() — syncMode', () => {
  it('is null when action has no syncMode', () => {
    expect(generatePublicMetadata('actions-cloud', cloudDef).actions.trackEvent.syncMode).toBeNull()
  })

  it('serializes syncMode with default, label, description, and choices', () => {
    const def = {
      ...cloudDef,
      actions: {
        syncAction: {
          title: 'Sync',
          description: 'Syncs.',
          fields: {},
          syncMode: {
            default: 'add',
            label: 'Sync Mode',
            description: 'How to sync.',
            choices: [
              { label: 'Add', value: 'add' },
              { label: 'Delete', value: 'delete' }
            ]
          },
          perform: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    const { syncMode } = generatePublicMetadata('slug', def).actions.syncAction
    expect(syncMode).toEqual({
      default: 'add',
      label: 'Sync Mode',
      description: 'How to sync.',
      choices: [
        { label: 'Add', value: 'add' },
        { label: 'Delete', value: 'delete' }
      ]
    })
  })
})

// ---- hooks ----

describe('generatePublicMetadata() — hooks', () => {
  it('is null when action has no hooks', () => {
    expect(generatePublicMetadata('actions-cloud', cloudDef).actions.trackEvent.hooks).toBeNull()
  })

  it('serializes hooks with label, description, inputFields, and outputFields', () => {
    const def = {
      ...cloudDef,
      actions: {
        hookAction: {
          title: 'Hook',
          description: 'Has hooks.',
          fields: {},
          hooks: {
            onMappingSave: {
              label: 'On Save',
              description: 'Fires on save.',
              inputFields: {
                webhookUrl: { label: 'Webhook URL', description: 'URL to call.', type: 'string', required: true }
              },
              outputTypes: {
                id: { label: 'ID', description: 'Generated ID.', type: 'string' }
              }
            }
          },
          perform: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    const { hooks } = generatePublicMetadata('slug', def).actions.hookAction
    expect(hooks).not.toBeNull()
    expect(hooks).toHaveProperty('onMappingSave')
    expect(hooks!.onMappingSave.label).toBe('On Save')
    expect(hooks!.onMappingSave.description).toBe('Fires on save.')
    expect(hooks!.onMappingSave.inputFields).toHaveProperty('webhookUrl')
    expect(hooks!.onMappingSave.inputFields.webhookUrl.label).toBe('Webhook URL')
    expect(hooks!.onMappingSave.inputFields.webhookUrl.required).toBe(true)
    expect(hooks!.onMappingSave.outputFields).toHaveProperty('id')
    expect(hooks!.onMappingSave.outputFields.id.label).toBe('ID')
  })
})

// ---- audienceConfig ----

describe('generatePublicMetadata() — audienceConfig', () => {
  it('is null when no audienceConfig is present', () => {
    expect(generatePublicMetadata('actions-cloud', cloudDef).audienceConfig).toBeNull()
  })

  it('serializes audienceConfig mode, audienceFields, and supportsAudienceFunctions', () => {
    const def = {
      ...cloudDef,
      audienceConfig: {
        mode: { type: 'realtime' },
        createAudience: () => Promise.resolve({ externalId: '1' }),
        getAudience: () => Promise.resolve({ externalId: '1' })
      },
      audienceFields: {
        listId: { label: 'List ID', description: 'The list.', type: 'string', required: true }
      }
    } as unknown as DestinationDefinition
    const { audienceConfig } = generatePublicMetadata('slug', def)
    expect(audienceConfig).not.toBeNull()
    expect(audienceConfig?.mode).toEqual({ type: 'realtime' })
    expect(audienceConfig?.audienceFields).toHaveProperty('listId')
    expect(audienceConfig?.supportsAudienceFunctions).toBe(true)
    expect(typeof (audienceConfig as any)?.createAudience).toBe('undefined')
  })

  it('sets supportsAudienceFunctions to false when functions are missing', () => {
    const def = {
      ...cloudDef,
      audienceConfig: {
        mode: { type: 'synced', full_audience_sync: true }
      },
      audienceFields: {}
    } as unknown as DestinationDefinition
    const { audienceConfig } = generatePublicMetadata('slug', def)
    expect(audienceConfig).not.toBeNull()
    expect(audienceConfig?.mode).toEqual({ type: 'synced', full_audience_sync: true })
    expect(audienceConfig?.supportsAudienceFunctions).toBe(false)
  })
})

// ---- presets ----

describe('generatePublicMetadata() — presets', () => {
  it('passes through presets with all required fields', () => {
    const def = {
      ...cloudDef,
      presets: [
        {
          name: 'Track',
          type: 'automatic',
          partnerAction: 'trackEvent',
          subscribe: 'type = "track"',
          mapping: { a: 1 }
        }
      ]
    } as unknown as DestinationDefinition
    const { presets } = generatePublicMetadata('slug', def)
    expect(presets).toHaveLength(1)
    expect(presets[0]).toMatchObject({
      name: 'Track',
      type: 'automatic',
      partnerAction: 'trackEvent',
      subscribe: 'type = "track"',
      mapping: { a: 1 },
      eventSlug: null
    })
  })

  it('returns empty array when no presets defined', () => {
    expect(generatePublicMetadata('actions-cloud', cloudDef).presets).toEqual([])
  })
})

// ---- no auto-injected fields ----

describe('generatePublicMetadata() — no auto-injected fields', () => {
  it('does not inject enable_batching', () => {
    const def = {
      ...cloudDef,
      actions: {
        batchAction: {
          title: 'Batch',
          description: '',
          fields: {},
          perform: () => undefined,
          performBatch: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    const { actions } = generatePublicMetadata('slug', def)
    expect(actions.batchAction.fields).not.toHaveProperty('enable_batching')
  })

  it('does not inject __segment_internal_sync_mode', () => {
    const def = {
      ...cloudDef,
      actions: {
        syncAction: {
          title: 'Sync',
          description: '',
          fields: {},
          syncMode: {
            default: 'add',
            label: '',
            description: '',
            choices: [{ label: 'Add', value: 'add' }]
          },
          perform: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    const { actions } = generatePublicMetadata('slug', def)
    expect(actions.syncAction.fields).not.toHaveProperty('__segment_internal_sync_mode')
  })
})

// ---- resolveSourceDir ----

describe('resolveSourceDir()', () => {
  it('resolves compiled cloud dist path to src directory', () => {
    expect(resolveSourceDir('/repo/packages/destination-actions/dist/destinations/my-dest/index.js')).toBe(
      '/repo/packages/destination-actions/src/destinations/my-dest'
    )
  })

  it('resolves ts-node cloud src path to its own directory', () => {
    expect(resolveSourceDir('/repo/packages/destination-actions/src/destinations/my-dest/index.ts')).toBe(
      '/repo/packages/destination-actions/src/destinations/my-dest'
    )
  })

  it('resolves compiled browser dist path to the destination root', () => {
    expect(resolveSourceDir('/repo/packages/browser-destinations/destinations/my-browser-dest/dist/cjs/index.js')).toBe(
      '/repo/packages/browser-destinations/destinations/my-browser-dest'
    )
  })

  it('resolves browser src path to the destination root', () => {
    expect(resolveSourceDir('/repo/packages/browser-destinations/destinations/my-browser-dest/src/index.ts')).toBe(
      '/repo/packages/browser-destinations/destinations/my-browser-dest'
    )
  })

  it('resolves compiled warehouse dist path to src directory', () => {
    expect(resolveSourceDir('/repo/packages/warehouse-destinations/dist/destinations/my-wh/index.js')).toBe(
      '/repo/packages/warehouse-destinations/src/destinations/my-wh'
    )
  })

  it('resolves ts-node warehouse src path to its own directory', () => {
    expect(resolveSourceDir('/repo/packages/warehouse-destinations/src/destinations/my-wh/index.ts')).toBe(
      '/repo/packages/warehouse-destinations/src/destinations/my-wh'
    )
  })

  it('returns null for an unrecognized path pattern', () => {
    expect(resolveSourceDir('/some/random/path/index.js')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(resolveSourceDir('')).toBeNull()
  })
})

// ---- Command E2E ----

describe('GenerateMetadataPayload command', () => {
  const mockGetManifest = getManifest as jest.MockedFunction<typeof getManifest>
  const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  const mockPathExists = fs.pathExists as unknown as jest.MockedFunction<() => Promise<boolean>>
  const mockReaddir = fs.readdir as unknown as jest.MockedFunction<() => Promise<string[]>>

  const validEntry = {
    path: '/repo/packages/destination-actions/dist/destinations/test-dest/index.js',
    definition: { ...cloudDef, slug: 'test-dest' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockWriteFile.mockResolvedValue(undefined as never)
    mockPathExists.mockResolvedValue(false)
    mockReaddir.mockResolvedValue([])
  })

  it('writes metadata.json to the resolved source dir', async () => {
    mockGetManifest.mockReturnValue({ 'meta-1': validEntry as any })
    await GenerateMetadataPayload.run([])
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/repo/packages/destination-actions/src/destinations/test-dest/metadata.json',
      expect.stringContaining('"slug": "test-dest"')
    )
  })

  it('writes metadata.json with trailing newline', async () => {
    mockGetManifest.mockReturnValue({ 'meta-1': validEntry as any })
    await GenerateMetadataPayload.run([])
    const written = mockWriteFile.mock.calls[0][1] as string
    expect(written.endsWith('\n')).toBe(true)
  })

  it('skips entries where resolveSourceDir returns null', async () => {
    mockGetManifest.mockReturnValue({
      'meta-bad': { path: '/some/unrecognizable/path/index.js', definition: cloudDef } as any
    })
    await GenerateMetadataPayload.run([])
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('processes all entries when no --slug flag is passed', async () => {
    mockGetManifest.mockReturnValue({
      'meta-1': validEntry as any,
      'meta-2': {
        path: '/repo/packages/destination-actions/dist/destinations/second-dest/index.js',
        definition: { ...cloudDef, name: 'Second Dest' }
      } as any
    })
    await GenerateMetadataPayload.run([])
    expect(mockWriteFile).toHaveBeenCalledTimes(2)
  })

  it('filters to only the matching slug when --slug is passed', async () => {
    mockGetManifest.mockReturnValue({
      'meta-alpha': {
        path: '/repo/packages/destination-actions/dist/destinations/alpha-dest/index.js',
        definition: { ...cloudDef, slug: 'alpha-dest' }
      } as any,
      'meta-beta': {
        path: '/repo/packages/destination-actions/dist/destinations/beta-dest/index.js',
        definition: { ...cloudDef, slug: 'beta-dest', name: 'Beta' }
      } as any
    })
    await GenerateMetadataPayload.run(['--slug=alpha-dest'])
    expect(mockWriteFile).toHaveBeenCalledTimes(1)
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/repo/packages/destination-actions/src/destinations/alpha-dest/metadata.json',
      expect.any(String)
    )
  })

  it('throws when --slug matches no destinations', async () => {
    mockGetManifest.mockReturnValue({
      'meta-1': validEntry as any
    })
    await expect(GenerateMetadataPayload.run(['--slug=nonexistent'])).rejects.toThrow(
      'No destinations matched the slug filter'
    )
  })

  it('continues processing remaining entries when one fails', async () => {
    const failDef = {
      ...cloudDef,
      slug: 'bad-dest',
      get actions() {
        throw new Error('boom')
      }
    }
    mockGetManifest.mockReturnValue({
      'meta-bad': {
        path: '/repo/packages/destination-actions/dist/destinations/bad-dest/index.js',
        definition: failDef
      } as any,
      'meta-good': {
        path: '/repo/packages/destination-actions/dist/destinations/good-dest/index.js',
        definition: { ...cloudDef, slug: 'good-dest' }
      } as any
    })
    await expect(GenerateMetadataPayload.run([])).rejects.toThrow('1 destination(s) failed to generate metadata')
    expect(mockWriteFile).toHaveBeenCalledTimes(1)
  })

  it('filters to only cloud destinations when --mode=cloud is passed', async () => {
    mockGetManifest.mockReturnValue({
      'meta-cloud': {
        path: '/repo/packages/destination-actions/dist/destinations/cloud-dest/index.js',
        definition: { ...cloudDef, slug: 'cloud-dest', mode: 'cloud' }
      } as any,
      'meta-device': {
        path: '/repo/packages/browser-destinations/destinations/browser-dest/dist/cjs/index.js',
        definition: { ...browserDef, slug: 'browser-dest', mode: 'device' }
      } as any
    })
    await GenerateMetadataPayload.run(['--mode=cloud'])
    expect(mockWriteFile).toHaveBeenCalledTimes(1)
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/repo/packages/destination-actions/src/destinations/cloud-dest/metadata.json',
      expect.any(String)
    )
  })

  it('filters to only device destinations when --mode=device is passed', async () => {
    mockGetManifest.mockReturnValue({
      'meta-cloud': {
        path: '/repo/packages/destination-actions/dist/destinations/cloud-dest/index.js',
        definition: { ...cloudDef, slug: 'cloud-dest', mode: 'cloud' }
      } as any,
      'meta-device': {
        path: '/repo/packages/browser-destinations/destinations/browser-dest/dist/cjs/index.js',
        definition: { ...browserDef, slug: 'browser-dest', mode: 'device' }
      } as any
    })
    await GenerateMetadataPayload.run(['--mode=device'])
    expect(mockWriteFile).toHaveBeenCalledTimes(1)
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/repo/packages/browser-destinations/destinations/browser-dest/metadata.json',
      expect.any(String)
    )
  })
})

// ---- Filesystem Discovery ----

function makeDirent(name: string, isDir = true) {
  return { name, isDirectory: () => isDir, isFile: () => !isDir } as any
}

describe('GenerateMetadataPayload — filesystem discovery', () => {
  const mockGetManifest = getManifest as jest.MockedFunction<typeof getManifest>
  const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  const mockPathExists = fs.pathExists as unknown as jest.MockedFunction<(p: string) => Promise<boolean>>
  const mockReaddir = fs.readdir as unknown as jest.MockedFunction<() => Promise<any[]>>
  const mockLoadDestination = loadDestination as jest.MockedFunction<typeof loadDestination>

  const unregisteredDef = {
    ...cloudDef,
    name: 'Unregistered Dest',
    slug: 'actions-unregistered'
  } as unknown as DestinationDefinition

  beforeEach(() => {
    jest.clearAllMocks()
    mockWriteFile.mockResolvedValue(undefined as never)
    mockGetManifest.mockReturnValue({})
  })

  it('discovers an unregistered destination directory with an index.ts', async () => {
    mockPathExists.mockImplementation(async (p: string) => {
      if (p.includes('destination-actions/src/destinations')) return true
      if (p.endsWith('new-dest/index.ts')) return true
      return false
    })
    mockReaddir.mockResolvedValue([makeDirent('new-dest')])
    mockLoadDestination.mockResolvedValue(unregisteredDef)

    await GenerateMetadataPayload.run([])
    expect(mockLoadDestination).toHaveBeenCalledWith(expect.stringContaining('new-dest/index.ts'))
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('new-dest/metadata.json'),
      expect.stringContaining('"slug": "actions-unregistered"')
    )
  })

  it('skips non-directory entries', async () => {
    mockPathExists.mockResolvedValue(true)
    mockReaddir.mockResolvedValue([makeDirent('utils.ts', false), makeDirent('.DS_Store', false)])

    await GenerateMetadataPayload.run([])
    expect(mockLoadDestination).not.toHaveBeenCalled()
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('skips directories without an index.ts', async () => {
    mockPathExists.mockImplementation(async (p: string) => {
      if (p.includes('destination-actions/src/destinations') && !p.includes('index.ts')) return true
      return false
    })
    mockReaddir.mockResolvedValue([makeDirent('no-index-dir')])

    await GenerateMetadataPayload.run([])
    expect(mockLoadDestination).not.toHaveBeenCalled()
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('skips directories where loadDestination returns null', async () => {
    mockPathExists.mockResolvedValue(true)
    mockReaddir.mockResolvedValue([makeDirent('invalid-dest')])
    mockLoadDestination.mockResolvedValue(null)

    await GenerateMetadataPayload.run([])
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('skips directories where loadDestination throws and continues', async () => {
    mockPathExists.mockResolvedValue(true)
    mockReaddir.mockResolvedValue([makeDirent('broken-dest'), makeDirent('good-dest')])
    mockLoadDestination.mockRejectedValueOnce(new Error('syntax error')).mockResolvedValueOnce(unregisteredDef)

    await GenerateMetadataPayload.run([])
    expect(mockWriteFile).toHaveBeenCalledTimes(1)
    expect(mockWriteFile).toHaveBeenCalledWith(expect.stringContaining('good-dest/metadata.json'), expect.any(String))
  })

  it('does not re-discover directories already in the manifest', async () => {
    mockGetManifest.mockReturnValue({
      'meta-1': {
        path: '/repo/packages/destination-actions/dist/destinations/existing-dest/index.js',
        definition: { ...cloudDef, slug: 'existing-dest' },
        directory: 'existing-dest'
      } as any
    })
    mockPathExists.mockImplementation(async (p: string) => {
      if (typeof p === 'string' && p.includes('destination-actions/src/destinations')) return true
      return false
    })
    mockReaddir.mockResolvedValue([makeDirent('existing-dest')])

    await GenerateMetadataPayload.run([])
    expect(mockLoadDestination).not.toHaveBeenCalled()
  })
})
