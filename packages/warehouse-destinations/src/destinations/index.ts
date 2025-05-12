import { globby } from 'globby'
import path from 'path'
import type { WarehouseDestinationDefinition } from '@segment/actions-core'

/**
 * We do not need to register warehouse desitnations and return a manifest because the warehouse destination package is
 * exclusively used by the CLI to push warehouse destination definitions to the Segment platform.
 */

// Gets all the destination definitions from the warehouse destinations directory
// Used by the CLI to push the destination definitions
export const getDefinitions = async (dirPath: string) => {
  const destPath = path.join(dirPath, 'src/destinations/*')
  const warehouseDestDirs = await globby(destPath, {
    expandDirectories: false,
    onlyDirectories: true,
    gitignore: false,
    ignore: ['node_modules']
  })

  const definitions = warehouseDestDirs.map((dir) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const destination: WarehouseDestinationDefinition<any> = require(dir).default
    return destination
  })

  return definitions
}
