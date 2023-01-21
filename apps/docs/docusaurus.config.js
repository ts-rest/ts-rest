const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'ts-rest',
  tagline: 'Incrementally adoptable type-safety for your new and existing APIs',
  url: 'https://ts-rest.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'ts-rest', // Usually your GitHub org/user name.
  projectName: 'ts-rest', // Usually your repo name.
  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        entryPoints: [
          './libs/ts-rest/core',
          './libs/ts-rest/express',
          './libs/ts-rest/nest',
          './libs/ts-rest/next',
          './libs/ts-rest/open-api',
          './libs/ts-rest/react-query',
          './libs/ts-rest/solid-query',
        ],
        entryPointStrategy: 'packages',
        sidebar: {
          fullNames: true,
        },
      },
    ],
  ],
  scripts: [
    {
      defer: true,
      'data-domain': 'ts-rest.com',
      'data-api': 'https://plausible.oliverbutler.uk/api/event',
      src: 'https://plausible.oliverbutler.uk/js/script.js',
    },
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/ts-rest/ts-rest',
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/ts-rest/ts-rest',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      algolia: {
        appId: '2TFBRG9081',
        apiKey: '2f0471d89771f7e3cd3796164c0a6f09',
        indexName: 'ts-rest',
      },
      // announcementBar: {
      //   id: 'support_us',
      //   content:
      //     "We're making some big changes to our docs, please give us a ⭐️ and help out by <a target='_blank' rel='noopener noreferrer' href='https://github.com/ts-rest/ts-rest'>contributing</a>!",
      //   backgroundColor: '#007667',
      //   textColor: '#ffffff',
      //   isCloseable: false,
      // },
      colorMode: {
        respectPrefersColorScheme: true,
      },
      metadata: [
        {
          name: 'keywords',
          content: 'ts-rest, ts rest, typesafe, typescript, API, REST',
        },
      ],
      image: 'img/banner.jpg',
      navbar: {
        logo: {
          alt: 'ts-rest logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'Docs',
          },
          {
            type: 'doc',
            docId: 'quickstart',
            position: 'left',
            label: 'Quickstart',
          },
          {
            type: 'doc',
            docId: 'api/index',
            position: 'left',
            label: 'API Reference',
          },
          {
            href: 'https://github.com/ts-rest/ts-rest',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://www.npmjs.com/package/@ts-rest/core',
            label: 'NPM',
            position: 'right',
          },
          {
            href: 'https://bundlephobia.com/package/@ts-rest/core',
            label: 'Bundlephobia',
            position: 'right',
          },
          {
            href: 'https://discord.com/invite/2Megk85k5a',
            label: 'Discord 🆕',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Introduction',
                to: '/docs/intro',
              },
              {
                label: 'Quickstart',
                to: '/docs/quickstart',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Twitter',
                href: 'https://twitter.com/_oliverbutler',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/ts-rest/ts-rest',
              },
            ],
          },
          {
            title: 'Links',
            items: [
              {
                label: 'NPM @ts-rest/core',
                href: 'https://npmjs.com/package/@ts-rest/core',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} @ts-rest`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
