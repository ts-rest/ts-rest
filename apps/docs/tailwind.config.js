module.exports = {
  content: ['apps/docs/src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: 'var(--ifm-color-primary-dark)',
          darker: 'var(--ifm-color-primary-darker)',
          darkest: 'var(--ifm-color-primary-darkest)',
          DEFAULT: 'var(--ifm-color-primary)',
          light: 'var(--ifm-color-primary-light)',
          lighter: 'var(--ifm-color-primary-lighter)',
          lightest: 'var(--ifm-color-primary-lightest)',
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
  darkMode: ['class', '[data-theme="dark"]'],
};
