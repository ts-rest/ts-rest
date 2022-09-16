const { join } = require('path');

module.exports = {
  content: [join(__dirname, 'src/app/**/*.{ts,tsx,html}')],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: require('tailwind-rn/unsupported-core-plugins'),
};
