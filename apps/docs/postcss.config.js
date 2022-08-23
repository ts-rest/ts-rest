module.exports = {
  plugins: {
    tailwindcss: {
      content: ['apps/docs/src/**/*.{js,jsx,ts,tsx}'],
      theme: {
        extend: {},
      },
      plugins: [],
      corePlugins: {
        preflight: false,
      },
      darkMode: ['class', '[data-theme="dark"]'],
    },
    autoprefixer: {},
  },
};
