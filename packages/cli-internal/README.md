# CLI

## Usage

<!-- usage -->

```sh-session
$ ./bin/run COMMAND
running command...

$ ./bin/run (-v|--version|version)
@segment/actions-cli/3.8.2 darwin-x64 node-v14.17.1

$ ./bin/run --help [COMMAND]
USAGE
  $ ./bin/run COMMAND
...
```

<!-- usagestop -->

## Commands

<!-- commands -->

- [`./bin/run generate:action NAME TYPE`](#binrun-generateaction-name-type)
- [`./bin/run generate:types`](#binrun-generatetypes)
- [`./bin/run help [COMMAND]`](#binrun-help-command)
- [`./bin/run init [PATH]`](#binrun-init-path)
- [`./bin/run serve [DESTINATION]`](#binrun-serve-destination)

## `./bin/run generate:action NAME TYPE`

Scaffolds a new integration action.

NOTE: `browser` actions are considered experimental and major breaking changes may be
introduced without warning.

```
USAGE
  $ ./bin/run generate:action NAME TYPE

ARGUMENTS
  NAME  the action name
  TYPE  the type of action (browser, server)

OPTIONS
  -d, --directory=directory  base directory to scaffold the action
  -f, --force
  -h, --help                 show CLI help
  -t, --title=title          the display name of the action

EXAMPLES
  $ ./bin/run generate:action ACTION <browser|server>
  $ ./bin/run generate:action postToChannel server --directory=./destinations/slack
```

_See code: [src/commands/generate/action.ts](https://github.com/segmentio/action-destinations/blob/main/packages/cli/src/commands/generate/action.ts)_

## `./bin/run generate:types`

Generates TypeScript definitions for an integration.

```
USAGE
  $ ./bin/run generate:types

OPTIONS
  -h, --help       show CLI help
  -p, --path=path  file path for the integration(s). Accepts glob patterns.
  -w, --watch      Watch for file changes to regenerate types

EXAMPLES
  $ ./bin/run generate:types
  $ ./bin/run generate:types --path ./packages/*/src/destinations/*/index.ts
```

_See code: [src/commands/generate/types.ts](https://github.com/segmentio/action-destinations/blob/main/packages/cli/src/commands/generate/types.ts)_

## `./bin/run help [COMMAND]`

display help for ./bin/run

```
USAGE
  $ ./bin/run help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.3/src/commands/help.ts)_

## `./bin/run init [PATH]`

Scaffolds a new integration with a template. This does not register or deploy the integration.

```
USAGE
  $ ./bin/run init [PATH]

ARGUMENTS
  PATH  path to scaffold the integration

OPTIONS
  -d, --directory=directory                                    [default:
                                                               ./packages/destination-actions/src/destinations] target
                                                               directory to scaffold the integration

  -h, --help                                                   show CLI help

  -n, --name=name                                              name of the integration

  -s, --slug=slug                                              url-friendly slug of the integration

  -t, --template=(basic-auth|custom-auth|oauth2-auth|minimal)  the template to use to scaffold your integration

EXAMPLES
  $ ./bin/run init my-integration
  $ ./bin/run init my-integration --directory packages/destination-actions --template basic-auth
```

_See code: [src/commands/init.ts](https://github.com/segmentio/action-destinations/blob/main/packages/cli/src/commands/init.ts)_

## `./bin/run serve [DESTINATION]`

Starts a local development server to test your integration.

```
USAGE
  $ ./bin/run serve [DESTINATION]

ARGUMENTS
  DESTINATION  destination to serve

OPTIONS
  -d, --directory=directory  [default: ./packages/destination-actions/src/destinations] destination actions directory
  -h, --help                 show CLI help

EXAMPLES
  $ ./bin/run serve
  $ PORT=3001 ./bin/run serve
  $ ./bin/run serve slack
```

_See code: [src/commands/serve.ts](https://github.com/segmentio/action-destinations/blob/main/packages/cli/src/commands/serve.ts)_

<!-- commandsstop -->

## License

MIT License

Copyright (c) 2021 Segment

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Contributing

All third party contributors acknowledge that any contributions they provide will be made under the same open source license that the open source project is provided under.
