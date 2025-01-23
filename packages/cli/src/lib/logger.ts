import { Logger } from 'ecs-logs-js'

const logger = new Logger({
  level: (process.env.LOG_LEVEL as Logger['level']) || 'debug',
  devMode: true
})

export default logger
