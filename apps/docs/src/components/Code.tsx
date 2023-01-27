import CodeBlock from '@theme/CodeBlock';
import React from 'react';

const sections = [
  {
    title: 'client.ts',
    code: `import { initClient } from '@ts-rest/core';
import { contract } from './contract';

const client = initClient(contract, {
  baseUrl: 'http://localhost:3000',
  baseHeaders: {},
});

const response = await client.updatePost({
  params: {
    postId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  },
  body: {
    title: 'Post Title',
    content: 'Post Body',
  },
});`,
  },
  {
    title: 'contract.ts',
    code: `import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();
export const contract = c.router({
  updatePost: {
    method: 'PUT',
    path: '/posts/:postId',
    summary: 'Update a post',
    pathParams: z.object({
      postId: z.string().length(32),
    }),
    body: z.object({
      title: z.string().optional(),
      content: z.string().optional(),
    }),
    responses: {
      200: z.object({
        id: z.string().length(32),
        title: z.string(),
        content: z.string(),
      }),
      404: z.object({
        message: z.string()
      })
    },
  },
});`,
  },
  {
    title: 'server.ts',
    code: `import { createExpressEndpoints, initServer } from '@ts-rest/express';
import { contract } from './contract';

const app = express();
const prisma = new PrismaClient();

const s = initServer();
const router = s.router(contract, {
  updatePost: async ({ body, params: { postId } }) => {
    const post = await prisma.post.update({
      where: { id: postId },
      data: body,
    });

    return {
      status: 200,
      body: {
        ...post,
      },
    };
  },
});

createExpressEndpoints(contract, router, app);`,
  },
];

export const Code = () => {
  return (
    <div className="container mx-auto header-code-blocks text-left grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-2">
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
