import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

type FeatureItem = {
  title: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Magic RPC-like client 🪄',
    description: (
      <>
        tREST provides a simple, RPC like client to give you a fully typed
        client implementation.
      </>
    ),
  },
  {
    title: 'REST Under the Hood 🚀',
    description: (
      <>
        We don't abstract away from REST (or however your API is designed), we
        aim to let you use your API with other consumers as-is.
      </>
    ),
  },
  {
    title: 'Contract Driven 👮‍♀️',
    description: (
      <>
        No worrying about unnecessary rebuilds in monorepos, easy cross-repo API
        packages and more.
      </>
    ),
  },
];

function Feature({ title, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
