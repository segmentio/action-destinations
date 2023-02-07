import { startServer } from './server'
import { listDestinations, DESTINATIONS_DIST_WEB } from './utils'
import express from 'express'
import path from 'path'

const htmlWithScript = (src: string): string => `
<html>
  <head>
    <script src="${src}" type="text/javascript"></script>
  </head>
  <body>
    Script found: "${src}"
  </body>
</html>
`

export const startDestinationServer = (...args: Parameters<typeof startServer>): ReturnType<typeof startServer> => {
  const destinations = listDestinations()
  return startServer(...args).then(([app, server]) => {
    app.use('/js', express.static(path.join(DESTINATIONS_DIST_WEB)))
    app.get('/', (req, res) => {
      console.log('req!', req.url)
      const { destination } = req.query
      if (!destination) {
        return res.status(400).send('No destination param passed.')
      }
      const foundDestination = destinations.find((d) => d.dirPath === destination)
      if (!foundDestination) {
        return res.status(404).send('Cannot find destination.')
      }
      res.send(htmlWithScript(path.join('js', foundDestination.dirPath, foundDestination.fileName)))
    })
    app.get('/destinations', (_, res) => {
      const dirNames = destinations.map((d) => d.dirPath)
      res.json(dirNames)
    })

    return [app, server]
  })
}
