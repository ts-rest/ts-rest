// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'ts-rest',
  tagline:
    'RPC-like client and server helpers for a magical end to end typed experience',
  url: 'https://ts-rest.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'ts-rest', // Usually your GitHub org/user name.
  projectName: 'ts-rest', // Usually your repo name.
  plugins: [],
  scripts: [
    {
      defer: true,
      'data-domain': 'ts-rest.com',
      'data-api': '/pl-api/api/event',
      src: '/pl-api/js/script.js',
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
      metadata: [{ name: 'keywords', content: 'typescript, API, REST' }],
      image: 'img/banner.jpg',
      navbar: {
        title: 'ts-rest',
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
            href: 'https://github.com/ts-rest/ts-rest',
            label: 'GitHub',
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
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Twitter',
                href: 'https://twitter.com/_oliverbutler',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/ts-rest/ts-rest',
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
