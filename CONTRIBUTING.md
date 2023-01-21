# Contributing

Thanks for wanting to contribute to the project! Below is some guidance for helping you get started.

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
