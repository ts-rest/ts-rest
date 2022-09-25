import React from 'react';

type FeatureItem = {
  title: string;
  description: JSX.Element;
  icon: string;
};

const FeatureList: FeatureItem[] = [
  {
    icon: '🪄',
    title: 'RPC-like Client Without Codegen',
    description: (
      <>
        Fully typed RPC-like client, with no need for code generation, reducing
        your bundle size as the types disappear at compile time.
      </>
    ),
  },
  {
    icon: '🚀',
    title: 'API Design Agnostic',
    description: (
      <>
        We don't abstract away from your API structure, we aim to let you use
        your API with other consumers as-is.
      </>
    ),
  },
  {
    icon: '❤️',
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
    icon: '✌️',
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
    <div className="flex flex-row gap-4">
      <div>
        <div className=" bg-emerald-200/50 outline-emerald-300 dark:bg-emerald-700/30 w-14 h-14 outline dark:outline-emerald-500/50 rounded-md flex items-center justify-center">
          <span className="text-3xl">{icon}</span>
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
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
