import {
  controlPlaneService,
  DestinationMetadata,
  DestinationMetadataAction,
  DestinationMetadataActionCreateInput,
  DestinationMetadataActionsUpdateInput,
  DestinationMetadataUpdateInput,
  DestinationSubscriptionPresetInput,
  RemotePlugin
} from '../lib/control-plane-service'

const NOOP_CONTEXT = {}

export async function getDestinationMetadatas(destinationIds: string[]): Promise<DestinationMetadata[]> {
  const { data, error } = await controlPlaneService.getAllDestinationMetadatas(NOOP_CONTEXT, {
    byIds: destinationIds
  })

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('Could not load metadatas')
  }

  return data.metadatas
}

export async function getDestinationMetadataActions(destinationIds: string[]): Promise<DestinationMetadataAction[]> {
  const { data, error } = await controlPlaneService.getDestinationMetadataActions(NOOP_CONTEXT, {
    metadataIds: destinationIds
  })

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('Could not load actions')
  }

  return data.actions
}

export async function updateDestinationMetadata(
  destinationId: string,
  input: DestinationMetadataUpdateInput
): Promise<DestinationMetadata> {
  const { data, error } = await controlPlaneService.updateDestinationMetadata(NOOP_CONTEXT, {
    destinationId,
    input
  })

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('Could not update metadata')
  }

  return data.metadata
}

export async function setSubscriptionPresets(metadataId: string, presets: DestinationSubscriptionPresetInput[]) {
  const { data, error } = await controlPlaneService.setDestinationSubscriptionPresets(NOOP_CONTEXT, {
    metadataId,
    presets
  })

  if (error) {
    console.log(error)
    throw error
  }

  if (!data) {
    throw new Error('Could not set subscription presets')
  }

  return data.presets
}

export async function createDestinationMetadataActions(
  input: DestinationMetadataActionCreateInput[]
): Promise<DestinationMetadataAction[]> {
  if (!input.length) return []

  const { data, error } = await controlPlaneService.createDestinationMetadataActions(NOOP_CONTEXT, {
    input
  })

  if (error) {
    console.log(error)
    throw error
  }

  if (!data) {
    throw new Error('Could not create metadata actions')
  }

  return data.actions
}

export async function updateDestinationMetadataActions(
  input: DestinationMetadataActionsUpdateInput[]
): Promise<DestinationMetadataAction[]> {
  if (!input.length) return []

  const { data, error } = await controlPlaneService.updateDestinationMetadataActions(NOOP_CONTEXT, {
    input
  })

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('Could not update metadata actions')
  }

  return data.actions
}

export async function getRemotePluginByDestinationIds(metadataIds: string[]): Promise<RemotePlugin[]> {
  const { data, error } = await controlPlaneService.getRemotePluginsByDestinationMetadataIds(NOOP_CONTEXT, {
    metadataIds
  })

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('could not load remote plugins')
  }

  return data.remotePlugins
}

export async function updateRemotePlugin(plugin: RemotePlugin): Promise<RemotePlugin> {
  const { data, error } = await controlPlaneService.updateRemotePlugin(NOOP_CONTEXT, {
    metadataId: plugin.metadataId,
    name: plugin.name,
    input: {
      url: plugin.url,
      libraryName: plugin.libraryName
    }
  })

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('could not update remote plugin')
  }

  return data.remotePlugin
}

export async function createRemotePlugin(plugin: RemotePlugin): Promise<RemotePlugin> {
  const { data, error } = await controlPlaneService.createRemotePlugin(NOOP_CONTEXT, {
    input: plugin
  })

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('could not create remote plugin')
  }

  return data.remotePlugin
}
