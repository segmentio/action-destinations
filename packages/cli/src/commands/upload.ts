import { Command, flags } from '@oclif/command'
import { readFileSync } from 'fs'
import * as path from 'path'
import Build from './build'
import { loadDestination } from '../lib/destinations'
import ora from 'ora'
import fetch from 'node-fetch'

export default class Upload extends Command {
  private spinner: ora.Ora = ora()

  static description = 'build, package, and upload a Segment app version'
  // TODO versions haha
  // Versioning should be easy. You can upload
  // as many versions as you want but nothing happens until you promote
  // that version ID.
  // Builders can list versions, target them, delete them etc.
  // Example: treb, Lambda, Heroku?

  static examples = [`$ ./bin/run app:version`]

  static flags = {
    help: flags.help({ char: 'h' }),
    dir: flags.string({
      char: 'd',
      description: 'directory of the app',
      default: './'
    })
  }

  async run() {
    const {
      flags: { dir }
    } = this.parse(Build)
    await Build.run(['-d', dir])

    this.spinner.start(`loading destination at ${dir}`)
    const destination = await loadDestination(dir)
    if (!destination) {
      this.spinner.fail()
      throw new Error(`no destination definition resolved at ${dir}`)
    }
    if (!destination.slug) {
      // TODO DRY
      this.spinner.fail()
      throw new Error(`no slug defined for ${destination.name}}`)
    }
    if (!destination.version) {
      this.spinner.fail()
      throw new Error(`no version defined for ${destination.name}}`)
    }
    this.spinner.stop()

    const { slug, version } = destination
    6
    // TODO verify ${flags.dir}/.segment/main.js exists
    const app = path.resolve(dir, '.segment', 'dist', slug, version, 'app.js')
    const core = path.resolve(dir, '.segment', 'dist', slug, version, 'core.js')

    // Fetch s3 upload URLs.
    // TODO Use the public API.
    const res = await fetch('http://integration-isolates.segment.local/upload', {
      method: 'post',
      body: JSON.stringify({
        version,
        destinationSlug: slug
      }),
      headers: {'Content-Type': 'application/json'}
    })
    const uploadUrls = await res.json()
    console.log(uploadUrls)

    await fetch(uploadUrls.app, {
      method: 'put',
      body: readFileSync(app),
      headers: { 'Content-Type': 'application/javascript' }
    })
    await fetch(uploadUrls.core, {
      method: 'put',
      body: readFileSync(core),
      headers: { 'Content-Type': 'application/javascript' }
    })

    /**
     * Now that the function bundles are uploaded, we need to push metadata using
     * a copy of the action-destinations push command.
     *
     * How does this play out with multiple versions.
     *  - table: destination_definition_versions
     *          destination_definition_id, id, manifest (string)
     * - destination_definition_actions include a version_id column
     * - destination_definition includes a version_id which is the default version
     * - destination_config.version_id is the version that the instance was config'd with
     *  - ctlstore_destination_action_metadata includes perform config (http, function, etc.)
     * - ctlstore_destination_action_settings includes version_id
     *
     * The tables above should be enough to construct a GX plan.
     */
  }
}
