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
      id: 'quickstart',
    },
    {
      type: 'doc',
      id: 'examples',
      label: 'Examples',
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
      type: 'doc',
      label: '@ts-rest/react-query',
      id: 'react-query',
    },
    {
      type: 'doc',
      label: '@ts-rest/nest',
      id: 'nest',
    },
    {
      type: 'doc',
      label: '@ts-rest/express',
      id: 'express',
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
