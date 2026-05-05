jest.mock('../lib/destinations', () => ({
  getManifest: jest.fn(),
  hasOauthAuthentication: jest.requireActual('../lib/destinations').hasOauthAuthentication
}))

jest.mock('fs-extra', () => ({
  __esModule: true,
  default: {
    writeJson: jest.fn().mockResolvedValue(undefined)
  }
}))

import fs from 'fs-extra'
import { generateDestinationPayload, resolveSourceDir } from '../commands/generate/metadata-payload'
import GenerateMetadataPayload from '../commands/generate/metadata-payload'
import { getManifest } from '../lib/destinations'
import type { DestinationDefinition } from '../lib/destinations'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const basicAuthDefinition: DestinationDefinition = {
  name: 'Test Basic Destination',
  mode: 'cloud',
  description: 'A test destination',
  authentication: {
    scheme: 'basic',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your API key.',
        type: 'string',
        required: true
      },
      region: {
        label: 'Region',
        description: 'Your region.',
        type: 'string',
        required: false
      }
    },
    testAuthentication: () => Promise.resolve()
  },
  actions: {
    trackEvent: {
      title: 'Track Event',
      description: 'Send a track event.',
      defaultSubscription: 'type = "track"',
      fields: {
        userId: {
          label: 'User ID',
          description: 'The user identifier.',
          type: 'string',
          required: true,
          default: { '@path': '$.userId' }
        },
        eventName: {
          label: 'Event Name',
          description: 'Name of the event.',
          type: 'string',
          required: false
        }
      },
      perform: () => undefined
    }
  }
} as unknown as DestinationDefinition

const conditionalRequiredDefinition: DestinationDefinition = {
  name: 'Test Conditional Destination',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      conditionalField: {
        label: 'Conditional Field',
        description: 'Only required when mode is advanced.',
        type: 'string',
        required: {
          conditions: [{ fieldKey: 'mode', operator: 'is', value: 'advanced' }]
        }
      },
      alwaysRequired: {
        label: 'Always Required',
        description: 'This is always required.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: () => Promise.resolve()
  },
  actions: {
    doSomething: {
      title: 'Do Something',
      description: 'Does something.',
      fields: {
        payload: { label: 'Payload', description: 'The payload.', type: 'string' }
      },
      perform: () => undefined
    }
  }
} as unknown as DestinationDefinition

const multiActionDefinition: DestinationDefinition = {
  name: 'Test Multi Action',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      token: { label: 'Token', description: 'Auth token.', type: 'password', required: true }
    },
    testAuthentication: () => Promise.resolve()
  },
  actions: {
    zebra: {
      title: 'Zebra Action',
      description: 'Runs last alphabetically.',
      fields: {},
      perform: () => undefined
    },
    apple: {
      title: 'Apple Action',
      description: 'Runs first alphabetically.',
      fields: {},
      perform: () => undefined
    }
  }
} as unknown as DestinationDefinition

const browserActionDefinition: DestinationDefinition = {
  name: 'Test Browser Destination',
  mode: 'device',
  actions: {
    webAction: {
      title: 'Web Action',
      description: 'Runs in browser.',
      platform: 'web',
      fields: {},
      perform: () => undefined
    }
  }
} as unknown as DestinationDefinition

const badArrayPathDefinition: DestinationDefinition = {
  name: 'Bad ArrayPath Destination',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: { label: 'Key', description: 'Key', type: 'string', required: false }
    },
    testAuthentication: () => Promise.resolve()
  },
  actions: {
    badAction: {
      title: 'Bad Action',
      description: 'Has invalid object default.',
      fields: {
        items: {
          label: 'Items',
          description: 'An object field with an array default.',
          type: 'object',
          multiple: false,
          default: { '@arrayPath': ['$.properties.items', { id: { '@path': '$.id' } }] }
        }
      },
      perform: () => undefined
    }
  }
} as unknown as DestinationDefinition

// ---------------------------------------------------------------------------
// generateDestinationPayload — top-level shape
// ---------------------------------------------------------------------------

describe('generateDestinationPayload() — top-level shape', () => {
  it('returns all required top-level keys', () => {
    const payload = generateDestinationPayload('test-basic', basicAuthDefinition)
    expect(payload).toMatchObject({
      name: 'Test Basic Destination',
      description: 'A test destination',
      authenticationScheme: 'basic',
      supportedRegions: ['us-west-2', 'eu-west-1'],
      supportsAudiences: false
    })
    expect(Array.isArray(payload.basicOptions)).toBe(true)
    expect(typeof payload.options).toBe('object')
    expect(Array.isArray(payload.actions)).toBe(true)
    expect(Array.isArray(payload.presets)).toBe(true)
  })

  it('excludes oauth from basicOptions but includes it in options', () => {
    const oauthDef = {
      ...basicAuthDefinition,
      authentication: {
        scheme: 'oauth2',
        fields: {
          clientId: {
            label: 'Client ID',
            description: 'OAuth client ID.',
            type: 'string',
            required: true
          }
        },
        testAuthentication: () => Promise.resolve()
      }
    } as unknown as DestinationDefinition
    const payload = generateDestinationPayload('test-oauth', oauthDef)
    expect(payload.basicOptions).not.toContain('oauth')
    expect(payload.options).toHaveProperty('oauth')
  })

  it('returns empty presets array when definition has none', () => {
    const payload = generateDestinationPayload('test-basic', basicAuthDefinition)
    expect(payload.presets).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// generateDestinationPayload — platforms
// ---------------------------------------------------------------------------

describe('generateDestinationPayload() — platforms', () => {
  it('sets browser=true and server=true for a cloud action', () => {
    const { platforms } = generateDestinationPayload('test-basic', basicAuthDefinition)
    expect(platforms).toMatchObject({ browser: true, server: true, mobile: false, warehouse: false })
  })

  it('sets browser=true and server=false for a web-platform action', () => {
    const { platforms } = generateDestinationPayload('test-browser', browserActionDefinition)
    expect(platforms.browser).toBe(true)
    expect(platforms.server).toBe(false)
  })

  it('sets warehouse=true and browser/server=false for actions-segment slug', () => {
    const { platforms } = generateDestinationPayload('actions-segment', basicAuthDefinition)
    expect(platforms).toMatchObject({ warehouse: true, browser: false, server: false })
  })

  it('sets cloudAppObject=true only for actions-segment-profiles', () => {
    const profiles = generateDestinationPayload('actions-segment-profiles', basicAuthDefinition)
    const other = generateDestinationPayload('test-basic', basicAuthDefinition)
    expect(profiles.platforms.cloudAppObject).toBe(true)
    expect(other.platforms.cloudAppObject).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// generateDestinationPayload — options / validators
// ---------------------------------------------------------------------------

describe('generateDestinationPayload() — options validators', () => {
  it('adds required validator for auth fields with required === true', () => {
    const { options } = generateDestinationPayload('test-basic', basicAuthDefinition)
    expect(options['apiKey'].validators).toContainEqual(['required', 'The apiKey property is required.'])
  })

  it('does NOT add required validator for auth fields with required === false', () => {
    const { options } = generateDestinationPayload('test-basic', basicAuthDefinition)
    const hasRequired = options['region'].validators?.some((v: string[]) => v[0] === 'required')
    expect(hasRequired).toBe(false)
  })

  it('adds conditional validator for conditionally-required fields', () => {
    const { options } = generateDestinationPayload('test-cond', conditionalRequiredDefinition)
    const hasConditional = options['conditionalField'].validators?.some((v: string[]) => v[0] === 'conditional')
    expect(hasConditional).toBe(true)
  })

  it('does NOT add required validator for conditionally-required fields', () => {
    const { options } = generateDestinationPayload('test-cond', conditionalRequiredDefinition)
    const hasRequired = options['conditionalField'].validators?.some((v: string[]) => v[0] === 'required')
    expect(hasRequired).toBe(false)
  })

  it('adds required validator for the always-required field in the same definition', () => {
    const { options } = generateDestinationPayload('test-cond', conditionalRequiredDefinition)
    expect(options['alwaysRequired'].validators).toContainEqual([
      'required',
      'The alwaysRequired property is required.'
    ])
  })

  it('marks auth fields private and tags them with authentication:test', () => {
    const { options } = generateDestinationPayload('test-basic', basicAuthDefinition)
    expect(options['apiKey'].private).toBe(true)
    expect(options['apiKey'].tags).toContain('authentication:test')
  })

  it('sets encrypt=true for password-type fields', () => {
    const { options } = generateDestinationPayload('test-multi', multiActionDefinition)
    expect(options['token'].encrypt).toBe(true)
  })

  it('injects required_hidden_token fallback when definition has no settings', () => {
    const noSettingsDef = {
      name: 'No Settings',
      mode: 'cloud',
      actions: {
        act: { title: 'Act', description: 'Acts.', fields: {}, perform: () => undefined }
      }
    } as unknown as DestinationDefinition
    const { options, basicOptions } = generateDestinationPayload('no-settings', noSettingsDef)
    expect(options).toHaveProperty('required_hidden_token')
    expect(basicOptions).toContain('required_hidden_token')
  })
})

// ---------------------------------------------------------------------------
// generateDestinationPayload — actions
// ---------------------------------------------------------------------------

describe('generateDestinationPayload() — actions', () => {
  it('maps action slug/name/description/defaultTrigger/platform correctly', () => {
    const { actions } = generateDestinationPayload('test-basic', basicAuthDefinition)
    expect(actions).toHaveLength(1)
    expect(actions[0]).toMatchObject({
      slug: 'trackEvent',
      name: 'Track Event',
      description: 'Send a track event.',
      defaultTrigger: 'type = "track"',
      platform: 'cloud',
      hidden: false
    })
  })

  it('sorts actions alphabetically by name', () => {
    const { actions } = generateDestinationPayload('test-multi', multiActionDefinition)
    expect(actions[0].name).toBe('Apple Action')
    expect(actions[1].name).toBe('Zebra Action')
  })

  it('defaults defaultTrigger to null when action has no defaultSubscription', () => {
    const { actions } = generateDestinationPayload('test-multi', multiActionDefinition)
    expect(actions[0].defaultTrigger).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// generateDestinationPayload — action fields
// ---------------------------------------------------------------------------

describe('generateDestinationPayload() — action fields', () => {
  it('maps action fields with correct shape', () => {
    const { actions } = generateDestinationPayload('test-basic', basicAuthDefinition)
    const userIdField = actions[0].fields.find((f) => f.fieldKey === 'userId')
    expect(userIdField).toMatchObject({
      fieldKey: 'userId',
      label: 'User ID',
      type: 'string',
      required: true,
      defaultValue: { '@path': '$.userId' }
    })
  })

  it('sets required=false for action fields without required: true', () => {
    const { actions } = generateDestinationPayload('test-basic', basicAuthDefinition)
    const eventNameField = actions[0].fields.find((f) => f.fieldKey === 'eventName')
    expect(eventNameField?.required).toBe(false)
  })

  it('throws for an object field with non-multiple @arrayPath default', () => {
    expect(() => generateDestinationPayload('bad-slug', badArrayPathDefinition)).toThrow(
      'The field key "items" is an object field with an incompatible default value.'
    )
  })

  it('auto-injects enable_batching when performBatch is defined and not declared', () => {
    const batchDef = {
      name: 'Batch Dest',
      mode: 'cloud',
      actions: {
        batchAction: {
          title: 'Batch Action',
          description: 'A batch action.',
          fields: {},
          perform: () => undefined,
          performBatch: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    const { actions } = generateDestinationPayload('batch-dest', batchDef)
    const batchField = actions[0].fields.find((f) => f.fieldKey === 'enable_batching')
    expect(batchField).toBeDefined()
    expect(batchField?.type).toBe('boolean')
    expect(batchField?.defaultValue).toBe(false)
  })

  it('does NOT duplicate enable_batching when already declared on the action', () => {
    const batchDef = {
      name: 'Batch Dest With Field',
      mode: 'cloud',
      actions: {
        batchAction: {
          title: 'Batch Action',
          description: 'A batch action.',
          fields: {
            enable_batching: {
              label: 'Enable Batching?',
              description: 'Custom batching field.',
              type: 'boolean',
              default: true
            }
          },
          perform: () => undefined,
          performBatch: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    const { actions } = generateDestinationPayload('batch-with-field', batchDef)
    expect(actions[0].fields.filter((f) => f.fieldKey === 'enable_batching')).toHaveLength(1)
  })

  it('appends hashing notice to hashedPII field descriptions', () => {
    const hashedDef = {
      name: 'Hashed Dest',
      mode: 'cloud',
      actions: {
        hashAction: {
          title: 'Hash Action',
          description: 'Hashes PII.',
          fields: {
            email: {
              label: 'Email',
              description: 'The user email',
              type: 'string',
              category: 'hashedPII'
            }
          },
          perform: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    const { actions } = generateDestinationPayload('hashed-dest', hashedDef)
    const emailField = actions[0].fields.find((f) => f.fieldKey === 'email')
    expect(emailField?.description).toContain('If not hashed, Segment will hash this value.')
  })

  it('maps string choices to { label, value } objects', () => {
    const choicesDef = {
      name: 'Choices Dest',
      mode: 'cloud',
      actions: {
        choiceAction: {
          title: 'Choice Action',
          description: 'Has choices.',
          fields: {
            mode: { label: 'Mode', description: 'Select mode.', type: 'string', choices: ['fast', 'slow'] }
          },
          perform: () => undefined
        }
      }
    } as unknown as DestinationDefinition
    const { actions } = generateDestinationPayload('choices-dest', choicesDef)
    const modeField = actions[0].fields.find((f) => f.fieldKey === 'mode')
    expect(modeField?.choices).toEqual([
      { label: 'fast', value: 'fast' },
      { label: 'slow', value: 'slow' }
    ])
  })
})

// ---------------------------------------------------------------------------
// generateDestinationPayload — presets
// ---------------------------------------------------------------------------

describe('generateDestinationPayload() — presets', () => {
  it('sorts presets alphabetically by name', () => {
    const presetDef = {
      ...basicAuthDefinition,
      presets: [
        { partnerAction: 'trackEvent', name: 'Zebra Preset', subscribe: 'type = "track"', mapping: {} },
        { partnerAction: 'trackEvent', name: 'Apple Preset', subscribe: 'type = "identify"', mapping: {} }
      ]
    } as unknown as DestinationDefinition
    const { presets } = generateDestinationPayload('test-presets', presetDef)
    expect((presets[0] as any).name).toBe('Apple Preset')
    expect((presets[1] as any).name).toBe('Zebra Preset')
  })

  it('normalizes undefined preset mapping to empty object', () => {
    const presetDef = {
      ...basicAuthDefinition,
      presets: [{ partnerAction: 'trackEvent', name: 'No Mapping Preset', subscribe: 'type = "track"' }]
    } as unknown as DestinationDefinition
    const { presets } = generateDestinationPayload('test-presets', presetDef)
    expect((presets[0] as any).mapping).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// generateDestinationPayload — supportsAudiences
// ---------------------------------------------------------------------------

describe('generateDestinationPayload() — supportsAudiences', () => {
  it('is false when no audienceConfig is present', () => {
    expect(generateDestinationPayload('test-basic', basicAuthDefinition).supportsAudiences).toBe(false)
  })

  it('is true for actions-liveramp-audiences regardless of audienceConfig', () => {
    expect(generateDestinationPayload('actions-liveramp-audiences', basicAuthDefinition).supportsAudiences).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// resolveSourceDir
// ---------------------------------------------------------------------------

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

  it('returns null for an unrecognized path pattern', () => {
    expect(resolveSourceDir('/some/random/path/index.js')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(resolveSourceDir('')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Command end-to-end
// ---------------------------------------------------------------------------

describe('GenerateMetadataPayload command', () => {
  const mockGetManifest = getManifest as jest.MockedFunction<typeof getManifest>
  const mockWriteJson = fs.writeJson as jest.MockedFunction<typeof fs.writeJson>

  const validEntry = {
    path: '/repo/packages/destination-actions/dist/destinations/test-dest/index.js',
    definition: basicAuthDefinition
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockWriteJson.mockResolvedValue(undefined as never)
  })

  it('writes metadata.json to the resolved source dir', async () => {
    mockGetManifest.mockReturnValue({ 'meta-1': validEntry as any })
    await GenerateMetadataPayload.run([])
    expect(mockWriteJson).toHaveBeenCalledWith(
      '/repo/packages/destination-actions/src/destinations/test-dest/metadata.json',
      expect.objectContaining({ name: 'Test Basic Destination', authenticationScheme: 'basic' }),
      { spaces: 2 }
    )
  })

  it('skips entries where resolveSourceDir returns null', async () => {
    mockGetManifest.mockReturnValue({
      'meta-bad': { path: '/some/unrecognizable/path/index.js', definition: basicAuthDefinition } as any
    })
    await GenerateMetadataPayload.run([])
    expect(mockWriteJson).not.toHaveBeenCalled()
  })

  it('processes all entries when no --slug flag is passed', async () => {
    mockGetManifest.mockReturnValue({
      'meta-1': validEntry as any,
      'meta-2': {
        path: '/repo/packages/destination-actions/dist/destinations/second-dest/index.js',
        definition: { ...basicAuthDefinition, name: 'Second Dest' }
      } as any
    })
    await GenerateMetadataPayload.run([])
    expect(mockWriteJson).toHaveBeenCalledTimes(2)
  })

  it('filters to only the matching slug when --slug is passed', async () => {
    mockGetManifest.mockReturnValue({
      'meta-alpha': {
        path: '/repo/packages/destination-actions/dist/destinations/alpha-dest/index.js',
        definition: { ...basicAuthDefinition, slug: 'alpha-dest' }
      } as any,
      'meta-beta': {
        path: '/repo/packages/destination-actions/dist/destinations/beta-dest/index.js',
        definition: { ...basicAuthDefinition, slug: 'beta-dest', name: 'Beta Dest' }
      } as any
    })
    await GenerateMetadataPayload.run(['--slug=alpha-dest'])
    expect(mockWriteJson).toHaveBeenCalledTimes(1)
    expect(mockWriteJson).toHaveBeenCalledWith(
      '/repo/packages/destination-actions/src/destinations/alpha-dest/metadata.json',
      expect.any(Object),
      { spaces: 2 }
    )
  })

  it('accepts multiple --slug values', async () => {
    const makeEntry = (slug: string, name: string) => ({
      path: `/repo/packages/destination-actions/dist/destinations/${slug}/index.js`,
      definition: { ...basicAuthDefinition, slug, name }
    })
    mockGetManifest.mockReturnValue({
      'meta-alpha': makeEntry('alpha-dest', 'Alpha') as any,
      'meta-beta': makeEntry('beta-dest', 'Beta') as any,
      'meta-gamma': makeEntry('gamma-dest', 'Gamma') as any
    })
    await GenerateMetadataPayload.run(['--slug=alpha-dest', '--slug=beta-dest'])
    expect(mockWriteJson).toHaveBeenCalledTimes(2)
  })

  it('continues processing remaining entries when one fails', async () => {
    mockGetManifest.mockReturnValue({
      'meta-bad': {
        path: '/repo/packages/destination-actions/dist/destinations/bad-dest/index.js',
        definition: { ...badArrayPathDefinition, slug: 'bad-dest' }
      } as any,
      'meta-good': {
        path: '/repo/packages/destination-actions/dist/destinations/good-dest/index.js',
        definition: { ...basicAuthDefinition, slug: 'good-dest' }
      } as any
    })
    await expect(GenerateMetadataPayload.run([])).resolves.not.toThrow()
    expect(mockWriteJson).toHaveBeenCalledTimes(1)
    expect(mockWriteJson).toHaveBeenCalledWith(
      '/repo/packages/destination-actions/src/destinations/good-dest/metadata.json',
      expect.any(Object),
      { spaces: 2 }
    )
  })
})
