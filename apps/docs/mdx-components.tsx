import * as Twoslash from 'fumadocs-twoslash/ui';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';
import { InstallTabs } from './lib/InstallTabs';
import { GithubInfo } from 'fumadocs-ui/components/github-info';
import * as StepsComponents from 'fumadocs-ui/components/steps';
import * as FileComponents from 'fumadocs-ui/components/files';
import { AutoTypeTable } from 'fumadocs-typescript/ui';
import { createGenerator } from 'fumadocs-typescript';

const generator = createGenerator();

// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    InstallTabs,
    ...Twoslash,
    GithubInfo,
    ...StepsComponents,
    ...FileComponents,
    ...components,
    AutoTypeTable: (props) => (
      <AutoTypeTable {...props} generator={generator} />
    ),
  };
}
