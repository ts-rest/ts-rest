import React from 'react';

type FeatureItem = {
  title: string;
  description: JSX.Element;
  icon: React.ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="feather feather-code"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: 'RPC-like Client With No Codegen',
    description: (
      <>Fully typed RPC-like client, with no need for code generation!</>
    ),
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="feather feather-check-circle"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    ),
    title: 'API Design Agnostic',
    description: (
      <>REST? HTTP-RPC? Your own custom hybrid? ts-rest doesn't care!</>
    ),
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="feather feather-zap"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: 'First Class DX',
    description: (
      <>
        Less unnecessary builds in monorepos, instant compile-time errors, and
        instantly view endpoint implementations through your IDEs "go to
        definition"
      </>
    ),
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="feather feather-package"
      >
        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    title: 'Framework Agnostic',
    description: (
      <>
        ts-rest comes with a whole host of support frameworks, including
        Express, Nest, Next and react-query!
      </>
    ),
  },
];

function Feature({ title, description, icon }: FeatureItem) {
  return (
    <div className="flex flex-row gap-6">
      <div>
        <div className="text-primary-dark dark:text-primary-lightest bg-purple-300/50 outline-purple-400 dark:bg-purple-700/30 w-14 h-14 outline dark:outline-purple-500/50 rounded-md flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="">
        <h3 className="mb-1">{title}</h3>
        <p className="">{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className="">
      <div className="container">
        <div className="grid gap-10 grid-cols-1 md:grid-cols-2">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
