import { config } from './config'
import { startDestinationServer } from './destination-server'

void startDestinationServer(config.destinationTestServerPort).catch(console.error)
