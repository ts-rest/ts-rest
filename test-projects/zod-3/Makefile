.PHONY: setup

# Frustratingly doing normal symlink deps with bun seems to fall apart when running the app
# For the best 1-1 real world E2E test this works great.
#
# It's as if we've published the package, then import it into a fresh bun project
setup:
	bun i
	rm -rf node_modules/@ts-rest/*
	mkdir -p node_modules/@ts-rest
	cp -r ../../dist/libs/ts-rest/* node_modules/@ts-rest/

e2e:
	make setup
	bun test
	bun build index.ts --target bun --outdir ./dist
	bun tsc
