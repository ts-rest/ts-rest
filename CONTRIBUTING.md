# Contributing

ts-rest is no longer maintained or accepting upstream contributions. Independent forks are welcome under the [MIT licence](LICENCE), including forks of individual adapters. See the [maintenance notice](README.md#maintenance-status).

The development guidance below is retained as a reference for forks.

## Development workflow

```bash
git clone git@github.com:ts-rest/ts-rest.git
cd ts-rest
pnpm install
```

### Get it running

```bash
# in project root directory
pnpm nx run-many --target=serve --all --parallel=10
```

This will start all of the example apps and the documentation in one single place, helping you get started! Feel free to run a reduced subset of the apps if you want to.

### Testing

```bash
pnpm nx affected:test
```

NX will run all of the tests for the affected apps, helping you save some time

### Linting

```bash
pnpm nx affected:lint
```

## Documentation

The documentation is built using [Docusaurus](https://docusaurus.io/). You can find the source code in the `docs` directory.

```
pnpm nx run docs:serve
```

Note, when you run this command the TypeDocs (in the `docs/api` directory) will be generated automatically!
