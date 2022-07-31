# Contributing

Thanks for wanting to contribute to the project! Below is some guidance for helping you get started.

## Development workflow

```bash
git clone git@github.com:ts-rest/ts-rest.git
cd ts-rest
yarn
```

### Get it running

```bash
# in project root directory
yarn nx run-many --target=serve --all --parallel=10
```

This will start all of the example apps and the documentation in one single place, helping you get started! Feel free to run a reduced subset of the apps if you want to.

### Testing

```bash
yarn nx affected:test
```

NX will run all of the tests for the affected apps, helping you save some time

### Linting

```bash
yarn nx affected:lint
```
