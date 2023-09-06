import { build, defineConfig } from 'tsup';

const config = defineConfig({
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  bundle: true,
  metafile: true,
  entry: ['src'],
  minify: false,
  treeshake: {
    preset: 'smallest',
  },
  splitting: true,
});

export default config;
