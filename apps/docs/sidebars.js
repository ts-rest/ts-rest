/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  sidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        {
          type: 'doc',
          id: 'intro',
        },
        {
          type: 'doc',
          id: 'comparisons/rpc-comparison',
        },
        {
          type: 'doc',
          id: 'comparisons/graphql-comparison',
        },
      ],
    },
    {
      type: 'doc',
      id: 'ts-rest-core',
    },
    {
      type: 'doc',
      id: 'ts-rest-react-query',
    },
    {
      type: 'doc',
      id: 'ts-rest-nest',
    },
    {
      type: 'doc',
      id: 'ts-rest-express',
    },
  ],
};

module.exports = sidebars;
