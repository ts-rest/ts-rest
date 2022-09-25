import type { Component } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';
import { initClient } from '@ts-rest/core';
import { postsApi } from '@ts-rest/example-microservice/util-posts-api';

const client = initClient(postsApi, {
  baseUrl: 'http://localhost:5003',
  baseHeaders: {},
});

client.getPosts({ query: {} }).then(console.log);

const App: Component = () => {
  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <img src={logo} class={styles.logo} alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          class={styles.link}
          href="https://github.com/solidjs/solid"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Solid
        </a>
      </header>
    </div>
  );
};

export default App;
