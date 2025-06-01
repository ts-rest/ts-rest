import React from 'react';
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

export const InstallTabs = ({ packageName }: { packageName: string }) => {
  return (
    <Tabs items={['pnpm', 'bun', 'npm']} groupId="install" persist>
      <Tab value="pnpm" title="pnpm">
        <DynamicCodeBlock lang="bash" code={`pnpm add ${packageName}`} />
      </Tab>
      <Tab value="bun" title="bun">
        <DynamicCodeBlock lang="bash" code={`bun add ${packageName}`} />
      </Tab>
      <Tab value="npm" title="npm">
        <DynamicCodeBlock lang="bash" code={`npm install ${packageName}`} />
      </Tab>
    </Tabs>
  );
};
