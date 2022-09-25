import React, { useEffect } from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';
import HomepageFeatures from '../components/HomepageFeatures';
import sdk from '@stackblitz/sdk';
import { Code } from '../components/Code';

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
  return (
    <Layout
      title={`ts-rest 🪄`}
      description="RPC-like client and server helpers for a magical end to end typed experience"
    >
      <div className="container my-24 mx-auto text-center">
        <h1 className="text-3xl font-dark text-center dark:text-white md:text-5xl">
          RPC-like client and server for a{' '}
          <span className="bg-clip-text text-transparent  bg-gradient-to-r from-emerald-400 to-sky-500 ">
            magical
          </span>{' '}
          end-to-end-typed experience
        </h1>
        <h3 className="dark:text-gray-300 text-gray-500">
          ts-rest makes creating a fully typed API trivial - giving you more
          time to focus on what matters, your product and your project.
        </h3>
      </div>

      <Code />

      <HomepageFeatures />

      <div className="my-10 container mx-auto">
        <div className=" bg-sky-100/40 dark:bg-sky-600/10 p-5 border-solid border-0 border-l-4 border-sky-400 dark:border-sky-700">
          <h3>What is this?</h3>

          <p>
            ts-rest was initially designed for TS-first teams, in legacy
            codebases, who are working towards improving stability and safety -
            who may have limited resources to migrate to a new solution/tech
            (such as GraphQL), and need a simple, safe API with a focus on DX
            and adoption speed.
          </p>

          <ul>
            <li>
              A tiny type-safe wrapper around existing, battle-tested,
              established tech
            </li>
            <li>
              An incrementally adoptable tool, for TS-first teams who care about
              stability + safety
            </li>
            <li>
              No opinionated API structure, should be compatible with your
              existing structures
            </li>
          </ul>
        </div>
      </div>

      <div className="container my-32">
        <div className="relative w-fit h-fit mx-auto">
          <a href="https://ts-rest.com/docs/quickstart" target="_blank">
            <button
              className="transition-all text-gray-900 bg-emerald-400 cursor-pointer hover:bg-emerald-600 
          p-4 rounded-xl appearance-none border-none text-2xl font-bold"
            >
              QuickStart Guide
            </button>
          </a>
          <svg
            className="w-72 absolute -top-24 sm:-top-20 -right-14 sm:-right-64"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 303.17149471939274 56.38510076466241"
            width="606.3429894387855"
            height="112.77020152932482"
            fill="transparent"
          >
            <rect
              x="0"
              y="0"
              width="303.17149471939274"
              height="56.38510076466241"
            ></rect>
            <g transform="translate(62.17149471939274 21.38510076466241) rotate(0 115.5 12.5)">
              <text
                x="0"
                y="18"
                font-family="Virgil, Segoe UI Emoji"
                font-size="20px"
                className="fill-black dark:fill-white"
                text-anchor="start"
                style={{ whiteSpace: 'pre' }}
                direction="ltr"
              >
                Ready to get started?
              </text>
            </g>
            <g
              stroke-linecap="round"
              className="stroke-black dark:stroke-white"
            >
              <g transform="translate(82.71890367256765 16.015779965927095) rotate(0 -36.03366031957012 2.9325428898146697)">
                <path
                  d="M0.65 0.56 C-3.95 -0.28, -16.61 -7.42, -28.72 -5.77 C-40.82 -4.11, -64.76 7.75, -71.98 10.49 M-0.47 -0.18 C-5.15 -0.83, -17.77 -6.6, -29.81 -4.59 C-41.85 -2.58, -65.72 9.13, -72.72 11.88"
                  stroke-width="1"
                  fill="none"
                ></path>
              </g>
              <g transform="translate(82.71890367256765 16.015779965927095) rotate(0 -36.03366031957012 2.9325428898146697)">
                <path
                  d="M-55.02 -4.5 C-60.67 -0.56, -62.76 2.65, -72.23 12.81 M-56.68 -3.44 C-61.08 1, -65.9 5.12, -73.45 12.19"
                  stroke-width="1"
                  fill="none"
                ></path>
              </g>
              <g transform="translate(82.71890367256765 16.015779965927095) rotate(0 -36.03366031957012 2.9325428898146697)">
                <path
                  d="M-48.7 10 C-55.58 10.96, -58.98 11.17, -72.23 12.81 M-50.37 11.06 C-56.69 11.15, -63.4 10.95, -73.45 12.19"
                  stroke-width="1"
                  fill="none"
                ></path>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </Layout>
  );
}
