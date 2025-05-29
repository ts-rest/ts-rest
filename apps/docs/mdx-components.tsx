import * as Twoslash from 'fumadocs-twoslash/ui';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';
import { InstallTabs } from './lib/InstallTabs';

// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    InstallTabs,
    ...Twoslash,
    ...components,
  };
}
