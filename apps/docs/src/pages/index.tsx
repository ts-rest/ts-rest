import React, { useEffect } from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';
import HomepageFeatures from '../components/HomepageFeatures';
import sdk from '@stackblitz/sdk';
import CodeBlock from '@theme/CodeBlock';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

  useEffect(() => {
    sdk.embedProjectId('stack-blitz', 'typescript-pw8hhy', {
      forceEmbedLayout: true,
      openFile: ['client.ts', 'contract.ts'],
      view: 'editor',
      height: '500px',
      hideExplorer: true,
    });
  }, []);

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <div id="stack-blitz" />
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <div className="container my-24 mx-auto text-center">
        <h1 className="text-3xl font-black text-center text-white md:text-5xl">
          RPC-like client and server for a{' '}
          <span className="bg-clip-text text-transparent  bg-gradient-to-r from-emerald-400 to-sky-600">
            magical
          </span>{' '}
          end-to-end-typed experience
        </h1>
        <h3 className="text-gray-400">
          tREST makes creating a fully typed API trivial - giving you more time
          to focus on what matters, your product and your project.
        </h3>
      </div>
      <div className="my-12 header-code-blocks mx-4 text-left grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        <CodeBlock className="w-full" language="jsx" title="client.ts">
          {`const client = initClient(contract, {
  baseUrl: 'http://localhost:3000',
  baseHeaders: {},
});

const { body, status } = await client.createPost({
  body: {
    title: 'Post Title',
    body: 'Post Body',
  },
});`}
        </CodeBlock>
        <CodeBlock
          className="w-full hidden md:block "
          language="jsx"
          title="contract.ts"
        >
          {`
import { initTsRest } from '@ts-rest/core';

const c = initTsRest();

export const contract = c.router({
  createPost: c.mutation({
    method: 'POST',
    path: () => '/posts',
    responses: {
      201: c.response<Post>(),
    },
    body: c.body<{title: string}>()
    summary: 'Create a post',
  }),
});`}
        </CodeBlock>
        <CodeBlock className="w-full" language="jsx" title="server.ts">
          {`const s = initServer();

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

createExpressEndpoints(contract, router, app);`}
        </CodeBlock>
      </div>

      <HomepageFeatures />

      <div className="text-center mb-16 mt-10">
        <h2>Get started and read the Quickstart guide ⚡️</h2>
      </div>
    </Layout>
  );
}
