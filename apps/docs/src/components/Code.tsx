import React from 'react';
import CodeBlock from '@theme/CodeBlock';

const sections = [
  {
    title: 'client.ts',
    code: `
const client = initClient(contract, {
  baseUrl: 'http://localhost:3000',
  baseHeaders: {},
});
      
const { body, status } = await client.createPost({
  body: {
    title: 'Post Title',
    body: 'Post Body',
  },
});`,
  },
  {
    title: 'contract.ts',
    code: `
import { initContract } from '@ts-rest/core';
    
const c = initContract();
    
export const contract = c.router({
  createPost: {
    method: 'POST',
    path: '/posts',
    responses: {
     201: c.response<Post>(),
    },
    body: c.body<{title: string}>()
    summary: 'Create a post',
  },
});`,
  },
  {
    title: 'server.ts',
    code: `
const s = initServer();

const router = s.router(contract, {
  createPost: async ({ body }) => {
    const post = await prisma.post.create({
      data: body,
    });
    
    return {
      status: 201,
      body: post,
    };
  },  
});
    
createExpressEndpoints(contract, router, app);`,
  },
];

export const Code = () => {
  return (
    <div className="container mx-auto my-12 header-code-blocks text-left grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
      <CodeBlock className="w-full" language="jsx" title="client.ts">
        {sections[0].code}
      </CodeBlock>
      <CodeBlock
        className="w-full hidden md:block "
        language="jsx"
        title="contract.ts"
      >
        {sections[1].code}
      </CodeBlock>
      <CodeBlock className="w-full" language="jsx" title="server.ts">
        {sections[2].code}
      </CodeBlock>
    </div>
  );
};
