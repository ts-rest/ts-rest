import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

export const InstallTabs = ({ packageName }: { packageName: string }) => {
  return (
    <Tabs groupId="packageManager">
      <TabItem value="npm" label="npm">
        <CodeBlock language="bash">npm install {packageName}</CodeBlock>
      </TabItem>
      <TabItem value="yarn" label="yarn">
        <CodeBlock language="bash">yarn add {packageName}</CodeBlock>
      </TabItem>
      <TabItem value="pnpm" label="pnpm">
        <CodeBlock language="bash">pnpm add {packageName}</CodeBlock>
      </TabItem>
    </Tabs>
  );
};
