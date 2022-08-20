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
      type: 'doc',
      id: 'intro',
    },
    {
      type: 'doc',
      id: 'feature-support',
    },
    {
      type: 'category',
      label: '@ts-rest/core',
      collapsed: false,
      items: [
        { type: 'doc', id: 'core/core' },
        { type: 'doc', id: 'core/fetch' },
        { type: 'doc', id: 'core/errors' },
      ],
    },
    {
      type: 'category',
      label: '@ts-rest/react-query',
      collapsed: false,
      items: [{ type: 'doc', id: 'react-query/react-query' }],
    },
    {
      type: 'category',
      label: '@ts-rest/nest',
      collapsed: false,
      items: [
        { type: 'doc', id: 'nest/nest' },
        { type: 'doc', id: 'nest/error' },
        { type: 'doc', id: 'nest/zod' },
      ],
    },
    {
      type: 'doc',
      id: 'ts-rest-express',
    },
    {
      type: 'category',
      label: 'Comparisons',
      collapsed: false,
      items: [
        {
          type: 'doc',
          id: 'comparisons/rpc-comparison',
        },
      ],
    },
  ],
};

module.exports = sidebars;
